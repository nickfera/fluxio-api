import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  DeepPartial,
  FindOptionsRelations,
  FindOptionsWhere,
  Not,
} from "typeorm";
import { UserRepository } from "./user.repository";
import { TCreateUserSchema } from "./schema/createUser.schema";
import { ScryptService } from "../scrypt/scrypt.service";
import { UserEntity } from "./user.entity";
import { BadRequestValidationException } from "../common/error/badRequestValidation.exception";
import { UserVerificationService } from "src/userVerification/userVerification.service";
import { TUpdateAuthenticatedUserSchema } from "./schema/updateUser.schema";

type TFindOneUserByFieldOption = "id" | "email" | "phoneNumber";

type TUpdateUser = DeepPartial<UserEntity> &
  Pick<TUpdateAuthenticatedUserSchema, "newPassword">;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly scryptService: ScryptService,
    private readonly userConfirmationService: UserVerificationService,
  ) {}

  async create(createUser: TCreateUserSchema): Promise<UserEntity> {
    this.logger.debug(`Creating new user '${createUser.firstName}'.`);

    if (!createUser.email && !createUser.phoneNumber) {
      throw new BadRequestValidationException(
        ["email", "phoneNumber"],
        "An e-mail or phone number must be informed.",
      );
    }

    const where: FindOptionsWhere<UserEntity>[] = [];

    if (createUser.email) {
      where.push({ email: createUser.email });
    }

    if (createUser.phoneNumber) {
      where.push({ phoneNumber: createUser.phoneNumber });
    }

    const userExists = await this.userRepository.findOne(where);

    if (userExists) {
      throw new BadRequestValidationException(
        ["email", "phoneNumber"],
        "The e-mail or phone number is already being used.",
      );
    }

    const hashedPassword = await this.scryptService.hash(createUser.password);

    const user = await this.userRepository.save({
      firstName: createUser.firstName,
      lastName: createUser.lastName,
      email: createUser?.email,
      phoneNumber: createUser?.phoneNumber,
      password: hashedPassword,
      role: createUser?.role || "owner",
    });

    this.logger.debug(`New user '${user.firstName}' with id ${user.id} saved.`);

    if (user.email) {
      await this.userConfirmationService.create(user.id, "email");
    }

    if (user.phoneNumber) {
      await this.userConfirmationService.create(user.id, "phone");
    }

    return user;
  }

  async findOneBy(
    field: TFindOneUserByFieldOption,
    idOrEmailOrPhoneNumber: number | string,
    relations?: FindOptionsRelations<UserEntity>,
  ): Promise<UserEntity> {
    const where: FindOptionsWhere<UserEntity> = {};

    if (field === "id" && typeof idOrEmailOrPhoneNumber === "number") {
      where.id = idOrEmailOrPhoneNumber;
    } else if (
      field === "email" &&
      typeof idOrEmailOrPhoneNumber === "string"
    ) {
      where.email = idOrEmailOrPhoneNumber;
    } else if (
      field === "phoneNumber" &&
      typeof idOrEmailOrPhoneNumber === "string"
    ) {
      where.phoneNumber = idOrEmailOrPhoneNumber;
    } else {
      throw new BadRequestException(
        "Could not find user: invalid field or value",
      );
    }

    const user = await this.userRepository.findOne(where, relations);

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  async update(id: number, partialUser: TUpdateUser) {
    const user = await this.userRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      (partialUser.email && partialUser.email !== user.email) ||
      (partialUser.phoneNumber && partialUser.phoneNumber !== user.phoneNumber)
    ) {
      const where: FindOptionsWhere<UserEntity>[] = [];

      if (partialUser.email && partialUser.email !== user.email) {
        where.push({ email: partialUser.email, id: Not(user.id) });
      }

      if (
        partialUser.phoneNumber &&
        partialUser.phoneNumber !== user.phoneNumber
      ) {
        where.push({ phoneNumber: partialUser.phoneNumber, id: Not(user.id) });
      }

      const userExists = await this.userRepository.findOne(where);

      if (userExists) {
        throw new BadRequestValidationException(
          ["email", "phoneNumber"],
          "The e-mail or phone number is already being used.",
        );
      }
    }

    if (partialUser.password && partialUser.newPassword) {
      if (
        !(await this.scryptService.verify(partialUser.password, user.password))
      ) {
        throw new UnauthorizedException("Current password incorrect");
      }

      partialUser.password = await this.scryptService.hash(
        partialUser.newPassword,
      );

      delete partialUser.newPassword;
    } else {
      delete partialUser.password;
      delete partialUser.newPassword;
    }

    const updatedUser = await this.userRepository.save({
      ...user,
      ...partialUser,
    });

    if (updatedUser.email && updatedUser.email !== user.email) {
      await this.userConfirmationService.create(id, "email");
    }

    if (
      updatedUser.phoneNumber &&
      updatedUser.phoneNumber !== user.phoneNumber
    ) {
      await this.userConfirmationService.create(id, "phone");
    }

    return updatedUser;
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { FindOptionsWhere, Not } from "typeorm";
import { UserRepository } from "./user.repository";
import { TCreateUserSchema } from "./schema/createUser.schema";
import { ScryptService } from "../scrypt/scrypt.service";
import { UserEntity } from "./user.entity";
import {
  TUpdateAuthenticatedUserSchema,
  TUpdateUserSchema,
} from "./schema/updateUser.schema";
import { BadRequestValidationException } from "../common/error/badRequestValidation.exception";

type TFindOneUserByFieldOption = "id" | "email" | "phoneNumber";

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly scryptService: ScryptService,
  ) {}

  async create(createUser: TCreateUserSchema): Promise<UserEntity> {
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

    return await this.userRepository.save(
      new UserEntity({
        firstName: createUser.firstName,
        lastName: createUser.lastName,
        email: createUser?.email,
        phoneNumber: createUser?.phoneNumber,
        password: hashedPassword,
        role: createUser?.role || "owner",
      }),
    );
  }

  async findOneBy(
    field: TFindOneUserByFieldOption,
    idOrEmailOrPhoneNumber: number | string,
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

    const user = await this.userRepository.findOne(where);

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  async update(
    id: number,
    updateUser: TUpdateUserSchema & TUpdateAuthenticatedUserSchema,
  ) {
    const user = await this.userRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      (updateUser.email && updateUser.email !== user.email) ||
      (updateUser.phoneNumber && updateUser.phoneNumber !== user.phoneNumber)
    ) {
      const where: FindOptionsWhere<UserEntity>[] = [];

      if (updateUser.email && updateUser.email !== user.email) {
        where.push({ email: updateUser.email, id: Not(user.id) });
      }

      if (
        updateUser.phoneNumber &&
        updateUser.phoneNumber !== user.phoneNumber
      ) {
        where.push({ phoneNumber: updateUser.phoneNumber, id: Not(user.id) });
      }

      const userExists = await this.userRepository.findOne(where);

      if (userExists) {
        throw new BadRequestValidationException(
          ["email", "phoneNumber"],
          "The e-mail or phone number is already being used.",
        );
      }
    }

    if (updateUser.password && updateUser.newPassword) {
      if (
        !(await this.scryptService.verify(updateUser.password, user.password))
      ) {
        throw new UnauthorizedException("Current password incorrect");
      }

      updateUser.password = await this.scryptService.hash(
        updateUser.newPassword,
      );

      delete updateUser.newPassword;
    } else {
      delete updateUser.password;
      delete updateUser.newPassword;
    }

    return await this.userRepository.save({ ...user, ...updateUser });
  }
}

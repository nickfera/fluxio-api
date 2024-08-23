import { createHmac, randomInt } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { FindOptionsWhere } from "typeorm";
import {
  TUserVerificationType,
  UserVerificationEntity,
} from "./userVerification.entity";
import { UserVerificationRepository } from "./userVerification.repository";

const verificationSecret = process.env.VERIFICATION_SECRET || "0123456789";

@Injectable()
export class UserVerificationService {
  private readonly logger = new Logger(UserVerificationService.name);

  constructor(
    private readonly userVerificationRepository: UserVerificationRepository,
  ) {}

  async create(
    userId: number,
    verificationType: TUserVerificationType,
  ): Promise<void> {
    this.logger.debug(
      `Creating verification token for user ${userId}, type '${verificationType}'.`,
    );

    const token = this.generateToken();

    this.logger.debug(`Random token generated: '${token}'.`);

    const tokenHash = this.generateTokenHash(token);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await this.userVerificationRepository.save({
      userId,
      verificationType,
      tokenHash,
      expiresAt,
      isVerified: false,
    });

    this.logger.debug(`User verification saved; expires at ${expiresAt}.`);
  }

  async verify(
    token: string,
    options: {
      userId?: number;
      email?: string;
      phoneNumber?: string;
    },
  ): Promise<void> {
    this.logger.debug("Starting user verification of token...");

    if (!options.userId && !options.email && !options.phoneNumber) {
      throw new BadRequestException(
        "User, e-mail or phone number must be informed to verify token.",
      );
    } else if (options.email && options.phoneNumber) {
      throw new BadRequestException(
        "Either an e-mail or phone number to verify token.",
      );
    }

    const tokenHash = this.generateTokenHash(token);

    const findOneOptions: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash,
      isVerified: false,
    };

    if (options.userId) {
      findOneOptions.userId = options.userId;
    } else if (options.email) {
      findOneOptions.user = { email: options.email };
    } else if (options.phoneNumber) {
      findOneOptions.user = { phoneNumber: options.phoneNumber };
    }

    const userVerification =
      await this.userVerificationRepository.findOne(findOneOptions);

    if (!userVerification) {
      throw new NotFoundException("Incorrect token.");
    }

    const nowMillis = new Date(Date.now()).valueOf();
    const expiresAtMillis = new Date(userVerification.expiresAt).valueOf();

    if (nowMillis > expiresAtMillis) {
      throw new NotFoundException("Token has expired.");
    }

    userVerification.tokenHash = null;
    userVerification.isVerified = true;

    await this.userVerificationRepository.save(userVerification);
  }

  async regenerate(options: {
    email?: string;
    phoneNumber?: string;
  }): Promise<void> {
    this.logger.debug(
      `Starting generation of new token for an existing user verification...`,
    );

    if (!options.email && !options.phoneNumber) {
      throw new BadRequestException(
        "An e-mail or phone number must be informed to generate a new verification token.",
      );
    } else if (options.email && options.phoneNumber) {
      throw new BadRequestException(
        "Either an e-mail or phone number to verify token.",
      );
    }

    const findOneOptions: FindOptionsWhere<UserVerificationEntity> = {
      isVerified: false,
    };

    if (options.email) {
      findOneOptions.user = { email: options.email };
    } else if (options.phoneNumber) {
      findOneOptions.user = { phoneNumber: options.phoneNumber };
    }

    const userVerification =
      await this.userVerificationRepository.findOne(findOneOptions);

    if (!userVerification) {
      throw new NotFoundException("User verification not found.");
    }

    const token = this.generateToken();

    this.logger.debug(`Random token generated: '${token}'.`);

    const tokenHash = this.generateTokenHash(token);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    userVerification.tokenHash = tokenHash;
    userVerification.expiresAt = expiresAt;

    await this.userVerificationRepository.save(userVerification);

    this.logger.debug(`User verification updated; expires at ${expiresAt}.`);
  }

  generateToken(): string {
    return `${randomInt(100, 999)}${randomInt(100, 999)}`;
  }

  generateTokenHash(token: string): string {
    return createHmac("sha256", verificationSecret).update(token).digest("hex");
  }
}

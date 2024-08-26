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
import { MessageService } from "src/message/message.service";
import { UserEntity } from "src/user/user.entity";

const verificationSecret = process.env.VERIFICATION_SECRET || "0123456789";

@Injectable()
export class UserVerificationService {
  private readonly logger = new Logger(UserVerificationService.name);

  constructor(
    private readonly userVerificationRepository: UserVerificationRepository,
    private readonly messageService: MessageService,
  ) {}

  async create(
    userId: number,
    verificationType: TUserVerificationType,
    emailOrPhoneNumber: string,
  ): Promise<void> {
    this.logger.debug(
      `Creating verification token for user ${userId}, type '${verificationType}'.`,
    );

    const token = this.generateToken();

    const tokenHash = this.generateTokenHash(token);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.userVerificationRepository.save({
      userId,
      verificationType,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      isVerified: false,
    });

    if (verificationType === "email") {
      this.messageService.sendEmail({
        subject: "Fluxio - Verify your e-mail address",
        recipient: emailOrPhoneNumber,
        message: `To verify your e-mail address, inform this token: ${token}. It will expire in 30 minutes (${expiresAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}).`,
      });
    } else if (verificationType === "phone") {
      this.messageService.sendSMS({
        recipient: emailOrPhoneNumber,
        message: `Verification token: ${token}. It will expire in 30 minutes (${expiresAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}).`,
      });
    }
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

    const userVerification = (await this.userVerificationRepository.findOne(
      findOneOptions,
      { user: true },
    )) as (UserVerificationEntity & { user: UserEntity }) | null;

    if (!userVerification) {
      throw new NotFoundException("Incorrect token.");
    }

    const { user, ...verification } = userVerification;

    const nowMillis = new Date(Date.now()).valueOf();
    const expiresAtMillis = new Date(verification.expiresAt).valueOf();

    if (nowMillis > expiresAtMillis) {
      throw new NotFoundException("Token has expired.");
    }

    verification.tokenHash = null;
    verification.isVerified = true;

    await this.userVerificationRepository.save(verification);

    if (verification.verificationType === "email" && user.email) {
      this.messageService.sendEmail({
        subject: "Fluxio - Your e-mail has been verified",
        recipient: user.email,
        message: `Your e-mail has been verified successfully`,
      });
    } else if (verification.verificationType === "phone" && user.phoneNumber) {
      this.messageService.sendSMS({
        recipient: user.phoneNumber,
        message: `Your phone number has been verified successfully`,
      });
    }
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

    const tokenHash = this.generateTokenHash(token);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    userVerification.tokenHash = tokenHash;
    userVerification.expiresAt = expiresAt.toISOString();

    await this.userVerificationRepository.save(userVerification);

    if (options.email) {
      this.messageService.sendEmail({
        subject: "Fluxio - Verify your e-mail address",
        recipient: options.email,
        message: `To verify your e-mail address, inform this token: ${token}. It will expire in 30 minutes (${expiresAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}).`,
      });
    } else if (options.phoneNumber) {
      this.messageService.sendSMS({
        recipient: options.phoneNumber,
        message: `Verification token: ${token}. It will expire in 30 minutes (${expiresAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}).`,
      });
    }
  }

  generateToken(): string {
    return `${randomInt(100, 999)}${randomInt(100, 999)}`;
  }

  generateTokenHash(token: string): string {
    return createHmac("sha256", verificationSecret).update(token).digest("hex");
  }
}

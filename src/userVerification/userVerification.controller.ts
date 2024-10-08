import { Request } from "express";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ZodValidationPipe } from "../common/pipe/zodValidation.pipe";
import { UserVerificationService } from "./userVerification.service";
import { AuthUnverifiedGuard } from "src/auth/guard/authUnverified.guard";
import {
  TVerifyEmailTokenSchema,
  TVerifyPhoneNumberTokenSchema,
  TVerifyTokenSchema,
  verifyEmailTokenSchema,
  verifyPhoneNumberTokenSchema,
  verifyTokenSchema,
} from "./schema/verifyToken.schema";
import {
  regenerateEmailTokenSchema,
  regeneratePhoneNumberTokenSchema,
  TRegenerateEmailTokenSchema,
  TRegeneratePhoneNumberTokenSchema,
} from "./schema/regenerateToken.schema";
import { TUser, User } from "src/common/decorators";

@Controller("user-verification")
export class UserVerificationController {
  constructor(
    private readonly userVerificationService: UserVerificationService,
  ) {}

  @Patch("")
  @UseGuards(AuthUnverifiedGuard)
  @UsePipes(new ZodValidationPipe(verifyTokenSchema, "body"))
  @HttpCode(HttpStatus.OK)
  async verifyToken(
    @Req() req: Request,
    @User() user: TUser,
    @Body() { token }: TVerifyTokenSchema,
  ) {
    await this.userVerificationService.verify(token, {
      userId: user.id,
    });

    if (req.isAuthenticated() && req.user.pendingUserVerifications) {
      delete req.user.pendingUserVerifications;
    }

    return;
  }

  @Patch("/email")
  @UsePipes(new ZodValidationPipe(verifyEmailTokenSchema, "body"))
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Req() req: Request,
    @Body() { token, email }: TVerifyEmailTokenSchema,
  ) {
    await this.userVerificationService.verify(token, { email });

    if (req.isAuthenticated() && req.user.pendingUserVerifications) {
      delete req.user.pendingUserVerifications;
    }

    return;
  }

  @Patch("/phone-number")
  @UsePipes(new ZodValidationPipe(verifyPhoneNumberTokenSchema, "body"))
  @HttpCode(HttpStatus.OK)
  async verifyPhoneNumber(
    @Req() req: Request,
    @Body() { token, phoneNumber }: TVerifyPhoneNumberTokenSchema,
  ) {
    await this.userVerificationService.verify(token, { phoneNumber });

    if (req.isAuthenticated() && req.user.pendingUserVerifications) {
      delete req.user.pendingUserVerifications;
    }

    return;
  }

  @Put("/email")
  @UsePipes(new ZodValidationPipe(regenerateEmailTokenSchema, "body"))
  @HttpCode(HttpStatus.OK)
  async regenerateEmailToken(@Body() { email }: TRegenerateEmailTokenSchema) {
    return await this.userVerificationService.regenerate({ email });
  }

  @Put("/phone-number")
  @UsePipes(new ZodValidationPipe(regeneratePhoneNumberTokenSchema, "body"))
  @HttpCode(HttpStatus.OK)
  async regeneratePhoneNumberToken(
    @Body() { phoneNumber }: TRegeneratePhoneNumberTokenSchema,
  ) {
    return await this.userVerificationService.regenerate({ phoneNumber });
  }
}

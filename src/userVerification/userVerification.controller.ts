import { Request } from "express";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
    @Body() { token }: TVerifyTokenSchema,
    @Req() req: Request,
  ) {
    return await this.userVerificationService.verify(token, {
      userId: req.user?.id,
    });
  }

  @Patch("/email")
  @UsePipes(new ZodValidationPipe(verifyEmailTokenSchema, "body"))
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() { token, email }: TVerifyEmailTokenSchema) {
    return await this.userVerificationService.verify(token, { email });
  }

  @Patch("/phone-number")
  @UsePipes(new ZodValidationPipe(verifyPhoneNumberTokenSchema, "body"))
  @HttpCode(HttpStatus.OK)
  async verifyPhoneNumber(
    @Body() { token, phoneNumber }: TVerifyPhoneNumberTokenSchema,
  ) {
    return await this.userVerificationService.verify(token, { phoneNumber });
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

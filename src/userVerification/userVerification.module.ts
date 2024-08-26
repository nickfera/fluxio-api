import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserVerificationEntity } from "./userVerification.entity";
import { UserVerificationRepository } from "./userVerification.repository";
import { UserVerificationService } from "./userVerification.service";
import { UserVerificationController } from "./userVerification.controller";
import { MessageModule } from "src/message/message.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserVerificationEntity]), MessageModule],
  providers: [UserVerificationRepository, UserVerificationService],
  controllers: [UserVerificationController],
  exports: [UserVerificationService],
})
export class UserVerificationModule {}

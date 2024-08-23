import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./user.entity";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { ScryptService } from "../scrypt/scrypt.service";
import { UserController } from "./user.controller";
import { UserVerificationModule } from "src/userVerification/userVerification.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), UserVerificationModule],
  providers: [UserRepository, UserService, ScryptService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}

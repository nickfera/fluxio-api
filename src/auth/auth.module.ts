import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { UserModule } from "../user/user.module";
import { AuthService } from "./auth.service";
import { ScryptService } from "../scrypt/scrypt.service";
import { LocalStrategy } from "./strategy/local.strategy";
import { SessionSerializer } from "./session.serializer";

@Module({
  imports: [UserModule, PassportModule.register({ session: true })],
  controllers: [],
  providers: [AuthService, ScryptService, LocalStrategy, SessionSerializer],
})
export class AuthModule {}

import "dotenv/config";

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { dbSourceOptions } from "./config/typeorm";
import {
  development_pinoHttpOptions,
  production_pinoHttpOptions,
} from "./config/pino";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { UserVerificationModule } from "./userVerification/userVerification.module";
import { MessageModule } from "./message/message.module";
import { AreaModule } from "./area/area.module";
import { ObserverModule } from "./observer/observer.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(dbSourceOptions),
    LoggerModule.forRoot({
      pinoHttp:
        process.env.NODE_ENV === "development"
          ? development_pinoHttpOptions
          : production_pinoHttpOptions,
    }),
    UserModule,
    AuthModule,
    UserVerificationModule,
    EventEmitterModule.forRoot({
      delimiter: ".",
      maxListeners: 1,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    MessageModule,
    AreaModule,
    ObserverModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

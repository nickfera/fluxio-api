import "dotenv/config";

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dbSourceOptions } from "./config/typeorm";
import { UserModule } from "./user/user.module";
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [
    TypeOrmModule.forRoot(dbSourceOptions),
    LoggerModule.forRoot({
      pinoHttp:
        process.env.NODE_ENV === "development"
          ? {
              transport: {
                target: "pino-pretty",
                options: {
                  colorize: true,
                },
              },
            }
          : undefined,
    }),
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import "dotenv/config";

import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "nestjs-pino";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
import * as passport from "passport";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filter/allExceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  app.setGlobalPrefix("/api/v1");

  app.useLogger(app.get(Logger));

  app.set("trust proxy");

  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "api-secret",
      name: "fluxio-api.sid",
      cookie: {
        httpOnly: true,
        path: "/",
        sameSite: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 12 * 60 * 60 * 1000,
      },
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

import "dotenv/config";

import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "nestjs-pino";
import { AllExceptionsFilter } from "./common/filter/allExceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  app.setGlobalPrefix("/api/v1");

  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { BadRequestValidationException } from "../error/badRequestValidation.exception";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const message =
      exception instanceof Error || exception instanceof HttpException
        ? exception.message
        : "Unknown Error";

    const stack =
      exception instanceof Error || exception instanceof HttpException
        ? exception.stack
        : exception;

    this.logger.error(message, stack);

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let exceptionResponse: string | any | undefined =
      (exception instanceof HttpException && exception.getResponse()) ||
      undefined;

    if (!exceptionResponse || typeof exceptionResponse === "string") {
      exceptionResponse = {
        message: "An unknown error has occured",
        error: "Internal Server Error",
        statusCode: httpStatus,
      };
    }

    const response: any = {
      ...exceptionResponse,
      message: exception.message || exceptionResponse?.message,
    };

    if (
      typeof response === "object" &&
      exception instanceof BadRequestValidationException
    ) {
      exception.fields && (response.fields = exception.fields);
    }

    httpAdapter.reply(ctx.getResponse(), response, httpStatus);
  }
}

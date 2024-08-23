import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Paramtype,
} from "@nestjs/common";
import { ZodSchema } from "zod";
import { BadRequestValidationException } from "../error/badRequestValidation.exception";

export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private type: Paramtype,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      if (this.type !== metadata.type) {
        return value;
      }

      const parsedValue = this.schema.parse(value);

      return parsedValue;
    } catch (error) {
      const errors = error?.errors;

      if (!!errors && Array.isArray(errors)) {
        const fields: string[] = errors.map(
          (error) =>
            error.path && Array.isArray(error.path) && error.path.join("."),
        );

        throw new BadRequestValidationException(fields);
      }

      throw new BadRequestException("Validation failed");
    }
  }
}

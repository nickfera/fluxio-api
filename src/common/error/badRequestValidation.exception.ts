import { BadRequestException } from "@nestjs/common";

export class BadRequestValidationException extends BadRequestException {
  fields: string[];

  constructor(fields: string[], message?: string) {
    super();

    this.message = message || "Validation failed";
    this.fields = fields;
  }
}

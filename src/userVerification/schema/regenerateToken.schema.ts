import { z } from "zod";

export const regenerateEmailTokenSchema = z.object({
  email: z.string().email().max(255).trim(),
});

export type TRegenerateEmailTokenSchema = z.infer<
  typeof regenerateEmailTokenSchema
>;

export const regeneratePhoneNumberTokenSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/\d{1,20}/)
    .max(20)
    .trim(),
});

export type TRegeneratePhoneNumberTokenSchema = z.infer<
  typeof regeneratePhoneNumberTokenSchema
>;

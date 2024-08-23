import { z } from "zod";

export const verifyTokenSchema = z.object({
  token: z.string().regex(/\d{6}/),
});

export type TVerifyTokenSchema = z.infer<typeof verifyTokenSchema>;

export const verifyEmailTokenSchema = verifyTokenSchema.extend({
  email: z.string().email().max(255).trim(),
});

export type TVerifyEmailTokenSchema = z.infer<typeof verifyEmailTokenSchema>;

export const verifyPhoneNumberTokenSchema = verifyTokenSchema.extend({
  phoneNumber: z
    .string()
    .regex(/\d{1,20}/)
    .max(20)
    .trim(),
});

export type TVerifyPhoneNumberTokenSchema = z.infer<
  typeof verifyPhoneNumberTokenSchema
>;

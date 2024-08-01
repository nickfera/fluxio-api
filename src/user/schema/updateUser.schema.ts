import { z } from "zod";
import { UserRoles } from "../user.entity";

export const updateUserSchema = z
  .object({
    firstName: z.string().max(50).trim(),
    lastName: z.string().max(50).trim(),
    email: z.string().email().max(255).trim().nullable(),
    phoneNumber: z
      .string()
      .regex(/\d{1,20}/)
      .max(20)
      .trim()
      .nullable(),
    role: z.enum(UserRoles),
  })
  .partial();

export type TUpdateUserSchema = z.infer<typeof updateUserSchema>;

export const updateAuthenticatedUserSchema = updateUserSchema
  .omit({ role: true })
  .extend({
    password: z.string().min(8).max(30),
    newPassword: z.string().min(8).max(30),
  })
  .partial();

export type TUpdateAuthenticatedUserSchema = z.infer<
  typeof updateAuthenticatedUserSchema
>;

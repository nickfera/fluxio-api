import { z } from "zod";
import { UserRoles } from "../user.entity";

export const createUserSchema = z.object({
  firstName: z.string().max(50).trim(),
  lastName: z.string().max(50).trim(),
  email: z.string().email().max(255).trim().optional(),
  phoneNumber: z
    .string()
    .regex(/\d{1,20}/)
    .max(20)
    .trim()
    .optional(),
  password: z.string().min(8).max(30),
  role: z.enum(UserRoles).optional(),
});

export type TCreateUserSchema = z.infer<typeof createUserSchema>;

export const createUserPublicSchema = createUserSchema.omit({ role: true });

export type TCreateUserPublicSchema = z.infer<typeof createUserPublicSchema>;

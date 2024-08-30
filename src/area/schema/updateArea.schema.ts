import { z } from "zod";

export const updateAreaSchema = z.object({
  name: z.string().max(50).trim().optional(),
  active: z.boolean().default(true).optional(),
});

export type TUpdateArea = z.infer<typeof updateAreaSchema>;

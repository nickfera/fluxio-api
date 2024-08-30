import { z } from "zod";

export const createAreaSchema = z.object({
  name: z.string().max(50).trim(),
  active: z.boolean().default(true),
});

export type TCreateArea = z.infer<typeof createAreaSchema>;

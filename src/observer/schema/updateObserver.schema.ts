import { z } from "zod";

export const updateObserverSchema = z.object({
  name: z.string().max(50).trim().optional(),
  active: z.boolean().optional(),
});

export type TUpdateObserver = z.infer<typeof updateObserverSchema>;

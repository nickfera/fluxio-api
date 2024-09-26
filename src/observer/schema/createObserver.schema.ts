import { z } from "zod";

export const createObserverSchema = z.object({
  name: z.string().max(50).trim(),
  active: z.boolean().default(true),
  areaId: z.number().int(),
});

export type TCreateObserver = z.infer<typeof createObserverSchema>;

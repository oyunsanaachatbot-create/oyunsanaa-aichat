import { z } from "zod";

export const taxonomyAssignmentSchema = z.object({
  categoryCode: z.string().trim().min(1).max(10),
  subcategoryCode: z.string().trim().min(1).max(10),
  taxonomyType: z.string().trim().min(1).max(300),
  primaryTagKey: z.string().trim().min(1).max(500),
  additionalTagKeys: z.array(z.string().trim().min(1).max(500)).max(4),
});

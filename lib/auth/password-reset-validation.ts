import { z } from "zod";

import { isPasswordResetToken } from "./password-reset-token";

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().refine(isPasswordResetToken),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
  });

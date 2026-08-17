import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function createPasswordResetToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isPasswordResetToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

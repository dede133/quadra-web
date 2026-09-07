import "server-only";
import { createHash, randomBytes } from "node:crypto";

export function createToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createPublicSlug(): string {
  return randomBytes(5)
    .toString("base64url")
    .replace(/[-_]/g, "")
    .slice(0, 7)
    .toUpperCase();
}

import crypto from "crypto";

export function cryptoSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

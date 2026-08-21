import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function roomSessionCookieName(roomCode: string): string {
  return `scketch-room-${roomCode}`;
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

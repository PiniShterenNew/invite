import crypto from "node:crypto";
import { cookies } from "next/headers";

// Event access codes: scrypt-hashed (codes are short, never stored plain).
// A verified code is remembered per event in an httpOnly signed cookie so
// guests don't retype it on every visit.

export function hashAccessCode(code: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(code.trim(), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyAccessCode(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(code.trim(), salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

const cookieSecret = () => process.env.AUTH_SECRET ?? "dev-secret";

function sign(value: string): string {
  return crypto.createHmac("sha256", cookieSecret()).update(value).digest("hex").slice(0, 32);
}

export async function grantCodeAccess(eventId: string) {
  const jar = await cookies();
  jar.set(`ea_${eventId}`, sign(eventId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 3600,
    path: "/",
  });
}

export async function hasCodeAccess(eventId: string): Promise<boolean> {
  const jar = await cookies();
  const v = jar.get(`ea_${eventId}`)?.value;
  return Boolean(v && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(sign(eventId))));
}

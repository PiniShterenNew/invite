import { createHmac } from "node:crypto";

const SECRET = () => process.env.AUTH_SECRET ?? "dev-secret-do-not-use-in-production";
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function sign(payload: string): string {
  return createHmac("sha256", SECRET()).update(payload).digest("base64url");
}

export function createResetToken(email: string, currentHash: string | null): string {
  const exp = Date.now() + RESET_TTL_MS;
  const hashPrefix = (currentHash ?? "none").slice(0, 10);
  const payload = `${email}:${exp}:${hashPrefix}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyResetToken(token: string, currentHash: string | null): { email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 4) return null;

    const sig = parts.pop()!;
    const payload = parts.join(":");
    if (sign(payload) !== sig) return null;

    const [email, expStr, hashPrefix] = parts;
    if (Date.now() > Number(expStr)) return null;

    const expectedPrefix = (currentHash ?? "none").slice(0, 10);
    if (hashPrefix !== expectedPrefix) return null;

    return { email };
  } catch {
    return null;
  }
}

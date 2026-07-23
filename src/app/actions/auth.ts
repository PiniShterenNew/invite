"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema, passwordSchema, emailSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { createResetToken, verifyResetToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";
import { t } from "@/lib/i18n/he";

export async function registerUser(_prev: { error?: string } | null, formData: FormData) {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: t.auth.invalidCredentials };

  const { email, password, name } = parsed.data;

  if (!rateLimit(`register:${email}`, 5, 60_000 * 15)) {
    return { error: t.common.tooManyRequests };
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    return { error: t.auth.emailExists };
  }

  const hashed = await hashPassword(password);

  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { passwordHash: hashed, name: name ?? existing.name } });
  } else {
    await db.user.create({ data: { email, passwordHash: hashed, name } });
  }

  const url = await signIn("credentials", { email, password, redirect: false });
  if (!url || url.includes("error")) return { error: t.auth.invalidCredentials };
  redirect("/app");
}

export async function loginWithPassword(_prev: { error?: string } | null, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: t.auth.invalidCredentials };

  if (!rateLimit(`login:${email}`, 10, 60_000 * 15)) {
    return { error: t.common.tooManyRequests };
  }

  const url = await signIn("credentials", { email, password, redirect: false });
  if (!url || url.includes("error")) return { error: t.auth.invalidCredentials };
  redirect("/app");
}

export async function requestPasswordReset(_prev: { error?: string; sent?: boolean } | null, formData: FormData) {
  const rawEmail = formData.get("email");
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { error: t.auth.invalidEmail };

  const email = parsed.data;

  if (!rateLimit(`reset:${email}`, 3, 60_000 * 15)) {
    return { error: t.common.tooManyRequests };
  }

  const user = await db.user.findUnique({ where: { email } });

  // Always show success to prevent email enumeration
  if (!user) return { sent: true };

  const token = createResetToken(email, user.passwordHash);
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
  const resetUrl = `${baseUrl}/login/reset?token=${token}`;

  const mail = passwordResetEmail(resetUrl);
  await sendEmail({ to: email, ...mail });

  return { sent: true };
}

export async function resetPassword(_prev: { error?: string; done?: boolean } | null, formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) return { error: t.auth.invalidCredentials };

  const pwParsed = passwordSchema.safeParse(password);
  if (!pwParsed.success) return { error: t.auth.passwordTooShort };

  if (password !== confirmPassword) return { error: t.auth.passwordMismatch };

  // We need to find the user first to verify the token against their current hash
  // Decode the token to extract the email
  const decoded = Buffer.from(token, "base64url").toString("utf8");
  const emailFromToken = decoded.split(":")[0];
  if (!emailFromToken) return { error: t.auth.resetExpired };

  const user = await db.user.findUnique({ where: { email: emailFromToken } });
  if (!user) return { error: t.auth.resetExpired };

  const verified = verifyResetToken(token, user.passwordHash);
  if (!verified) return { error: t.auth.resetExpired };

  const hashed = await hashPassword(password);
  await db.user.update({ where: { email: verified.email }, data: { passwordHash: hashed } });

  return { done: true };
}

"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
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
    return { error: t.common.tooManyRequests ?? "נסו שוב מאוחר יותר" };
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

  await signIn("credentials", { email, password, redirectTo: "/app" });
  redirect("/app");
}

export async function loginWithPassword(_prev: { error?: string } | null, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: t.auth.invalidCredentials };

  if (!rateLimit(`login:${email}`, 10, 60_000 * 15)) {
    return { error: t.common.tooManyRequests ?? "נסו שוב מאוחר יותר" };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/app" });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "type" in e && (e as { type: string }).type === "CredentialsSignin") {
      return { error: t.auth.invalidCredentials };
    }
    throw e;
  }

  redirect("/app");
}

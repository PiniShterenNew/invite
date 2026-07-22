"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/validation/schemas";
import { t } from "@/lib/i18n/he";
import type { ActionResult } from "@/app/actions/guest";

export async function submitReport(raw: unknown): Promise<ActionResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`report:${ip}`, 5, 60_000)) return { ok: false, error: t.errors.rateLimited };

  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: t.errors.invalidInput };

  await db.report.create({ data: parsed.data });
  return { ok: true };
}

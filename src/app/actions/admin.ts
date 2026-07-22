"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminOrThrow, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/services/lifecycle";
import { t } from "@/lib/i18n/he";
import type { ActionResult } from "@/app/actions/guest";

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof AuthzError) return { ok: false, error: t.errors.unauthorized };
  console.error("[admin-action]", e instanceof Error ? e.message : e);
  return { ok: false, error: t.common.error };
}

export async function adminToggleEvent(eventId: string, disable: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrThrow();
    await db.event.update({ where: { id: eventId }, data: { disabledAt: disable ? new Date() : null } });
    await audit("ADMIN", admin.id, eventId, disable ? "admin.disable_event" : "admin.enable_event");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function adminRemoveProfile(profileId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrThrow();
    const profile = await db.attendeeProfile.findUnique({ where: { id: profileId }, include: { guest: true } });
    if (!profile) return { ok: false, error: t.errors.notFound };
    await db.attendeeProfile.update({ where: { id: profileId }, data: { removedByAdminAt: new Date() } });
    await audit("ADMIN", admin.id, profile.guest.eventId, "admin.remove_profile", { profileId });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function adminResolveReport(reportId: string, status: "RESOLVED" | "DISMISSED"): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrThrow();
    await db.report.update({ where: { id: reportId }, data: { status, handledBy: admin.id, handledAt: new Date() } });
    await audit("ADMIN", admin.id, null, "admin.handle_report", { reportId, status });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

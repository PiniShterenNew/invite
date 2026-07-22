import { db } from "@/lib/db";
import {
  ANONYMIZE_DAYS_AFTER_END,
  ANONYMIZE_WARNING_DAYS_BEFORE,
  GUEST_LIST_VISIBLE_DAYS_AFTER_END,
} from "@/lib/constants";
import { deleteImage } from "@/lib/storage";
import { sendEmail } from "@/lib/email/send";
import { preAnonWarningEmail } from "@/lib/email/templates";

// Event lifecycle jobs — invoked by /api/cron/lifecycle (Vercel Cron) and
// runnable manually via `npm run lifecycle`. Idempotent by design.

const days = (n: number) => n * 24 * 3600_000;

export function effectiveEnd(event: { startsAt: Date; endsAt: Date | null }): Date {
  // Without an explicit end, an event is considered over 6h after start.
  return event.endsAt ?? new Date(event.startsAt.getTime() + 6 * 3600_000);
}

export function guestListVisible(event: { status: string; endedAt: Date | null }, now = new Date()): boolean {
  if (event.status === "PUBLISHED") return true;
  if (event.status !== "ENDED" || !event.endedAt) return false;
  return now.getTime() - event.endedAt.getTime() < days(GUEST_LIST_VISIBLE_DAYS_AFTER_END);
}

/** Marks published events whose time has passed as ENDED. */
export async function markEndedEvents(now = new Date()): Promise<number> {
  const candidates = await db.event.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, startsAt: true, endsAt: true },
  });
  let count = 0;
  for (const e of candidates) {
    if (effectiveEnd(e) < now) {
      await db.event.update({ where: { id: e.id }, data: { status: "ENDED", endedAt: effectiveEnd(e) } });
      await audit("SYSTEM", null, e.id, "lifecycle.end");
      count++;
    }
  }
  return count;
}

/** Emails organizers ~7 days before anonymization, once. */
export async function sendPreAnonWarnings(appUrl: string, now = new Date()): Promise<number> {
  const threshold = new Date(now.getTime() - days(ANONYMIZE_DAYS_AFTER_END - ANONYMIZE_WARNING_DAYS_BEFORE));
  const events = await db.event.findMany({
    where: { status: { in: ["ENDED", "ARCHIVED"] }, endedAt: { lt: threshold }, warnedAt: null, anonymizedAt: null },
    include: { organizer: { select: { email: true } } },
  });
  let count = 0;
  for (const e of events) {
    const mail = preAnonWarningEmail(e.name, `${appUrl}/app/events/${e.id}/guests`, ANONYMIZE_WARNING_DAYS_BEFORE);
    const res = await sendEmail({ to: e.organizer.email, ...mail });
    if (res.ok) {
      await db.event.update({ where: { id: e.id }, data: { warnedAt: now } });
      count++;
    }
  }
  return count;
}

/**
 * Anonymizes guest PII 90 days after an event ended: names become generic,
 * phones/messages/free-text answers and profiles (incl. photos) are removed.
 * Aggregate counts (rsvp status + party size) survive for the organizer's
 * archive. Personal links stop resolving to a person.
 */
export async function anonymizePastEvents(now = new Date()): Promise<number> {
  const threshold = new Date(now.getTime() - days(ANONYMIZE_DAYS_AFTER_END));
  const events = await db.event.findMany({
    where: { status: { in: ["ENDED", "ARCHIVED"] }, endedAt: { lt: threshold }, anonymizedAt: null },
    select: { id: true },
  });
  for (const e of events) await anonymizeEvent(e.id, now);
  return events.length;
}

export async function anonymizeEvent(eventId: string, now = new Date()): Promise<void> {
  const profiles = await db.attendeeProfile.findMany({
    where: { guest: { eventId } },
    select: { id: true, photo: true },
  });
  for (const p of profiles) if (p.photo) await deleteImage(p.photo);

  await db.$transaction([
    db.attendeeProfile.deleteMany({ where: { guest: { eventId } } }),
    // Free-text answers may contain personal details; drop all answers.
    db.rsvpAnswer.deleteMany({ where: { rsvp: { guest: { eventId } } } }),
    db.rsvp.updateMany({ where: { guest: { eventId } }, data: { message: null } }),
    db.guest.updateMany({ where: { eventId }, data: { name: "אורח/ת", phone: null } }),
    db.event.update({ where: { id: eventId }, data: { anonymizedAt: now } }),
    db.auditEvent.create({
      data: { actorType: "SYSTEM", eventId, action: "lifecycle.anonymize" },
    }),
  ]);
}

export async function audit(actorType: string, actorId: string | null, eventId: string | null, action: string, meta?: object) {
  await db.auditEvent.create({
    data: { actorType, actorId, eventId, action, metaJson: meta ? JSON.stringify(meta) : null },
  });
}

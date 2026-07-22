import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { dailyDigestEmail, rsvpNotifyEmail } from "@/lib/email/templates";
import { t } from "@/lib/i18n/he";

// Organizer notifications. New RSVPs enqueue an EmailJob; a processor
// (called opportunistically after RSVP writes and from the cron) batches
// jobs per event so a burst of responses becomes one email, not thirty.

const BATCH_WINDOW_MS = 15 * 60_000;

export async function enqueueRsvpNotification(eventId: string, guestName: string, status: string, partySize: number) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { organizer: { select: { email: true } } },
  });
  if (!event || event.notifyMode === "NONE") return;

  const statusLabel = status === "YES" ? t.dashboard.yes : status === "MAYBE" ? t.dashboard.maybe : t.dashboard.no;
  const line = `${guestName} — ${statusLabel}${status === "YES" && partySize > 1 ? ` (${partySize} ${t.dashboard.seats})` : ""}`;

  await db.emailJob.create({
    data: {
      type: event.notifyMode === "DAILY" ? "DAILY_DIGEST" : "RSVP_NOTIFY",
      toEmail: event.organizer.email,
      payloadJson: JSON.stringify({ eventId, eventName: event.name, line }),
      // Immediate mode still batches inside a short window to avoid flooding.
      scheduledAt: new Date(Date.now() + (event.notifyMode === "DAILY" ? 0 : BATCH_WINDOW_MS)),
    },
  });
}

/** Sends due RSVP_NOTIFY jobs, grouped per event+recipient. */
export async function processDueNotifications(appUrl: string, now = new Date()): Promise<number> {
  const due = await db.emailJob.findMany({
    where: { status: "PENDING", type: "RSVP_NOTIFY", scheduledAt: { lte: now } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return sendGrouped(due, appUrl, false);
}

/** Sends all pending DAILY_DIGEST jobs (cron calls this once a day). */
export async function processDailyDigests(appUrl: string): Promise<number> {
  const due = await db.emailJob.findMany({
    where: { status: "PENDING", type: "DAILY_DIGEST" },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  return sendGrouped(due, appUrl, true);
}

async function sendGrouped(jobs: { id: string; toEmail: string; payloadJson: string }[], appUrl: string, digest: boolean) {
  const groups = new Map<string, { ids: string[]; toEmail: string; eventId: string; eventName: string; lines: string[] }>();
  for (const job of jobs) {
    const p = JSON.parse(job.payloadJson) as { eventId: string; eventName: string; line: string };
    const key = `${job.toEmail}|${p.eventId}`;
    const g = groups.get(key) ?? { ids: [], toEmail: job.toEmail, eventId: p.eventId, eventName: p.eventName, lines: [] };
    g.ids.push(job.id);
    g.lines.push(p.line);
    groups.set(key, g);
  }

  let sent = 0;
  for (const g of groups.values()) {
    const url = `${appUrl}/app/events/${g.eventId}`;
    const mail = digest
      ? dailyDigestEmail(g.eventName, g.lines.join(" · "), url)
      : rsvpNotifyEmail(g.eventName, g.lines, url);
    const res = await sendEmail({ to: g.toEmail, ...mail });
    await db.emailJob.updateMany({
      where: { id: { in: g.ids } },
      data: res.ok ? { status: "SENT", sentAt: new Date() } : { status: "FAILED", error: res.error },
    });
    if (res.ok) sent += g.ids.length;
  }
  return sent;
}

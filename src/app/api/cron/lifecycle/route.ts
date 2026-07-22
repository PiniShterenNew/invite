import { markEndedEvents, sendPreAnonWarnings, anonymizePastEvents } from "@/lib/services/lifecycle";
import { processDueNotifications, processDailyDigests } from "@/lib/services/notify";

// Single daily cron entry point (Vercel Cron, see vercel.json). Protected by
// CRON_SECRET so it cannot be triggered by outsiders. Idempotent — safe to
// re-run or run more than once a day.

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const [ended, warned, anonymized, notified, digests] = await Promise.all([
    markEndedEvents(),
    sendPreAnonWarnings(appUrl),
    anonymizePastEvents(),
    processDueNotifications(appUrl),
    processDailyDigests(appUrl),
  ]);

  return Response.json({ ended, warned, anonymized, notified, digests });
}

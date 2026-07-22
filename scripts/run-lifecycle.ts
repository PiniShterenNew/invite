import "dotenv/config";
import { db } from "../src/lib/db";
import { markEndedEvents, sendPreAnonWarnings, anonymizePastEvents } from "../src/lib/services/lifecycle";
import { processDueNotifications, processDailyDigests } from "../src/lib/services/notify";

// Manual runner for the lifecycle jobs (same logic the Vercel Cron endpoint
// calls). Useful locally: `npm run lifecycle`.

async function main() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const ended = await markEndedEvents();
  const warned = await sendPreAnonWarnings(appUrl);
  const anonymized = await anonymizePastEvents();
  const notified = await processDueNotifications(appUrl);
  const digests = await processDailyDigests(appUrl);
  console.log({ ended, warned, anonymized, notified, digests });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

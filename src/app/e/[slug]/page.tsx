import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { buildEventView, buildViewerContext } from "@/lib/services/event-view";
import { confirmedSeats } from "@/lib/services/rsvp";
import { hasCodeAccess } from "@/lib/services/access";
import { EventPage } from "@/components/event/event-page";
import { NotFoundCard } from "@/components/event/not-found";
import { AccessCodeForm } from "@/components/event/access-code-form";

// General (shareable) event link. Guests RSVP with their name and get their
// own personal link. PERSONAL_ONLY events never render here; CODE events
// require the access code first (verified server-side, remembered in a
// signed cookie).

export default async function GeneralEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await db.event.findUnique({ where: { slug }, include: { questions: true } });

  if (!event || event.status === "DRAFT" || event.disabledAt) {
    return <NotFoundCard title={t.invite.notFound} text={t.invite.notFoundText} />;
  }
  if (event.accessMode === "PERSONAL_ONLY") {
    return <NotFoundCard title={t.invite.personalOnly} text={t.invite.notFoundText} />;
  }
  if (event.accessMode === "CODE" && !(await hasCodeAccess(event.id))) {
    return <AccessCodeForm slug={slug} eventName={event.name} />;
  }

  const seatsLeft = event.capacity == null ? null : Math.max(0, event.capacity - (await confirmedSeats(event.id)));

  const view = buildEventView(event, { kind: "general", rsvpStatus: null });
  const viewer = buildViewerContext(null, "general", seatsLeft, event.generalLinkMaxParty);

  return <EventPage event={view} viewer={viewer} />;
}

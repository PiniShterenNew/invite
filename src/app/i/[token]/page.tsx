import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { buildEventView, buildViewerContext } from "@/lib/services/event-view";
import { confirmedSeats } from "@/lib/services/rsvp";
import { EventPage } from "@/components/event/event-page";
import { NotFoundCard } from "@/components/event/not-found";

// Personal invitation page. The token in the URL is the guest's identity —
// unguessable (ADR-003), revocable by the organizer.

export default async function PersonalInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const guest = await db.guest.findUnique({
    where: { inviteToken: token },
    include: {
      event: { include: { questions: true } },
      rsvp: { include: { answers: true } },
      profile: { select: { id: true } },
    },
  });

  if (!guest || guest.event.status === "DRAFT" || guest.event.disabledAt) {
    return <NotFoundCard title={t.invite.notFound} text={t.invite.notFoundText} />;
  }

  // Record first open — honest tracking: "opened", never "delivered".
  if (!guest.linkOpenedAt) {
    await db.guest.update({ where: { id: guest.id }, data: { linkOpenedAt: new Date() } });
  }

  const event = guest.event;
  const seatsLeft =
    event.capacity == null ? null : Math.max(0, event.capacity - (await confirmedSeats(event.id, guest.id)));

  const view = buildEventView(event, { kind: "personal", rsvpStatus: guest.rsvp?.status ?? null });
  const viewer = buildViewerContext(guest, "personal", seatsLeft);

  return <EventPage event={view} viewer={viewer} />;
}

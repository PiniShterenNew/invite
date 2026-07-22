import { db } from "@/lib/db";
import { buildIcs } from "@/lib/format";
import { canSeeAddress } from "@/lib/services/event-view";

// Calendar download for a personal invite. Address is included only when
// this guest is allowed to see it (same reveal policy as the page).

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await db.guest.findUnique({
    where: { inviteToken: token },
    include: { event: true, rsvp: { select: { status: true } } },
  });
  if (!guest || guest.event.status === "DRAFT" || guest.event.disabledAt) {
    return new Response("not found", { status: 404 });
  }

  const event = guest.event;
  const showAddress = canSeeAddress(event, { kind: "personal", rsvpStatus: guest.rsvp?.status ?? null });
  const ics = buildIcs({
    name: event.name,
    description: event.description,
    locationName: event.locationName,
    locationAddress: showAddress ? event.locationAddress : null,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    slug: event.slug,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event.ics"`,
      "X-Robots-Tag": "noindex",
    },
  });
}

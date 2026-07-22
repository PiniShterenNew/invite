import { db } from "@/lib/db";

export interface EventStats {
  invitedGuests: number;
  yesGuests: number;
  maybeGuests: number;
  noGuests: number;
  pendingGuests: number;
  openedLinks: number;
  expectedAttendees: number; // sum of partySize for YES — people, not rows
  capacity: number | null;
}

export async function eventStats(eventId: string): Promise<EventStats> {
  const [guests, yesAgg, event] = await Promise.all([
    db.guest.findMany({ where: { eventId }, include: { rsvp: { select: { status: true } } } }),
    db.rsvp.aggregate({ where: { status: "YES", guest: { eventId } }, _sum: { partySize: true } }),
    db.event.findUnique({ where: { id: eventId }, select: { capacity: true } }),
  ]);

  const byStatus = (s: string) => guests.filter((g) => g.rsvp?.status === s).length;
  return {
    invitedGuests: guests.length,
    yesGuests: byStatus("YES"),
    maybeGuests: byStatus("MAYBE"),
    noGuests: byStatus("NO"),
    pendingGuests: guests.filter((g) => !g.rsvp).length,
    openedLinks: guests.filter((g) => g.linkOpenedAt).length,
    expectedAttendees: yesAgg._sum.partySize ?? 0,
    capacity: event?.capacity ?? null,
  };
}

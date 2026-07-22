import { db } from "@/lib/db";
import type { RsvpStatus } from "@/lib/constants";

// Core RSVP domain logic. All writes go through submitRsvp inside a single
// transaction so per-guest caps and the event-wide capacity can never be
// exceeded by concurrent submissions (SQLite serializes writers; on
// PostgreSQL the interactive transaction re-checks capacity before writing).

export type RsvpRejection =
  | { ok: false; reason: "EVENT_NOT_ACTIVE" }
  | { ok: false; reason: "DEADLINE_PASSED" }
  | { ok: false; reason: "OVER_GUEST_CAP"; max: number }
  | { ok: false; reason: "EVENT_FULL"; seatsLeft: number };

export type RsvpResult = { ok: true; rsvpId: string } | RsvpRejection;

export interface RsvpInput {
  guestId: string;
  status: RsvpStatus;
  partySize: number;
  message?: string;
  answers?: { questionId: string; value: string }[];
}

/** Seats already confirmed (YES only — MAYBE does not reserve capacity). */
export async function confirmedSeats(eventId: string, excludeGuestId?: string): Promise<number> {
  const agg = await db.rsvp.aggregate({
    where: {
      status: "YES",
      guest: { eventId, ...(excludeGuestId ? { id: { not: excludeGuestId } } : {}) },
    },
    _sum: { partySize: true },
  });
  return agg._sum.partySize ?? 0;
}

export function deadlineBlocks(event: { rsvpDeadline: Date | null; deadlinePolicy: string }, now = new Date()): boolean {
  return Boolean(event.rsvpDeadline && event.deadlinePolicy === "BLOCK" && now > event.rsvpDeadline);
}

export async function submitRsvp(input: RsvpInput, now = new Date()): Promise<RsvpResult> {
  return db.$transaction(async (tx) => {
    const guest = await tx.guest.findUnique({
      where: { id: input.guestId },
      include: { event: true, rsvp: true },
    });
    if (!guest) return { ok: false, reason: "EVENT_NOT_ACTIVE" as const };
    const event = guest.event;

    if (event.status !== "PUBLISHED" || event.disabledAt || now > (event.endsAt ?? addHours(event.startsAt, 6))) {
      return { ok: false, reason: "EVENT_NOT_ACTIVE" as const };
    }
    if (deadlineBlocks(event, now)) {
      return { ok: false, reason: "DEADLINE_PASSED" as const };
    }
    if (input.partySize > guest.maxParty) {
      return { ok: false, reason: "OVER_GUEST_CAP" as const, max: guest.maxParty };
    }

    if (input.status === "YES" && event.capacity != null) {
      const taken = await (async () => {
        const agg = await tx.rsvp.aggregate({
          where: { status: "YES", guest: { eventId: event.id, id: { not: guest.id } } },
          _sum: { partySize: true },
        });
        return agg._sum.partySize ?? 0;
      })();
      if (taken + input.partySize > event.capacity) {
        return { ok: false, reason: "EVENT_FULL" as const, seatsLeft: Math.max(0, event.capacity - taken) };
      }
    }

    const partySize = input.status === "YES" ? input.partySize : Math.min(input.partySize, guest.maxParty);
    const rsvp = await tx.rsvp.upsert({
      where: { guestId: guest.id },
      create: {
        guestId: guest.id,
        status: input.status,
        partySize,
        message: input.message || null,
      },
      update: {
        status: input.status,
        partySize,
        message: input.message || null,
      },
    });

    if (input.answers?.length) {
      // Only accept answers to questions that belong to this event.
      const valid = await tx.customQuestion.findMany({
        where: { eventId: event.id, id: { in: input.answers.map((a) => a.questionId) } },
        select: { id: true },
      });
      const validIds = new Set(valid.map((q) => q.id));
      for (const a of input.answers) {
        if (!validIds.has(a.questionId)) continue;
        await tx.rsvpAnswer.upsert({
          where: { rsvpId_questionId: { rsvpId: rsvp.id, questionId: a.questionId } },
          create: { rsvpId: rsvp.id, questionId: a.questionId, value: a.value },
          update: { value: a.value },
        });
      }
    }

    return { ok: true as const, rsvpId: rsvp.id };
  });
}

function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3600_000);
}

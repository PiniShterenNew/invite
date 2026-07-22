import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { confirmedSeats, submitRsvp } from "@/lib/services/rsvp";
import { createTestEvent, createTestGuest, createTestOrganizer } from "@/test/helpers";

// Integration tests against the real (SQLite) database — this is the
// highest-risk code path in the product: it must never let a guest exceed
// their own seat cap or push an event over its total capacity, even when
// requests race.

describe("submitRsvp", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("accepts a YES within the guest's own cap", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id);
    const guest = await createTestGuest(event.id, { maxParty: 3 });

    const res = await submitRsvp({ guestId: guest.id, status: "YES", partySize: 2 });
    expect(res.ok).toBe(true);

    const stored = await db.rsvp.findUnique({ where: { guestId: guest.id } });
    expect(stored?.status).toBe("YES");
    expect(stored?.partySize).toBe(2);
  });

  it("rejects a party size above the guest's own cap", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id);
    const guest = await createTestGuest(event.id, { maxParty: 2 });

    const res = await submitRsvp({ guestId: guest.id, status: "YES", partySize: 5 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("OVER_GUEST_CAP");
  });

  it("allows updating an existing rsvp (upsert, not duplicate rows)", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id);
    const guest = await createTestGuest(event.id, { maxParty: 2 });

    await submitRsvp({ guestId: guest.id, status: "MAYBE", partySize: 1 });
    await submitRsvp({ guestId: guest.id, status: "YES", partySize: 2 });

    const count = await db.rsvp.count({ where: { guestId: guest.id } });
    expect(count).toBe(1);
    const stored = await db.rsvp.findUnique({ where: { guestId: guest.id } });
    expect(stored?.status).toBe("YES");
  });

  it("blocks a YES that would exceed the event's total capacity", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id, { capacity: 3 });
    const a = await createTestGuest(event.id, { maxParty: 2 });
    const b = await createTestGuest(event.id, { maxParty: 2 });

    const first = await submitRsvp({ guestId: a.id, status: "YES", partySize: 2 });
    expect(first.ok).toBe(true);

    const second = await submitRsvp({ guestId: b.id, status: "YES", partySize: 2 });
    expect(second.ok).toBe(false);
    if (!second.ok && second.reason === "EVENT_FULL") expect(second.seatsLeft).toBe(1);
  });

  it("does not count MAYBE toward capacity", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id, { capacity: 1 });
    const a = await createTestGuest(event.id, { maxParty: 5 });

    const res = await submitRsvp({ guestId: a.id, status: "MAYBE", partySize: 5 });
    expect(res.ok).toBe(true);
    expect(await confirmedSeats(event.id)).toBe(0);
  });

  it("blocks new responses after a BLOCK-policy deadline", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id, {
      rsvpDeadline: new Date(Date.now() - 3600_000),
      deadlinePolicy: "BLOCK",
    });
    const guest = await createTestGuest(event.id);

    const res = await submitRsvp({ guestId: guest.id, status: "YES", partySize: 1 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("DEADLINE_PASSED");
  });

  it("still allows responses after a WARN-policy deadline", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id, {
      rsvpDeadline: new Date(Date.now() - 3600_000),
      deadlinePolicy: "WARN",
    });
    const guest = await createTestGuest(event.id);

    const res = await submitRsvp({ guestId: guest.id, status: "YES", partySize: 1 });
    expect(res.ok).toBe(true);
  });

  it("rejects RSVPs on an unpublished (draft) event", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id, { status: "DRAFT" });
    const guest = await createTestGuest(event.id);

    const res = await submitRsvp({ guestId: guest.id, status: "YES", partySize: 1 });
    expect(res.ok).toBe(false);
  });

  it("holds the last party size across concurrent submissions without over-booking", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id, { capacity: 3 });
    const guests = await Promise.all([
      createTestGuest(event.id, { maxParty: 2 }),
      createTestGuest(event.id, { maxParty: 2 }),
      createTestGuest(event.id, { maxParty: 2 }),
    ]);

    // Fire all three RSVPs concurrently — capacity is 3, each asks for 2.
    // At most one should succeed with 2 seats; the transaction must never
    // let confirmed seats exceed capacity.
    const results = await Promise.all(guests.map((g) => submitRsvp({ guestId: g.id, status: "YES", partySize: 2 })));
    const succeeded = results.filter((r) => r.ok).length;
    expect(succeeded).toBeLessThanOrEqual(1);

    const totalSeats = await confirmedSeats(event.id);
    expect(totalSeats).toBeLessThanOrEqual(3);
  });
});

import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { eventStats } from "@/lib/services/stats";
import { submitRsvp } from "@/lib/services/rsvp";
import { createTestEvent, createTestGuest, createTestOrganizer } from "@/test/helpers";

describe("eventStats", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("counts people (party size), not just rows", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id);
    const solo = await createTestGuest(event.id, { maxParty: 1 });
    const couple = await createTestGuest(event.id, { maxParty: 2 });
    const pending = await createTestGuest(event.id, { maxParty: 1 });
    void pending;

    await submitRsvp({ guestId: solo.id, status: "YES", partySize: 1 });
    await submitRsvp({ guestId: couple.id, status: "YES", partySize: 2 });

    const stats = await eventStats(event.id);
    expect(stats.invitedGuests).toBe(3);
    expect(stats.yesGuests).toBe(2); // 2 guest rows said yes
    expect(stats.expectedAttendees).toBe(3); // but 3 people are coming
    expect(stats.pendingGuests).toBe(1);
  });
});

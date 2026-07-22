import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { anonymizeEvent } from "@/lib/services/lifecycle";
import { createTestEvent, createTestGuest, createTestOrganizer } from "@/test/helpers";

describe("anonymizeEvent", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("scrubs guest PII but keeps aggregate rsvp counts", async () => {
    const org = await createTestOrganizer();
    const event = await createTestEvent(org.id, { status: "ENDED", endedAt: new Date() });
    const guest = await createTestGuest(event.id, { name: "רגישה פרטית", phone: "0501234567" });
    // Inserted directly (not via submitRsvp): the event is already ENDED at
    // this point in the lifecycle, and submitRsvp intentionally rejects
    // writes to non-PUBLISHED events — that guard is exercised separately
    // in rsvp.test.ts.
    await db.rsvp.create({ data: { guestId: guest.id, status: "YES", partySize: 2, message: "מידע רגיש" } });
    await db.attendeeProfile.create({ data: { guestId: guest.id, shareLevel: "OPEN", bio: "פרטים אישיים", instagram: "private_handle" } });

    await anonymizeEvent(event.id);

    const guestAfter = await db.guest.findUnique({ where: { id: guest.id }, include: { rsvp: true, profile: true } });
    expect(guestAfter?.name).not.toBe("רגישה פרטית");
    expect(guestAfter?.phone).toBeNull();
    expect(guestAfter?.rsvp?.message).toBeNull();
    expect(guestAfter?.rsvp?.status).toBe("YES"); // aggregate survives
    expect(guestAfter?.rsvp?.partySize).toBe(2);
    expect(guestAfter?.profile).toBeNull();

    const eventAfter = await db.event.findUnique({ where: { id: event.id } });
    expect(eventAfter?.anonymizedAt).not.toBeNull();
  });
});

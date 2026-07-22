import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { newEventSlug, newInviteToken } from "@/lib/tokens";

// Shared fixtures for integration tests running against the real SQLite
// test database (prisma/test.db, prepared by scripts/setup-test-db.mjs).
// Uses the "unchecked" input types (scalar organizerId/eventId) since that's
// how these fixtures build relations — avoids the CreateInput/UncheckedCreateInput
// union making a plain `Partial<...>` override type unsound.

let counter = 0;
const uid = () => `t${Date.now()}${counter++}`;

export async function createTestOrganizer() {
  return db.user.create({ data: { email: `${uid()}@test.baim`, name: "Test Organizer" } });
}

export async function createTestEvent(organizerId: string, overrides: Partial<Prisma.EventUncheckedCreateInput> = {}) {
  return db.event.create({
    data: {
      organizerId,
      slug: newEventSlug(),
      type: "BIRTHDAY",
      name: "Test Event",
      hostName: "Host",
      startsAt: new Date(Date.now() + 3600_000),
      endsAt: new Date(Date.now() + 4 * 3600_000),
      status: "PUBLISHED",
      ...overrides,
    },
  });
}

export async function createTestGuest(eventId: string, overrides: Partial<Prisma.GuestUncheckedCreateInput> = {}) {
  return db.guest.create({
    data: {
      eventId,
      name: "Test Guest",
      maxParty: 1,
      inviteToken: newInviteToken(),
      ...overrides,
    },
  });
}

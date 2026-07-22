import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Server-side authorization gate. Every organizer/admin operation goes
// through these helpers — there is no direct-by-id access path (ADR-001).

export class AuthzError extends Error {
  constructor(message = "unauthorized") {
    super(message);
    this.name = "AuthzError";
  }
}

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.disabledAt) return null;
  return user;
}

/** Page-level guard: redirects to login when unauthenticated. */
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/** Action-level guard: throws instead of redirecting. */
export async function requireUserOrThrow() {
  const user = await currentUser();
  if (!user) throw new AuthzError();
  return user;
}

/** Loads an event only when the current user owns it. */
export async function requireEvent(eventId: string) {
  const user = await requireUserOrThrow();
  const event = await db.event.findFirst({ where: { id: eventId, organizerId: user.id } });
  if (!event) throw new AuthzError("event not found or not owned");
  return { user, event };
}

/** Loads a guest only when the current user owns its event. */
export async function requireGuest(guestId: string) {
  const user = await requireUserOrThrow();
  const guest = await db.guest.findFirst({
    where: { id: guestId, event: { organizerId: user.id } },
    include: { event: true, rsvp: true },
  });
  if (!guest) throw new AuthzError("guest not found or not owned");
  return { user, guest };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/app");
  return user;
}

export async function requireAdminOrThrow() {
  const user = await requireUserOrThrow();
  if (user.role !== "ADMIN") throw new AuthzError("admin only");
  return user;
}

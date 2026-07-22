"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { newInviteToken } from "@/lib/tokens";
import { accessCodeSchema, generalRsvpSchema, profileSchema, rsvpSubmitSchema } from "@/lib/validation/schemas";
import { submitRsvp, type RsvpResult } from "@/lib/services/rsvp";
import { enqueueRsvpNotification, processDueNotifications } from "@/lib/services/notify";
import { grantCodeAccess, verifyAccessCode } from "@/lib/services/access";
import { saveImage, deleteImage, UploadError } from "@/lib/storage";
import { t } from "@/lib/i18n/he";

// Public (guest-facing) server actions. No session — a valid, unguessable
// invitation token IS the authorization. Every action is rate-limited per IP
// and validates its input with the shared Zod schemas.

async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function rsvpError(res: Exclude<RsvpResult, { ok: true; rsvpId: string }>): string {
  switch (res.reason) {
    case "DEADLINE_PASSED":
      return t.invite.deadlinePassedBlock;
    case "EVENT_FULL":
      return res.seatsLeft > 0 ? t.invite.notEnoughSeats(res.seatsLeft) : t.invite.eventFull;
    case "OVER_GUEST_CAP":
      return t.invite.partyHint(res.max);
    default:
      return t.invite.eventEnded;
  }
}

export async function submitPersonalRsvp(token: string, raw: unknown): Promise<ActionResult> {
  if (!rateLimit(await clientKey("rsvp"), 20, 60_000)) return { ok: false, error: t.errors.rateLimited };
  const parsed = rsvpSubmitSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: t.errors.invalidInput };

  const guest = await db.guest.findUnique({ where: { inviteToken: token }, select: { id: true, name: true, eventId: true } });
  if (!guest) return { ok: false, error: t.invite.notFound };

  const res = await submitRsvp({ guestId: guest.id, ...parsed.data, message: parsed.data.message || undefined });
  if (!res.ok) return { ok: false, error: rsvpError(res) };

  await enqueueRsvpNotification(guest.eventId, guest.name, parsed.data.status, parsed.data.partySize);
  // Opportunistically flush notifications that are already due.
  processDueNotifications(process.env.APP_URL ?? "http://localhost:3000").catch(() => {});
  revalidatePath(`/i/${token}`);
  return { ok: true };
}

export async function submitGeneralRsvp(slug: string, raw: unknown): Promise<ActionResult<{ token: string }>> {
  if (!rateLimit(await clientKey("grsvp"), 10, 60_000)) return { ok: false, error: t.errors.rateLimited };
  const parsed = generalRsvpSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: t.errors.invalidInput };

  const event = await db.event.findUnique({ where: { slug } });
  if (!event || event.status !== "PUBLISHED" || event.disabledAt || event.accessMode === "PERSONAL_ONLY") {
    return { ok: false, error: t.invite.notFound };
  }

  const partyCap = Math.min(parsed.data.partySize, event.generalLinkMaxParty);
  const guest = await db.guest.create({
    data: {
      eventId: event.id,
      name: parsed.data.name,
      maxParty: event.generalLinkMaxParty,
      inviteToken: newInviteToken(),
      viaGeneralLink: true,
      linkOpenedAt: new Date(),
    },
  });

  const res = await submitRsvp({
    guestId: guest.id,
    status: parsed.data.status,
    partySize: partyCap,
    message: parsed.data.message || undefined,
    answers: parsed.data.answers,
  });
  if (!res.ok) {
    // Roll the placeholder guest back so failed general RSVPs don't pile up.
    await db.guest.delete({ where: { id: guest.id } }).catch(() => {});
    return { ok: false, error: rsvpError(res) };
  }

  await enqueueRsvpNotification(event.id, guest.name, parsed.data.status, partyCap);
  processDueNotifications(process.env.APP_URL ?? "http://localhost:3000").catch(() => {});
  return { ok: true, data: { token: guest.inviteToken } };
}

export async function submitAccessCode(slug: string, raw: unknown): Promise<ActionResult> {
  // Tight limit: this is the brute-force surface.
  if (!rateLimit(await clientKey(`code:${slug}`), 8, 60_000)) return { ok: false, error: t.errors.rateLimited };
  const parsed = accessCodeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: t.invite.codeWrong };

  const event = await db.event.findUnique({ where: { slug }, select: { id: true, accessCodeHash: true } });
  if (!event?.accessCodeHash || !verifyAccessCode(parsed.data.code, event.accessCodeHash)) {
    return { ok: false, error: t.invite.codeWrong };
  }
  await grantCodeAccess(event.id);
  revalidatePath(`/e/${slug}`);
  return { ok: true };
}

export async function saveProfile(token: string, formData: FormData): Promise<ActionResult> {
  if (!rateLimit(await clientKey("profile"), 15, 60_000)) return { ok: false, error: t.errors.rateLimited };

  const guest = await db.guest.findUnique({ where: { inviteToken: token }, include: { profile: true, event: true } });
  if (!guest || guest.event.disabledAt) return { ok: false, error: t.invite.notFound };

  const parsed = profileSchema.safeParse({
    shareLevel: formData.get("shareLevel"),
    bio: formData.get("bio") ?? "",
    instagram: formData.get("instagram") ?? "",
  });
  if (!parsed.success) return { ok: false, error: t.errors.invalidInput };

  let photoKey = guest.profile?.photo ?? null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      const newKey = await saveImage(photo, "avatar");
      if (photoKey) await deleteImage(photoKey);
      photoKey = newKey;
    } catch (e) {
      if (e instanceof UploadError && e.message === "too-big") return { ok: false, error: t.errors.uploadTooBig };
      return { ok: false, error: t.errors.uploadBadType };
    }
  }

  const data = {
    shareLevel: parsed.data.shareLevel,
    bio: parsed.data.bio || null,
    instagram: parsed.data.instagram || null,
    photo: photoKey,
  };
  await db.attendeeProfile.upsert({
    where: { guestId: guest.id },
    create: { guestId: guest.id, ...data },
    update: data,
  });
  revalidatePath(`/i/${token}`);
  return { ok: true };
}

export async function deleteProfile(token: string): Promise<ActionResult> {
  const guest = await db.guest.findUnique({ where: { inviteToken: token }, include: { profile: true } });
  if (!guest) return { ok: false, error: t.invite.notFound };
  if (guest.profile) {
    if (guest.profile.photo) await deleteImage(guest.profile.photo);
    await db.attendeeProfile.delete({ where: { id: guest.profile.id } });
  }
  revalidatePath(`/i/${token}`);
  return { ok: true };
}

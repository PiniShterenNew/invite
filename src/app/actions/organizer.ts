"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserOrThrow, requireEvent, requireGuest, AuthzError } from "@/lib/authz";
import { newEventSlug, newInviteToken } from "@/lib/tokens";
import { hashAccessCode } from "@/lib/services/access";
import { parseGuestLines } from "@/lib/services/guest-parse";
import { audit } from "@/lib/services/lifecycle";
import { saveImage, deleteImage, UploadError } from "@/lib/storage";
import {
  announcementSchema,
  eventBasicsSchema,
  eventContentSchema,
  eventDesignSchema,
  eventLocationSchema,
  generalLinkSettingsSchema,
  guestCreateSchema,
  guestPasteSchema,
} from "@/lib/validation/schemas";
import { MAX_GUESTS_PER_EVENT, RSVP_STATUSES, type RsvpStatus } from "@/lib/constants";
import { t } from "@/lib/i18n/he";
import type { ActionResult } from "@/app/actions/guest";

// Organizer server actions. Every one starts with an ownership check via
// requireEvent/requireGuest — there is no way to touch another organizer's
// data (see lib/authz.ts).

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof AuthzError) return { ok: false, error: t.errors.unauthorized };
  console.error("[organizer-action]", e instanceof Error ? e.message : e);
  return { ok: false, error: t.common.error };
}

export async function createEvent(): Promise<never> {
  const user = await requireUserOrThrow();
  const event = await db.event.create({
    data: {
      organizerId: user.id,
      slug: newEventSlug(),
      type: "BIRTHDAY",
      name: "",
      hostName: user.name ?? "",
      startsAt: nextFridayEvening(),
    },
  });
  redirect(`/app/events/${event.id}/edit`);
}

function nextFridayEvening(): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  d.setHours(20, 0, 0, 0);
  return d;
}

export async function saveBasics(eventId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    const data = eventBasicsSchema.safeParse(raw);
    if (!data.success) return { ok: false, error: t.errors.invalidInput };
    await db.event.update({
      where: { id: event.id },
      data: { ...data.data, endsAt: data.data.endsAt ?? null },
    });
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveLocation(eventId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    const parsed = eventLocationSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };
    const d = parsed.data;
    if (d.accessMode === "CODE" && !d.accessCode && !event.accessCodeHash) {
      return { ok: false, error: t.errors.invalidInput };
    }
    await db.event.update({
      where: { id: event.id },
      data: {
        locationName: d.locationName || null,
        locationAddress: d.locationAddress || null,
        addressReveal: d.addressReveal,
        accessMode: d.accessMode,
        ...(d.accessCode ? { accessCodeHash: hashAccessCode(d.accessCode) } : {}),
        ...(d.accessMode !== "CODE" ? { accessCodeHash: null } : {}),
      },
    });
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveDesign(eventId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    const parsed = eventDesignSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };
    await db.event.update({ where: { id: event.id }, data: parsed.data });
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function uploadCover(eventId: string, formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const { event } = await requireEvent(eventId);
    const file = formData.get("cover");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: t.errors.invalidInput };
    let key: string;
    try {
      key = await saveImage(file, "cover");
    } catch (e) {
      if (e instanceof UploadError && e.message === "too-big") return { ok: false, error: t.errors.uploadTooBig };
      return { ok: false, error: t.errors.uploadBadType };
    }
    if (event.coverImage) await deleteImage(event.coverImage);
    await db.event.update({ where: { id: event.id }, data: { coverImage: key } });
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true, data: { url: `/api/uploads/${key}` } };
  } catch (e) {
    return fail(e);
  }
}

export async function removeCover(eventId: string): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    if (event.coverImage) await deleteImage(event.coverImage);
    await db.event.update({ where: { id: event.id }, data: { coverImage: null } });
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveContent(eventId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    const parsed = eventContentSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };
    const d = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: event.id },
        data: {
          description: d.description || null,
          dressCode: d.dressCode || null,
          scheduleJson: d.schedule?.length ? JSON.stringify(d.schedule) : null,
          bringList: d.bringList || null,
          playlistUrl: d.playlistUrl || null,
          showCountdown: d.showCountdown,
          showGuestList: d.showGuestList,
          rsvpDeadline: d.rsvpDeadline ?? null,
          deadlinePolicy: d.deadlinePolicy,
          capacity: d.capacity ?? null,
          notifyMode: d.notifyMode,
        },
      });

      // Sync questions: keep answered questions stable by id, remove deleted ones.
      const existing = await tx.customQuestion.findMany({ where: { eventId: event.id } });
      const keepIds = new Set(d.questions.filter((q) => q.id).map((q) => q.id!));
      await tx.customQuestion.deleteMany({
        where: { eventId: event.id, id: { notIn: [...keepIds] } },
      });
      for (const [i, q] of d.questions.entries()) {
        const data = {
          order: i,
          type: q.type,
          label: q.label,
          optionsJson: q.options?.length ? JSON.stringify(q.options) : null,
        };
        if (q.id && existing.some((e) => e.id === q.id)) {
          await tx.customQuestion.update({ where: { id: q.id }, data });
        } else {
          await tx.customQuestion.create({ data: { eventId: event.id, ...data } });
        }
      }
    });
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function publishEvent(eventId: string): Promise<ActionResult> {
  try {
    const { user, event } = await requireEvent(eventId);
    if (!event.name.trim() || !event.hostName.trim()) return { ok: false, error: t.errors.invalidInput };
    await db.event.update({ where: { id: event.id }, data: { status: "PUBLISHED" } });
    await audit("ORGANIZER", user.id, event.id, "event.publish");
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- guests ----------

export async function addGuestsFromPaste(eventId: string, raw: unknown): Promise<ActionResult<{ added: number }>> {
  try {
    const { event } = await requireEvent(eventId);
    const parsed = guestPasteSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };

    const rows = parseGuestLines(parsed.data.text);
    const count = await db.guest.count({ where: { eventId: event.id } });
    const room = Math.max(0, MAX_GUESTS_PER_EVENT - count);
    const toAdd = rows.slice(0, room);
    for (const row of toAdd) {
      await db.guest.create({
        data: { eventId: event.id, name: row.name, maxParty: row.maxParty, inviteToken: newInviteToken() },
      });
    }
    revalidatePath(`/app/events/${eventId}/guests`);
    return { ok: true, data: { added: toAdd.length } };
  } catch (e) {
    return fail(e);
  }
}

export async function addGuest(eventId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    const parsed = guestCreateSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };
    const count = await db.guest.count({ where: { eventId: event.id } });
    if (count >= MAX_GUESTS_PER_EVENT) return { ok: false, error: t.errors.invalidInput };
    await db.guest.create({
      data: {
        eventId: event.id,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        maxParty: parsed.data.maxParty,
        inviteToken: newInviteToken(),
      },
    });
    revalidatePath(`/app/events/${eventId}/guests`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateGuest(guestId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { guest } = await requireGuest(guestId);
    const parsed = guestCreateSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };
    await db.guest.update({
      where: { id: guest.id },
      data: { name: parsed.data.name, phone: parsed.data.phone || null, maxParty: parsed.data.maxParty },
    });
    revalidatePath(`/app/events/${guest.eventId}/guests`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteGuest(guestId: string): Promise<ActionResult> {
  try {
    const { user, guest } = await requireGuest(guestId);
    await db.guest.delete({ where: { id: guest.id } });
    await audit("ORGANIZER", user.id, guest.eventId, "guest.delete");
    revalidatePath(`/app/events/${guest.eventId}/guests`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Rotates a personal link — the old token stops working immediately. */
export async function regenerateGuestLink(guestId: string): Promise<ActionResult> {
  try {
    const { user, guest } = await requireGuest(guestId);
    await db.guest.update({ where: { id: guest.id }, data: { inviteToken: newInviteToken(), linkOpenedAt: null, shareOpenedAt: null } });
    await audit("ORGANIZER", user.id, guest.eventId, "guest.regenerate_link");
    revalidatePath(`/app/events/${guest.eventId}/guests`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Honest share tracking: records that the organizer OPENED the share sheet. */
export async function markShareOpened(guestId: string): Promise<ActionResult> {
  try {
    const { guest } = await requireGuest(guestId);
    if (!guest.shareOpenedAt) {
      await db.guest.update({ where: { id: guest.id }, data: { shareOpenedAt: new Date() } });
      revalidatePath(`/app/events/${guest.eventId}/guests`);
    }
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Organizer manual RSVP override — bypasses deadline/capacity by design. */
export async function setManualRsvp(guestId: string, status: string, partySize: number): Promise<ActionResult> {
  try {
    const { user, guest } = await requireGuest(guestId);
    if (!RSVP_STATUSES.includes(status as RsvpStatus) || partySize < 1 || partySize > 20) {
      return { ok: false, error: t.errors.invalidInput };
    }
    await db.rsvp.upsert({
      where: { guestId: guest.id },
      create: { guestId: guest.id, status, partySize },
      update: { status, partySize },
    });
    await audit("ORGANIZER", user.id, guest.eventId, "guest.manual_rsvp", { status });
    revalidatePath(`/app/events/${guest.eventId}/guests`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveGeneralLinkSettings(eventId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    const parsed = generalLinkSettingsSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };
    await db.event.update({ where: { id: event.id }, data: parsed.data });
    revalidatePath(`/app/events/${eventId}/guests`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- announcement / lifecycle ----------

export async function setAnnouncement(eventId: string, raw: unknown): Promise<ActionResult> {
  try {
    const { event } = await requireEvent(eventId);
    const parsed = announcementSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: t.errors.invalidInput };
    await db.event.update({
      where: { id: event.id },
      data: { announcement: parsed.data.text || null, announcementUpdatedAt: parsed.data.text ? new Date() : null },
    });
    revalidatePath(`/app/events/${eventId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Duplicates event structure only — never guests, RSVPs or profiles. */
export async function duplicateEvent(eventId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, event } = await requireEvent(eventId);
    const questions = await db.customQuestion.findMany({ where: { eventId: event.id } });
    const copy = await db.event.create({
      data: {
        organizerId: user.id,
        slug: newEventSlug(),
        type: event.type,
        name: event.name,
        hostName: event.hostName,
        startsAt: nextFridayEvening(),
        timezone: event.timezone,
        locationName: event.locationName,
        locationAddress: event.locationAddress,
        addressReveal: event.addressReveal,
        template: event.template,
        accentColor: event.accentColor,
        typography: event.typography,
        description: event.description,
        dressCode: event.dressCode,
        scheduleJson: event.scheduleJson,
        bringList: event.bringList,
        playlistUrl: event.playlistUrl,
        showCountdown: event.showCountdown,
        showGuestList: event.showGuestList,
        accessMode: event.accessMode,
        generalLinkMaxParty: event.generalLinkMaxParty,
        deadlinePolicy: event.deadlinePolicy,
        capacity: event.capacity,
        notifyMode: event.notifyMode,
        status: "DRAFT",
        questions: {
          create: questions.map((q) => ({ order: q.order, type: q.type, label: q.label, optionsJson: q.optionsJson })),
        },
      },
    });
    await audit("ORGANIZER", user.id, copy.id, "event.duplicate", { from: event.id });
    return { ok: true, data: { id: copy.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function archiveEvent(eventId: string): Promise<ActionResult> {
  try {
    const { user, event } = await requireEvent(eventId);
    await db.event.update({
      where: { id: event.id },
      data: { status: "ARCHIVED", endedAt: event.endedAt ?? new Date() },
    });
    await audit("ORGANIZER", user.id, event.id, "event.archive");
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEventPermanently(eventId: string): Promise<ActionResult> {
  try {
    const { user, event } = await requireEvent(eventId);
    const profiles = await db.attendeeProfile.findMany({ where: { guest: { eventId: event.id } }, select: { photo: true } });
    for (const p of profiles) if (p.photo) await deleteImage(p.photo);
    if (event.coverImage) await deleteImage(event.coverImage);
    await db.event.delete({ where: { id: event.id } }); // cascades guests/rsvps/profiles
    await audit("ORGANIZER", user.id, null, "event.delete");
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

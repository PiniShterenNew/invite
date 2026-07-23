import type { Event, CustomQuestion, Guest, Rsvp, RsvpAnswer } from "@/generated/prisma/client";
import type { EventView, ViewerContext } from "@/components/event/types";
import { imageUrl } from "@/lib/storage";

// Builds the guest-facing view model. All privacy filtering happens here,
// on the server: the exact address is included only when the reveal policy
// allows it for this specific viewer.

type FullEvent = Event & { questions: CustomQuestion[] };
type GuestWithRsvp = Guest & { rsvp: (Rsvp & { answers: RsvpAnswer[] }) | null; profile: { id: string } | null };

export function canSeeAddress(
  event: Pick<Event, "addressReveal">,
  viewer: { kind: "personal" | "general" | "preview"; rsvpStatus?: string | null }
): boolean {
  if (viewer.kind === "preview") return true;
  switch (event.addressReveal) {
    case "ALWAYS":
      return true;
    case "AFTER_RSVP":
      return viewer.rsvpStatus === "YES";
    case "PERSONAL_ONLY":
      return viewer.kind === "personal";
    default:
      return false;
  }
}

export function buildEventView(
  event: FullEvent,
  viewer: { kind: "personal" | "general" | "preview"; rsvpStatus?: string | null },
  now = new Date()
): EventView {
  const showAddress = Boolean(event.locationAddress) && canSeeAddress(event, viewer);
  const deadlinePassed = Boolean(event.rsvpDeadline && now > event.rsvpDeadline);
  return {
    slug: event.slug,
    name: event.name,
    type: event.type,
    hostName: event.hostName,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    timezone: event.timezone,
    locationName: event.locationName,
    locationAddress: showAddress ? event.locationAddress : null,
    addressHint:
      event.locationAddress && !showAddress
        ? event.addressReveal === "PERSONAL_ONLY"
          ? "PERSONAL_ONLY"
          : "AFTER_RSVP"
        : null,
    template: event.template,
    accentColor: event.accentColor,
    typography: event.typography,
    coverUrl: imageUrl(event.coverImage),
    description: event.description,
    dressCode: event.dressCode,
    schedule: parseSchedule(event.scheduleJson),
    bringList: event.bringList,
    playlistUrl: event.playlistUrl,
    showCountdown: event.showCountdown,
    announcement: event.announcement,
    showGuestList: event.showGuestList,
    questions: event.questions
      .sort((a, b) => a.order - b.order)
      .map((q) => ({ id: q.id, type: q.type, label: q.label, options: parseOptions(q.optionsJson) })),
    deadlinePassed,
    deadlinePolicy: event.deadlinePolicy,
    ended: event.status === "ENDED" || event.status === "ARCHIVED",
  };
}

export function buildViewerContext(guest: GuestWithRsvp | null, kind: ViewerContext["kind"], seatsLeft: number | null, generalMaxParty?: number): ViewerContext {
  return {
    kind,
    token: guest?.inviteToken ?? null,
    guestName: guest?.name ?? null,
    maxParty: guest?.maxParty ?? generalMaxParty ?? 1,
    rsvp: guest?.rsvp
      ? {
          status: guest.rsvp.status,
          partySize: guest.rsvp.partySize,
          message: guest.rsvp.message,
          answers: Object.fromEntries(guest.rsvp.answers.map((a) => [a.questionId, a.value])),
        }
      : null,
    seatsLeft,
    hasProfile: Boolean(guest?.profile),
  };
}

function parseSchedule(json: string | null): { time: string; label: string }[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((r) => r?.time && r?.label) : [];
  } catch {
    return [];
  }
}

function parseOptions(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((o) => typeof o === "string") : [];
  } catch {
    return [];
  }
}

import { DEFAULT_TIMEZONE } from "@/lib/constants";

// Locale-aware date/time formatting — always in the event's timezone, never
// the browser's (i18n decision: he-IL for the Hebrew-only MVP).

export function formatEventDate(date: Date, timezone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

export function formatEventTime(date: Date, timezone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone }).format(date);
}

export function formatShortDate(date: Date, timezone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit", timeZone: timezone }).format(date);
}

export function formatDateTime(date: Date, timezone = DEFAULT_TIMEZONE): string {
  return `${formatShortDate(date, timezone)} ${formatEventTime(date, timezone)}`;
}

/** WhatsApp share link with a prefilled message (manual send — no API). */
export function waShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function wazeUrl(address: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

export function gmapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Minimal ICS file content for "add to calendar". */
export function buildIcs(event: {
  name: string;
  description?: string | null;
  locationAddress?: string | null;
  locationName?: string | null;
  startsAt: Date;
  endsAt: Date | null;
  slug: string;
}): string {
  const dt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = event.endsAt ?? new Date(event.startsAt.getTime() + 3 * 3600_000);
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const location = [event.locationName, event.locationAddress].filter(Boolean).join(", ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//baim//he//",
    "BEGIN:VEVENT",
    `UID:${event.slug}@baim`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(event.startsAt)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${esc(event.name)}`,
    ...(location ? [`LOCATION:${esc(location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${esc(event.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

import { requireUserOrThrow } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

// CSV export for the organizer's own guest list — the recommended path to
// back up data before the 90-day anonymization job runs.

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserOrThrow().catch(() => null);
  if (!user) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, organizerId: user.id },
    include: { guests: { include: { rsvp: { include: { answers: { include: { question: true } } } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!event) return new Response("not found", { status: 404 });

  const header = ["שם", "טלפון", "מקומות מוקצים", "סטטוס", "מספר משתתפים", "הודעה", "נענה בתאריך", "נפתח קישור"];
  const rows = event.guests.map((g) => [
    g.name,
    g.phone ?? "",
    String(g.maxParty),
    g.rsvp?.status ?? "טרם השיב",
    g.rsvp ? String(g.rsvp.partySize) : "",
    g.rsvp?.message ?? "",
    g.rsvp ? formatDateTime(g.rsvp.updatedAt, event.timezone) : "",
    g.linkOpenedAt ? formatDateTime(g.linkOpenedAt, event.timezone) : "",
  ]);

  const csv = ["﻿" + header.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-guests.csv"`,
      "X-Robots-Tag": "noindex",
    },
  });
}

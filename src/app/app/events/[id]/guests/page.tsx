import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { GuestManager, type GuestRow } from "@/components/organizer/guest-manager";

export const metadata = { title: t.dashboard.guests };

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, organizerId: user.id },
    include: { guests: { include: { rsvp: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!event) notFound();

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const rows: GuestRow[] = event.guests.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone ?? "",
    maxParty: g.maxParty,
    link: `${appUrl}/i/${g.inviteToken}`,
    viaGeneralLink: g.viaGeneralLink,
    shareOpened: Boolean(g.shareOpenedAt),
    linkOpened: Boolean(g.linkOpenedAt),
    status: g.rsvp?.status ?? null,
    partySize: g.rsvp?.partySize ?? null,
    message: g.rsvp?.message ?? null,
    respondedAt: g.rsvp?.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.dashboard.guests}</h1>
          <p className="text-sm text-ink-faint">{event.name}</p>
        </div>
        <Link href={`/app/events/${event.id}`} className="text-sm font-semibold text-coral-deep underline underline-offset-4">
          {t.dashboard.title}
        </Link>
      </div>

      <GuestManager
        eventId={event.id}
        eventName={event.name}
        guests={rows}
        generalLink={`${appUrl}/e/${event.slug}`}
        generalLinkEnabled={event.accessMode !== "PERSONAL_ONLY"}
        generalLinkMaxParty={event.generalLinkMaxParty}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { eventStats } from "@/lib/services/stats";
import { Stat } from "@/components/ui";
import { GuestManager, type GuestRow } from "@/components/organizer/guest-manager";
import { GuestFunnel } from "@/components/organizer/guest-funnel";

export const metadata = { title: t.dashboard.guests };

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, organizerId: user.id },
    include: { guests: { include: { rsvp: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!event) notFound();

  const stats = await eventStats(event.id);
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

  const responded = stats.yesGuests + stats.maybeGuests + stats.noGuests;

  return (
    <div className="space-y-5 animate-rise">
      {/* summary stats */}
      <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <Stat label={t.dashboard.invited} value={stats.invitedGuests} />
          <Stat label={t.dashboard.shared} value={stats.sharedGuests} />
          <Stat label={t.dashboard.opened} value={stats.openedLinks} />
          <Stat label={t.dashboard.responded} value={responded} />
          <Stat label={t.dashboard.pending} value={stats.pendingGuests} />
        </div>
        {/* response progress bar */}
        {stats.invitedGuests > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
              <span>{t.dashboard.responseProgress}</span>
              <span className="tabular-nums">{responded}/{stats.invitedGuests} {t.dashboard.responded}</span>
            </div>
            <div className="h-2.5 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-coral rounded-full transition-all duration-500"
                style={{ width: `${Math.round((responded / stats.invitedGuests) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* guest funnel */}
      {stats.invitedGuests > 0 && (
        <GuestFunnel
          invited={stats.invitedGuests}
          shared={stats.sharedGuests}
          opened={stats.openedLinks}
          responded={responded}
        />
      )}

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

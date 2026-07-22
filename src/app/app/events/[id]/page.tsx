import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { eventStats } from "@/lib/services/stats";
import { formatDateTime } from "@/lib/format";
import { Badge, ButtonLink, Stat } from "@/components/ui";
import { AnnouncementCard } from "@/components/organizer/announcement-card";
import { EventActions } from "@/components/organizer/event-actions";

export const metadata = { title: t.dashboard.title };

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, organizerId: user.id },
    include: { questions: { orderBy: { order: "asc" }, include: { answers: { include: { rsvp: { include: { guest: { select: { name: true } } } } } } } } },
  });
  if (!event) notFound();

  const stats = await eventStats(event.id);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const generalLink = `${appUrl}/e/${event.slug}`;

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{event.name}</h1>
          <p className="text-sm text-ink-faint">{formatDateTime(event.startsAt, event.timezone)}</p>
        </div>
        <Badge tone={event.status === "PUBLISHED" ? "yes" : event.status === "ENDED" ? "maybe" : "neutral"}>
          {t.dashboard[`status${event.status}` as `status${"DRAFT" | "PUBLISHED" | "ENDED" | "ARCHIVED"}`]}
        </Badge>
      </div>

      {/* headline stats — people, not rows */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label={t.dashboard.invited} value={stats.invitedGuests} />
        <Stat label={t.dashboard.expected} value={stats.capacity ? `${stats.expectedAttendees}/${stats.capacity}` : stats.expectedAttendees} tone="yes" />
        <Stat label={t.dashboard.yes} value={stats.yesGuests} tone="yes" />
        <Stat label={t.dashboard.maybe} value={stats.maybeGuests} tone="maybe" />
        <Stat label={t.dashboard.no} value={stats.noGuests} tone="no" />
        <Stat label={t.dashboard.pending} value={stats.pendingGuests} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ButtonLink href={`/app/events/${event.id}/guests`} full>
          {t.dashboard.guests} · {t.dashboard.share}
        </ButtonLink>
        <ButtonLink href={`/app/events/${event.id}/edit`} variant="secondary" full>
          {t.dashboard.editEvent}
        </ButtonLink>
      </div>

      <AnnouncementCard eventId={event.id} initial={event.announcement ?? ""} eventName={event.name} generalLink={generalLink} />

      {/* answers to custom questions */}
      {event.questions.length > 0 && (
        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-4">
          <h2 className="font-bold text-ink">{t.dashboard.answers}</h2>
          {event.questions.map((q) => (
            <div key={q.id} className="space-y-1">
              <p className="text-sm font-semibold text-ink">{q.label}</p>
              {q.answers.length === 0 ? (
                <p className="text-sm text-ink-faint">—</p>
              ) : (
                <ul className="text-sm text-ink-soft space-y-0.5">
                  {q.answers.map((a) => (
                    <li key={a.id}>
                      <span className="font-medium">{a.rsvp.guest.name}:</span> {a.value.replaceAll("|", ", ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      <EventActions eventId={event.id} eventName={event.name} status={event.status} />

      <p className="text-center">
        <Link href="/app" className="text-sm font-semibold text-ink-faint underline underline-offset-4">
          {t.common.back}
        </Link>
      </p>
    </div>
  );
}

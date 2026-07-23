import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { eventStats } from "@/lib/services/stats";
import { Stat } from "@/components/ui";
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
      {/* headline stats — people, not rows */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label={t.dashboard.invited} value={stats.invitedGuests} />
        <Stat label={t.dashboard.expected} value={stats.capacity ? `${stats.expectedAttendees}/${stats.capacity}` : stats.expectedAttendees} tone="yes" />
        <Stat label={t.dashboard.yes} value={stats.yesGuests} tone="yes" />
        <Stat label={t.dashboard.maybe} value={stats.maybeGuests} tone="maybe" />
        <Stat label={t.dashboard.no} value={stats.noGuests} tone="no" />
        <Stat label={t.dashboard.pending} value={stats.pendingGuests} />
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
    </div>
  );
}

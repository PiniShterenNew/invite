import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { formatShortDate } from "@/lib/format";
import { createEvent } from "@/app/actions/organizer";
import { Badge, Button, EmptyState } from "@/components/ui";
import type { EventType } from "@/lib/constants";

export const metadata = { title: t.nav.myEvents };

const statusTone = { DRAFT: "neutral", PUBLISHED: "yes", ENDED: "maybe", ARCHIVED: "neutral" } as const;

export default async function EventsListPage() {
  const user = await requireUser();
  const events = await db.event.findMany({
    where: { organizerId: user.id },
    orderBy: [{ status: "asc" }, { startsAt: "desc" }],
    include: {
      _count: { select: { guests: true } },
      guests: { select: { rsvp: { select: { status: true } } } },
    },
  });

  const active = events.filter((e) => e.status !== "ARCHIVED");
  const archived = events.filter((e) => e.status === "ARCHIVED");

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">{t.nav.myEvents}</h1>
        <form action={createEvent}>
          <Button type="submit">+ {t.nav.newEvent}</Button>
        </form>
      </div>

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          title={t.dashboard.noEvents}
          subtitle={t.dashboard.noEventsCta}
          action={
            <form action={createEvent}>
              <Button type="submit">+ {t.nav.newEvent}</Button>
            </form>
          }
        />
      ) : (
        <ul className="space-y-3">
          {active.map((e) => {
            const responded = e.guests.filter((g) => g.rsvp).length;
            const total = e._count.guests;
            return (
              <li key={e.id}>
                <Link
                  href={e.status === "DRAFT" ? `/app/events/${e.id}/edit` : `/app/events/${e.id}`}
                  className="block bg-white rounded-card border border-line/60 shadow-card p-4 hover:shadow-pop transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink truncate">{e.name || t.wizard.title}</p>
                      <p className="text-sm text-ink-faint">
                        {t.eventTypes[e.type as EventType]} · {formatShortDate(e.startsAt, e.timezone)} · {total}{" "}
                        {t.dashboard.guests}
                      </p>
                    </div>
                    <Badge tone={statusTone[e.status as keyof typeof statusTone] ?? "neutral"}>
                      {t.dashboard[`status${e.status}` as `status${"DRAFT" | "PUBLISHED" | "ENDED" | "ARCHIVED"}`]}
                    </Badge>
                  </div>
                  {total > 0 && e.status !== "DRAFT" && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coral rounded-full transition-all"
                          style={{ width: `${Math.round((responded / total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-ink-faint tabular-nums shrink-0">
                        {responded}/{total} {t.dashboard.responded}
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {archived.length > 0 && (
        <details className="pt-2">
          <summary className="text-sm font-semibold text-ink-faint cursor-pointer">{t.dashboard.archive}</summary>
          <ul className="space-y-2 pt-3">
            {archived.map((e) => (
              <li key={e.id}>
                <Link href={`/app/events/${e.id}`} className="block bg-cream rounded-2xl p-3 text-sm font-semibold text-ink-soft">
                  {e.name} · {formatShortDate(e.startsAt, e.timezone)}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

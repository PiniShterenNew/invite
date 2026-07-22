/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { imageUrl } from "@/lib/storage";
import { guestListVisible } from "@/lib/services/lifecycle";
import { NotFoundCard } from "@/components/event/not-found";

// Attendee list — visible only to guests who RSVP'd YES, only when the
// organizer enabled it, and only up to 7 days after the event ended.
// Each attendee controls what appears via their share level. Never phones.

export default async function AttendeesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await db.guest.findUnique({
    where: { inviteToken: token },
    include: { event: true, rsvp: { select: { status: true } } },
  });

  if (!guest || guest.event.status === "DRAFT" || guest.event.disabledAt || !guest.event.showGuestList) {
    return <NotFoundCard title={t.invite.notFound} text={t.invite.notFoundText} />;
  }
  if (guest.rsvp?.status !== "YES") {
    return <NotFoundCard title={t.profile.attendeesOnlyYes} />;
  }
  if (!guestListVisible(guest.event)) {
    return <NotFoundCard title={t.profile.attendeesClosed} />;
  }

  const attendees = await db.guest.findMany({
    where: { eventId: guest.eventId, rsvp: { status: "YES" } },
    include: { profile: true, rsvp: { select: { partySize: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="min-h-dvh bg-paper px-4 py-8">
      <div className="max-w-md mx-auto space-y-4 animate-rise">
        <h1 className="text-2xl font-bold text-ink text-center">{t.profile.attendeesTitle}</h1>
        <p className="text-sm text-ink-faint text-center">{guest.event.name}</p>

        {attendees.length === 0 ? (
          <p className="text-center text-ink-faint py-10">{t.profile.noAttendeesYet}</p>
        ) : (
          <ul className="space-y-2">
            {attendees.map((a) => {
              const p = a.profile;
              const showPhoto = p && p.shareLevel !== "MINIMAL" && p.photo && !p.removedByAdminAt;
              const showBio = p && p.shareLevel !== "MINIMAL" && p.bio && !p.removedByAdminAt;
              const showIg = p && p.shareLevel === "OPEN" && p.instagram && !p.removedByAdminAt;
              return (
                <li key={a.id} className="bg-white rounded-2xl border border-line/60 shadow-card p-4 flex items-center gap-3">
                  {showPhoto ? (
                    <img src={imageUrl(p.photo)!} alt="" className="size-12 rounded-full object-cover" />
                  ) : (
                    <span className="size-12 rounded-full bg-cream grid place-items-center text-lg" aria-hidden>
                      {a.name.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">
                      {a.name}
                      {(a.rsvp?.partySize ?? 1) > 1 && (
                        <span className="text-xs font-medium text-ink-faint"> +{(a.rsvp!.partySize ?? 1) - 1}</span>
                      )}
                    </p>
                    {showBio && <p className="text-sm text-ink-soft truncate">{p.bio}</p>}
                    {showIg && (
                      <a
                        href={`https://instagram.com/${p.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="text-sm font-semibold text-coral-deep underline underline-offset-2"
                      >
                        @{p.instagram}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-center pt-2">
          <Link href={`/i/${token}`} className="text-sm font-semibold text-coral-deep underline underline-offset-4">
            {t.common.back}
          </Link>
        </p>
      </div>
    </main>
  );
}

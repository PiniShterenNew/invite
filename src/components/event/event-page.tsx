/* eslint-disable @next/next/no-img-element */
import { clsx } from "clsx";
import { t } from "@/lib/i18n/he";
import { formatEventDate, formatEventTime, gmapsUrl, wazeUrl } from "@/lib/format";
import type { EventView, ViewerContext } from "@/components/event/types";
import { templateStyle, accentStyle } from "@/components/event/templates";
import { Countdown } from "@/components/event/countdown";
import { RsvpForm } from "@/components/event/rsvp-form";
import Link from "next/link";

// The invitation page a guest sees. Server component; all privacy filtering
// already happened in buildEventView. Renders one of four visual templates.

const TYPE_EMOJI: Record<string, string> = {
  BIRTHDAY: "🎂",
  HOUSE_PARTY: "🏠",
  ROOFTOP: "🌇",
  BACHELOR: "🥂",
  BACHELORETTE: "👰",
  OTHER: "🎉",
};

export function EventPage({ event, viewer }: { event: EventView; viewer: ViewerContext }) {
  const s = templateStyle(event.template);
  const accent = accentStyle(event.accentColor);
  const starts = new Date(event.startsAt);
  const rsvpYes = viewer.rsvp?.status === "YES";

  return (
    <div className={clsx("min-h-dvh", s.page)}>
      <div className="max-w-lg mx-auto pb-16">
        {event.announcement && (
          <div className={clsx("mx-4 mt-4 rounded-2xl px-4 py-3 font-semibold text-sm", accent.solid)} role="status">
            <span className="block text-xs opacity-80">{t.invite.updateBanner}</span>
            {event.announcement}
          </div>
        )}

        {event.coverUrl && (
          <div className="px-4 pt-4">
            <img src={event.coverUrl} alt="" className="w-full aspect-[3/2] object-cover rounded-card shadow-pop" />
          </div>
        )}

        <header className={s.hero}>
          {viewer.guestName && viewer.kind === "personal" && !viewer.rsvp && (
            <p className={clsx("text-sm font-medium mb-2", s.heroMeta)}>
              {viewer.guestName} 👋
            </p>
          )}
          <p className="text-3xl mb-1" aria-hidden>
            {TYPE_EMOJI[event.type] ?? "🎉"}
          </p>
          <h1 className={s.heroTitle}>{event.name}</h1>
          <p className={clsx("mt-2 font-medium", s.heroMeta)}>{t.invite.hostedBy(event.hostName)}</p>
        </header>

        {event.showCountdown && !event.ended && (
          <div className="px-6 pb-6">
            <Countdown target={event.startsAt} chipClass={s.chip} />
          </div>
        )}

        <div className="px-4 space-y-4">
          {/* when & where */}
          <section className={clsx("p-5 space-y-4", s.card)}>
            <div className="flex items-start gap-3">
              <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl text-lg", s.chip)} aria-hidden>
                📅
              </span>
              <div>
                <p className="font-bold">{formatEventDate(starts, event.timezone)}</p>
                <p className={clsx("text-sm", s.heroMeta)}>
                  {formatEventTime(starts, event.timezone)}
                  {event.endsAt && ` – ${formatEventTime(new Date(event.endsAt), event.timezone)}`}
                </p>
              </div>
            </div>
            {(event.locationName || event.locationAddress || event.addressHint) && (
              <div className="flex items-start gap-3">
                <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl text-lg", s.chip)} aria-hidden>
                  📍
                </span>
                <div className="min-w-0 space-y-1.5">
                  {event.locationName && <p className="font-bold">{event.locationName}</p>}
                  {event.locationAddress ? (
                    <>
                      <p className={clsx("text-sm", s.heroMeta)}>{event.locationAddress}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          className={clsx("inline-flex items-center gap-1.5 rounded-xl px-3 min-h-10 text-sm font-bold transition-all active:scale-[0.97]", accent.soft, accent.text)}
                          href={wazeUrl(event.locationAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🧭 {t.invite.navigateWaze}
                        </a>
                        <a
                          className={clsx("inline-flex items-center gap-1.5 rounded-xl px-3 min-h-10 text-sm font-bold transition-all active:scale-[0.97]", accent.soft, accent.text)}
                          href={gmapsUrl(event.locationAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📍 {t.invite.navigateGmaps}
                        </a>
                      </div>
                    </>
                  ) : event.addressHint ? (
                    <p className={clsx("text-sm italic", s.heroMeta)}>
                      {event.addressHint === "PERSONAL_ONLY" ? t.invite.addressPersonalOnly : t.invite.addressAfterRsvp}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </section>

          {event.description && (
            <section className={clsx("p-5", s.card)}>
              <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </section>
          )}

          {/* RSVP */}
          {event.ended ? (
            <section className={clsx("p-6 text-center space-y-1", s.card)}>
              <p className="font-bold text-lg">{t.invite.eventEnded}</p>
              <p className={clsx("text-sm", s.heroMeta)}>{t.invite.eventEndedText}</p>
            </section>
          ) : (
            <section className={clsx("p-5", s.card)} id="rsvp">
              <RsvpForm event={event} viewer={viewer} />
            </section>
          )}

          {/* post-RSVP actions */}
          {rsvpYes && viewer.token && !event.ended && (
            <section className={clsx("p-5 space-y-2", s.card)}>
              <a
                href={`/api/ics/${viewer.token}`}
                className={clsx("flex items-center gap-2 rounded-2xl px-4 min-h-12 font-bold transition-all active:scale-[0.98]", accent.soft, accent.text)}
              >
                📆 {t.invite.addToCalendar}
              </a>
              {event.showGuestList && (
                <Link
                  href={`/i/${viewer.token}/attendees`}
                  className={clsx("flex items-center gap-2 rounded-2xl px-4 min-h-12 font-bold transition-all active:scale-[0.98]", accent.soft, accent.text)}
                >
                  👥 {t.invite.viewAttendees}
                </Link>
              )}
              <Link
                href={`/i/${viewer.token}/profile`}
                className={clsx("flex items-center gap-2 rounded-2xl px-4 min-h-12 font-bold transition-all active:scale-[0.98]", accent.soft, accent.text)}
              >
                ✨ {viewer.hasProfile ? t.profile.title : t.profile.createCta}
              </Link>
            </section>
          )}

          {/* optional sections */}
          {event.schedule.length > 0 && (
            <section className={clsx("p-5 space-y-2", s.card)}>
              <h2 className={s.sectionTitle}>{t.invite.schedule}</h2>
              <ul className="space-y-1.5">
                {event.schedule.map((row, i) => (
                  <li key={i} className="flex gap-3 items-baseline">
                    <span className={clsx("rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums shrink-0", s.chip)}>{row.time}</span>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(event.dressCode || event.bringList) && (
            <section className={clsx("p-5 space-y-3", s.card)}>
              {event.dressCode && (
                <div>
                  <h2 className={s.sectionTitle}>{t.invite.dressCode}</h2>
                  <p className={s.heroMeta}>{event.dressCode}</p>
                </div>
              )}
              {event.bringList && (
                <div>
                  <h2 className={s.sectionTitle}>{t.invite.bring}</h2>
                  <p className={clsx("whitespace-pre-wrap", s.heroMeta)}>{event.bringList}</p>
                </div>
              )}
            </section>
          )}

          {event.playlistUrl && (
            <section className={clsx("p-5", s.card)}>
              <a href={event.playlistUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                🎵 {t.invite.playlist}
              </a>
            </section>
          )}
        </div>

        <footer className="text-center pt-10 pb-4">
          <Link href="/" className={clsx("text-sm font-semibold", s.heroMeta)}>
            {t.common.appName} · {t.common.tagline}
          </Link>
        </footer>
      </div>
    </div>
  );
}

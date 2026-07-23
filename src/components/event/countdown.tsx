"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n/he";

// Client countdown. Rendered only before the event starts; hidden entirely
// for users who prefer reduced motion? No — it updates once a minute, which
// is not motion; it stays.

export function Countdown({ target, chipClass }: { target: string; chipClass: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Deferred (not called synchronously in the effect body) so the first
    // client render still matches the server's null render — avoids a
    // hydration mismatch while still showing the countdown almost instantly.
    const tick = () => setNow(new Date());
    const kickoff = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, []);

  if (!now) return null;
  const diff = new Date(target).getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  const cell = (value: number, label: string) => (
    <div className={`flex flex-col items-center rounded-2xl px-4 py-2.5 min-w-18 shadow-card ${chipClass}`}>
      <span className="text-3xl font-extrabold leading-none tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );

  const sep = (
    <span aria-hidden className="self-center pb-4 text-2xl font-bold opacity-40">
      :
    </span>
  );

  return (
    <div
      dir="ltr"
      className="flex items-stretch justify-center gap-2"
      role="timer"
      aria-label={`${days} ${t.invite.countdownDays}, ${hours} ${t.invite.countdownHours}, ${minutes} ${t.invite.countdownMinutes}`}
    >
      {cell(days, t.invite.countdownDays)}
      {sep}
      {cell(hours, t.invite.countdownHours)}
      {sep}
      {cell(minutes, t.invite.countdownMinutes)}
    </div>
  );
}

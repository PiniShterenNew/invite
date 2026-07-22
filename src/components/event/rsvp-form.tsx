"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { t } from "@/lib/i18n/he";
import type { EventView, ViewerContext } from "@/components/event/types";
import { submitPersonalRsvp, submitGeneralRsvp } from "@/app/actions/guest";
import { accentStyle } from "@/components/event/templates";
import { Input, Textarea } from "@/components/ui";

// The RSVP form — a guided, step-by-step flow. Works for both personal invites
// (token) and the general link (asks for a name, then redirects to the newly
// minted personal link). Steps are computed from the current answer so guests
// only see what applies to them.

type StepKey = "status" | "name" | "party" | "questions" | "message" | "review";

export function RsvpForm({ event, viewer }: { event: EventView; viewer: ViewerContext }) {
  const router = useRouter();
  const accent = accentStyle(event.accentColor);
  const existing = viewer.rsvp;
  const rootRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<string>(existing?.status ?? "");
  const [partySize, setPartySize] = useState(existing?.partySize ?? 1);
  const [name, setName] = useState("");
  const [message, setMessage] = useState(existing?.message ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>(existing?.answers ?? {});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [pending, startTransition] = useTransition();

  const blocked = event.deadlinePassed && event.deadlinePolicy === "BLOCK";
  const maxParty = Math.min(
    viewer.maxParty,
    status === "YES" && viewer.seatsLeft != null ? Math.max(1, viewer.seatsLeft + (existing?.status === "YES" ? existing.partySize : 0)) : viewer.maxParty
  );

  const steps = useMemo<StepKey[]>(() => {
    const s: StepKey[] = ["status"];
    if (viewer.kind === "general") s.push("name");
    if (status === "YES" && maxParty > 1) s.push("party");
    if (status && status !== "NO" && event.questions.length > 0) s.push("questions");
    if (status && status !== "NO") s.push("message");
    s.push("review");
    return s;
  }, [viewer.kind, status, maxParty, event.questions.length]);

  const idx = Math.min(stepIndex, steps.length - 1);
  const current = steps[idx];
  const isLast = idx === steps.length - 1;

  const scrollToFormTop = () => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const go = (target: number) => {
    setError(null);
    setStepIndex(Math.max(0, Math.min(steps.length - 1, target)));
    scrollToFormTop();
  };
  const next = () => go(idx + 1);
  const back = () => go(idx - 1);

  if (event.ended) return null;
  if (blocked && !existing) {
    return <p className="text-center font-medium py-4">{t.invite.deadlinePassedBlock}</p>;
  }

  const submit = () => {
    setError(null);
    if (!status) return;
    const payload = {
      status,
      partySize: status === "YES" ? partySize : 1,
      message,
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
    };
    startTransition(async () => {
      if (viewer.kind === "personal" && viewer.token) {
        const res = await submitPersonalRsvp(viewer.token, payload);
        if (!res.ok) setError(res.error);
        else {
          setDone(status);
          router.refresh();
        }
      } else {
        const res = await submitGeneralRsvp(event.slug, { ...payload, name });
        if (!res.ok) setError(res.error);
        else router.push(`/i/${res.data!.token}?welcome=1`);
      }
    });
  };

  if (done) {
    return (
      <div className="text-center py-6 space-y-2 animate-rise" role="status">
        <p className="text-4xl" aria-hidden>
          {done === "YES" ? "🎉" : done === "MAYBE" ? "🤞" : "💜"}
        </p>
        <p className="font-bold text-lg">
          {done === "YES" ? t.invite.thanksYes : done === "MAYBE" ? t.invite.thanksMaybe : t.invite.thanksNo}
        </p>
      </div>
    );
  }

  // High-contrast pill button, consistent across all four templates: selected
  // uses the accent solid; unselected uses the accent's soft tint + deep text.
  const pill = (selected: boolean, extra?: string) =>
    clsx(
      "rounded-2xl border-2 border-transparent font-bold transition-all active:scale-[0.97]",
      selected ? `${accent.solid} shadow-pop` : `${accent.soft} ${accent.text} hover:brightness-95`,
      extra
    );

  const statusBtn = (value: string, label: string, emoji: string) => (
    <button
      type="button"
      onClick={() => {
        setStatus(value);
        setError(null);
        // Advance out of the status step automatically.
        setStepIndex(1);
        scrollToFormTop();
      }}
      aria-pressed={status === value}
      className={pill(status === value, "flex-1 min-h-14 text-base flex flex-col items-center justify-center gap-0.5")}
    >
      <span className="text-xl" aria-hidden>{emoji}</span>
      {label}
    </button>
  );

  const canProceed =
    current === "name" ? name.trim().length > 0 : true;

  return (
    <div ref={rootRef} className="space-y-4 scroll-mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {existing ? t.invite.changeAnswer : t.invite.rsvpTitle}
        </h2>
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={clsx("h-1.5 rounded-full transition-all", i === idx ? `w-5 ${accent.solid}` : i < idx ? `w-1.5 ${accent.solid} opacity-50` : "w-1.5 bg-current/20")}
            />
          ))}
        </div>
      </div>

      {event.deadlinePassed && event.deadlinePolicy === "WARN" && (
        <p className="text-sm text-center font-medium bg-maybe-soft text-maybe rounded-xl px-3 py-2">
          {t.invite.deadlinePassedWarn}
        </p>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) submit();
          else if (canProceed) next();
        }}
      >
        {current === "status" && (
          <div className="flex gap-2" role="group" aria-label={t.invite.rsvpTitle}>
            {statusBtn("YES", t.invite.yes, "🎉")}
            {statusBtn("MAYBE", t.invite.maybe, "🤞")}
            {statusBtn("NO", t.invite.no, "😔")}
          </div>
        )}

        {current === "name" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{t.invite.yourNameLabel}</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.invite.yourNamePlaceholder}
              required
              maxLength={80}
              autoComplete="name"
              autoFocus
            />
          </label>
        )}

        {current === "party" && (
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold">{t.invite.partyLabel}</span>
            <div className="flex gap-2 flex-wrap" role="group" aria-label={t.invite.partyLabel}>
              {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPartySize(n)}
                  aria-pressed={partySize === n}
                  className={pill(partySize === n, "size-12 text-lg")}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="block text-xs opacity-70">{t.invite.partyHint(viewer.maxParty)}</span>
          </div>
        )}

        {current === "questions" &&
          event.questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <span className="block text-sm font-semibold">{q.label}</span>
              {q.type === "TEXT" && (
                <Input value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} maxLength={500} />
              )}
              {q.type === "YESNO" && (
                <div className="flex gap-2">
                  {[t.common.yes, t.common.no].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={answers[q.id] === opt}
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      className={pill(answers[q.id] === opt, "flex-1 min-h-11")}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {(q.type === "SINGLE" || q.type === "MULTI") && (
                <div className="flex gap-2 flex-wrap">
                  {q.options.map((opt) => {
                    const selected =
                      q.type === "SINGLE" ? answers[q.id] === opt : (answers[q.id] ?? "").split("|").includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          if (q.type === "SINGLE") setAnswers({ ...answers, [q.id]: opt });
                          else {
                            const cur = (answers[q.id] ?? "").split("|").filter(Boolean);
                            const nextVal = selected ? cur.filter((o) => o !== opt) : [...cur, opt];
                            setAnswers({ ...answers, [q.id]: nextVal.join("|") });
                          }
                        }}
                        className={pill(selected, "min-h-11 px-4")}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

        {current === "message" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">
              {t.invite.messageLabel} <span className="font-normal opacity-60">({t.common.optional})</span>
            </span>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.invite.messagePlaceholder} maxLength={300} autoFocus />
          </label>
        )}

        {current === "review" && (
          <div className="space-y-2 rounded-2xl bg-current/5 p-4">
            <ReviewRow label={t.invite.rsvpTitle} value={status === "YES" ? t.invite.yes : status === "MAYBE" ? t.invite.maybe : t.invite.no} />
            {viewer.kind === "general" && name.trim() && <ReviewRow label={t.invite.yourNameLabel} value={name} />}
            {status === "YES" && maxParty > 1 && <ReviewRow label={t.invite.partyLabel} value={String(partySize)} />}
            {status !== "NO" && message.trim() && <ReviewRow label={t.invite.messageLabel} value={message} />}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-center font-medium bg-no-soft text-no rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {idx > 0 && (
            <button
              type="button"
              onClick={back}
              disabled={pending}
              className="min-h-12 rounded-2xl px-5 font-bold border-2 border-current/25 hover:border-current/40 transition-colors"
            >
              {t.common.back}
            </button>
          )}
          {current !== "status" && (
            <button
              type="submit"
              disabled={pending || !canProceed}
              className={clsx("flex-1 min-h-12 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50", accent.solid, "shadow-pop")}
            >
              {pending ? t.common.loading : isLast ? (existing ? t.invite.updateRsvp : t.invite.submit) : t.common.next}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="font-semibold opacity-70">{label}</span>
      <span className="font-bold text-end">{value}</span>
    </div>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { t } from "@/lib/i18n/he";
import {
  ACCENT_COLORS,
  ADDRESS_REVEALS,
  ACCESS_MODES,
  EVENT_TYPES,
  MAX_QUESTIONS,
  NOTIFY_MODES,
  QUESTION_TYPES,
  TEMPLATES,
  BACKGROUND_PATTERNS,
  FONT_SIZES,
} from "@/lib/constants";
import {
  publishEvent,
  removeCover,
  saveBasics,
  saveContent,
  saveDesign,
  saveLocation,
  uploadCover,
} from "@/app/actions/organizer";
import { Button, ButtonLink, Field, Input, SegmentedOption, Textarea } from "@/components/ui";
import { DatePicker, Dropdown, TimePicker, Toggle } from "@/components/controls";
import { scrollToTop } from "@/lib/scroll";
import { ACCENT_STYLES, TEMPLATE_STYLES, TYPOGRAPHY_STYLES, templateStyle, accentStyle } from "@/components/event/templates";
import { X, Rocket, CheckCircle2, Eye } from "lucide-react";

// 5-step creation wizard. Each step saves through its own server action;
// moving between steps always persists the current one first (auto-save).

export interface WizardInitial {
  id: string;
  slug: string;
  status: string;
  type: string;
  name: string;
  hostName: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  locationName: string;
  locationAddress: string;
  addressReveal: string;
  accessMode: string;
  hasAccessCode: boolean;
  template: string;
  accentColor: string;
  typography: string;
  backgroundPattern: string;
  fontSize: string;
  coverUrl: string | null;
  description: string;
  dressCode: string;
  schedule: { time: string; label: string }[];
  bringList: string;
  playlistUrl: string;
  showCountdown: boolean;
  showGuestList: boolean;
  questions: { id?: string; type: string; label: string; options: string[] }[];
  rsvpDeadline: string | null;
  deadlinePolicy: string;
  capacity: number | null;
  notifyMode: string;
}


function toLocalInput(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function EventWizard({ initial }: { initial: WizardInitial }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [accessCode, setAccessCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const start = useMemo(() => toLocalInput(state.startsAt), [state.startsAt]);
  const end = useMemo(() => toLocalInput(state.endsAt), [state.endsAt]);
  const deadline = useMemo(() => toLocalInput(state.rsvpDeadline), [state.rsvpDeadline]);

  const steps = [t.wizard.stepBasics, t.wizard.stepLocation, t.wizard.stepDesign, t.wizard.stepContent, t.wizard.stepGuests];

  const set = <K extends keyof WizardInitial>(key: K, value: WizardInitial[K]) => setState((s) => ({ ...s, [key]: value }));

  const saveStep = async (index: number): Promise<boolean> => {
    setError(null);
    const s = state;
    const run = async () => {
      switch (index) {
        case 0:
          return saveBasics(s.id, {
            type: s.type,
            name: s.name,
            hostName: s.hostName,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            timezone: s.timezone,
          });
        case 1:
          return saveLocation(s.id, {
            locationName: s.locationName,
            locationAddress: s.locationAddress,
            addressReveal: s.addressReveal,
            accessMode: s.accessMode,
            accessCode,
          });
        case 2:
          return saveDesign(s.id, { template: s.template, accentColor: s.accentColor, typography: s.typography, backgroundPattern: s.backgroundPattern, fontSize: s.fontSize });
        case 3:
          return saveContent(s.id, {
            description: s.description,
            dressCode: s.dressCode,
            schedule: s.schedule.filter((r) => r.time && r.label),
            bringList: s.bringList,
            playlistUrl: s.playlistUrl,
            showCountdown: s.showCountdown,
            showGuestList: s.showGuestList,
            questions: s.questions.filter((q) => q.label.trim()),
            rsvpDeadline: s.rsvpDeadline,
            deadlinePolicy: s.deadlinePolicy,
            capacity: s.capacity,
            notifyMode: s.notifyMode,
          });
        default:
          return { ok: true as const };
      }
    };
    const res = await run();
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setSaved(true);
    return true;
  };

  const goTo = (target: number) => {
    startTransition(async () => {
      if (await saveStep(step)) {
        setStep(target);
        scrollToTop();
      }
    });
  };

  const publish = () => {
    startTransition(async () => {
      if (!(await saveStep(step))) return;
      const res = await publishEvent(state.id);
      if (!res.ok) setError(res.error);
      else router.push(`/app/events/${state.id}?published=1`);
    });
  };

  return (
    <div className="space-y-5 animate-rise pb-24">
      {/* step indicator */}
      <nav aria-label={t.wizard.title} className="flex gap-1.5">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => goTo(i)}
            aria-current={step === i ? "step" : undefined}
            className={clsx(
              "flex-1 rounded-xl py-2 text-xs font-bold transition-colors min-h-11",
              i === step ? "bg-coral text-white" : i < step ? "bg-coral-soft text-coral-deep" : "bg-cream text-ink-faint"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between min-h-5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-extrabold text-ink">{state.name || t.wizard.title}</h1>
          <span className="text-xs font-semibold text-ink-faint tabular-nums">
            {step + 1}/{steps.length}
          </span>
        </div>
        {saved && <span className="text-xs text-ink-faint">{t.wizard.autoSaved} ✓</span>}
      </div>

      {/* STEP 1 — basics */}
      {step === 0 && (
        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-4">
          <Field label={t.wizard.eventTypeLabel}>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((type) => (
                <SegmentedOption key={type} name="type" value={type} checked={state.type === type} onChange={() => set("type", type)} title={t.eventTypes[type]} />
              ))}
            </div>
          </Field>
          <Field label={t.wizard.nameLabel}>
            <Input value={state.name} onChange={(e) => set("name", e.target.value)} placeholder={t.wizard.namePlaceholder} maxLength={80} required />
          </Field>
          <Field label={t.wizard.hostLabel}>
            <Input value={state.hostName} onChange={(e) => set("hostName", e.target.value)} placeholder={t.wizard.hostPlaceholder} maxLength={60} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.wizard.dateLabel}>
              <DatePicker
                value={start.date}
                aria-label={t.wizard.dateLabel}
                onChange={(date) => set("startsAt", new Date(`${date}T${start.time || "20:00"}`).toISOString())}
              />
            </Field>
            <Field label={t.wizard.startLabel}>
              <TimePicker
                value={start.time}
                aria-label={t.wizard.startLabel}
                onChange={(time) => set("startsAt", new Date(`${start.date || "2026-01-01"}T${time}`).toISOString())}
              />
            </Field>
          </div>
          <Field label={t.wizard.endLabel}>
            <TimePicker
              value={end.time}
              aria-label={t.wizard.endLabel}
              onChange={(time) => set("endsAt", start.date ? new Date(`${start.date}T${time}`).toISOString() : null)}
            />
          </Field>
        </section>
      )}

      {/* STEP 2 — location & access */}
      {step === 1 && (
        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-4">
          <Field label={t.wizard.locationNameLabel}>
            <Input value={state.locationName} onChange={(e) => set("locationName", e.target.value)} placeholder={t.wizard.locationNamePlaceholder} maxLength={80} />
          </Field>
          <Field label={t.wizard.addressLabel}>
            <Input value={state.locationAddress} onChange={(e) => set("locationAddress", e.target.value)} placeholder={t.wizard.addressPlaceholder} maxLength={160} />
          </Field>
          <Field label={t.wizard.addressRevealLabel}>
            <div className="space-y-2">
              {ADDRESS_REVEALS.map((v) => (
                <SegmentedOption key={v} name="addressReveal" value={v} checked={state.addressReveal === v} onChange={() => set("addressReveal", v)} title={t.wizard[`addressReveal${v}`]} />
              ))}
            </div>
          </Field>
          <Field label={t.wizard.accessModeLabel}>
            <div className="space-y-2">
              {ACCESS_MODES.map((v) => (
                <SegmentedOption
                  key={v}
                  name="accessMode"
                  value={v}
                  checked={state.accessMode === v}
                  onChange={() => set("accessMode", v)}
                  title={t.wizard[v === "GENERAL" ? "accessGENERAL" : v === "PERSONAL_ONLY" ? "accessPERSONAL_ONLY" : "accessCODE"]}
                />
              ))}
            </div>
          </Field>
          {state.accessMode === "CODE" && (
            <Field label={t.wizard.accessCodeLabel} hint={state.hasAccessCode ? "✓" : undefined}>
              <Input value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder={t.wizard.accessCodePlaceholder} maxLength={8} />
            </Field>
          )}
        </section>
      )}

      {/* STEP 3 — design */}
      {step === 2 && (
        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-4">
          <Field label={t.wizard.templateLabel}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => {
                const ts = TEMPLATE_STYLES[tpl];
                return (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => set("template", tpl)}
                    aria-pressed={state.template === tpl}
                    className={clsx(
                      "rounded-2xl border-2 overflow-hidden transition-all text-start",
                      state.template === tpl ? "ring-2 ring-coral ring-offset-2" : ""
                    )}
                  >
                    <div className={clsx("p-4 h-36 flex flex-col justify-end", ts.page)}>
                      <div className={clsx("rounded-xl p-3 space-y-1", ts.card)}>
                        <p className={clsx("text-sm font-bold truncate", ts.heroTitle?.includes("font-display") ? "font-display" : "")}>
                          {state.name || t.wizard.title}
                        </p>
                        <p className={clsx("text-xs truncate", ts.heroMeta)}>
                          {state.hostName || t.wizard.hostPlaceholder}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={t.wizard.accentLabel}>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={state.accentColor === c}
                  onClick={() => set("accentColor", c)}
                  className={clsx(
                    "size-11 rounded-full border-4 transition-all",
                    ACCENT_STYLES[c].solid.split(" ")[0],
                    state.accentColor === c ? "border-ink scale-110" : "border-transparent"
                  )}
                />
              ))}
            </div>
          </Field>
          <Field label={t.wizard.typographyLabel}>
            <div className="grid grid-cols-3 gap-2">
              {(["default", "serif", "bold"] as const).map((typo) => (
                <button
                  key={typo}
                  type="button"
                  onClick={() => set("typography", typo)}
                  aria-pressed={state.typography === typo}
                  className={clsx(
                    "rounded-2xl border-2 p-3 text-center transition-all min-h-16",
                    state.typography === typo ? "border-coral bg-coral-soft" : "border-line bg-white"
                  )}
                >
                  <span className={clsx(
                    "block text-lg leading-tight",
                    typo === "serif" ? "font-display" : "",
                    typo === "bold" ? "font-extrabold tracking-tight" : "font-semibold"
                  )}>
                    {t.wizard[`typography${typo.charAt(0).toUpperCase() + typo.slice(1)}` as `typography${"Default" | "Serif" | "Bold"}`]}
                  </span>
                  <span className={clsx(
                    "block text-xs mt-1 text-ink-faint",
                    typo === "serif" ? "font-display" : "",
                    typo === "bold" ? "font-bold" : ""
                  )}>
                    אבגד הוזח
                  </span>
                </button>
              ))}
            </div>
          </Field>
          <Field label={t.wizard.patternLabel}>
            <div className="grid grid-cols-5 gap-2">
              {BACKGROUND_PATTERNS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("backgroundPattern", p)}
                  aria-pressed={state.backgroundPattern === p}
                  className={clsx(
                    "rounded-2xl border-2 p-2 text-center text-xs font-semibold transition-all min-h-12",
                    state.backgroundPattern === p ? "border-coral bg-coral-soft" : "border-line bg-white"
                  )}
                >
                  {t.wizard[`pattern${p.charAt(0).toUpperCase() + p.slice(1)}` as `pattern${"None" | "Dots" | "Waves" | "Confetti" | "Geometric"}`]}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t.wizard.fontSizeLabel}>
            <div className="grid grid-cols-3 gap-2">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs}
                  type="button"
                  onClick={() => set("fontSize", fs)}
                  aria-pressed={state.fontSize === fs}
                  className={clsx(
                    "rounded-2xl border-2 p-3 text-center transition-all min-h-12",
                    state.fontSize === fs ? "border-coral bg-coral-soft" : "border-line bg-white",
                    fs === "compact" ? "text-sm" : fs === "large" ? "text-lg" : "text-base"
                  )}
                >
                  <span className="font-semibold">
                    {t.wizard[`fontSize${fs.charAt(0).toUpperCase() + fs.slice(1)}` as `fontSize${"Compact" | "Normal" | "Large"}`]}
                  </span>
                </button>
              ))}
            </div>
          </Field>
          <Field label={t.wizard.coverLabel} hint={t.wizard.coverHint}>
            <div className="space-y-3">
              {state.coverUrl && <img src={state.coverUrl} alt="" className="w-full aspect-[3/2] object-cover rounded-2xl" />}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-ink-soft file:me-3 file:rounded-xl file:border-0 file:bg-cream file:px-4 file:py-2.5 file:font-semibold file:text-ink"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.set("cover", file);
                  startTransition(async () => {
                    const res = await uploadCover(state.id, fd);
                    if (!res.ok) setError(res.error);
                    else set("coverUrl", res.data!.url);
                  });
                }}
              />
              {state.coverUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      await removeCover(state.id);
                      set("coverUrl", null);
                      if (fileRef.current) fileRef.current.value = "";
                    })
                  }
                >
                  {t.wizard.coverRemove}
                </Button>
              )}
            </div>
          </Field>
          {/* live design preview */}
          <div className="border-t border-line pt-4">
            <p className="text-sm font-bold text-ink mb-3">{t.wizard.designPreview}</p>
            <div className={clsx("rounded-2xl overflow-hidden border border-line shadow-card", templateStyle(state.template).page, state.backgroundPattern !== "none" ? `bg-pattern-${state.backgroundPattern}` : "", state.fontSize === "compact" ? "text-scale-compact" : state.fontSize === "large" ? "text-scale-large" : "")}>
              {state.coverUrl && (
                <img src={state.coverUrl} alt="" className="w-full aspect-[3/1] object-cover" />
              )}
              <div className={clsx("p-5 text-center space-y-1", templateStyle(state.template).hero.replace(/pt-\d+/, "pt-4").replace(/pb-\d+/, "pb-4"))}>
                <p className={clsx(
                  "text-2xl leading-tight",
                  templateStyle(state.template).heroTitle,
                  TYPOGRAPHY_STYLES[state.typography] ?? ""
                )}>
                  {state.name || t.wizard.title}
                </p>
                <p className={clsx("text-sm", templateStyle(state.template).heroMeta)}>
                  {state.hostName ? `${state.hostName} מזמין/ה אתכם` : ""}
                </p>
              </div>
              <div className="px-5 pb-4 flex justify-center">
                <span className={clsx("rounded-xl px-5 py-2 text-sm font-bold", accentStyle(state.accentColor).solid)}>
                  {t.invite.rsvpTitle}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4 — content, questions & policies */}
      {step === 3 && (
        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-4">
          <Field label={t.wizard.descriptionLabel}>
            <Textarea value={state.description} onChange={(e) => set("description", e.target.value)} placeholder={t.wizard.descriptionPlaceholder} maxLength={1000} />
          </Field>
          <Field label={t.wizard.dressCodeLabel}>
            <Input value={state.dressCode} onChange={(e) => set("dressCode", e.target.value)} placeholder={t.wizard.dressCodePlaceholder} maxLength={120} />
          </Field>
          <Field label={t.wizard.scheduleLabel}>
            <div className="space-y-2">
              {state.schedule.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label={t.wizard.scheduleTime} value={row.time} onChange={(e) => set("schedule", state.schedule.map((r, j) => (j === i ? { ...r, time: e.target.value } : r)))} placeholder="21:00" className="w-24" maxLength={20} />
                  <Input aria-label={t.wizard.scheduleWhat} value={row.label} onChange={(e) => set("schedule", state.schedule.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))} maxLength={80} />
                  <Button type="button" variant="ghost" aria-label={t.common.delete} onClick={() => set("schedule", state.schedule.filter((_, j) => j !== i))}>
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              {state.schedule.length < 12 && (
                <Button type="button" variant="secondary" onClick={() => set("schedule", [...state.schedule, { time: "", label: "" }])}>
                  + {t.wizard.scheduleAdd}
                </Button>
              )}
            </div>
          </Field>
          <Field label={t.wizard.bringLabel}>
            <Input value={state.bringList} onChange={(e) => set("bringList", e.target.value)} placeholder={t.wizard.bringPlaceholder} maxLength={500} />
          </Field>
          <Field label={t.wizard.playlistLabel}>
            <Input value={state.playlistUrl} onChange={(e) => set("playlistUrl", e.target.value)} placeholder={t.wizard.playlistPlaceholder} dir="ltr" maxLength={300} />
          </Field>

          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-semibold text-ink">{t.wizard.countdownLabel}</span>
            <Toggle checked={state.showCountdown} onChange={(v) => set("showCountdown", v)} aria-label={t.wizard.countdownLabel} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-semibold text-ink">{t.wizard.guestListLabel}</span>
              <Toggle checked={state.showGuestList} onChange={(v) => set("showGuestList", v)} aria-label={t.wizard.guestListLabel} />
            </div>
            <p className="text-xs text-ink-faint">{t.wizard.guestListHint}</p>
          </div>

          {/* questions */}
          <fieldset className="space-y-3 border-t border-line pt-4">
            <legend className="text-sm font-bold text-ink">{t.wizard.questionsTitle}</legend>
            {state.questions.map((q, i) => (
              <div key={i} className="bg-cream rounded-2xl p-3 space-y-2">
                <div className="flex gap-2">
                  <Input aria-label={t.wizard.questionLabel} value={q.label} onChange={(e) => set("questions", state.questions.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder={t.wizard.questionLabel} maxLength={120} />
                  <Button type="button" variant="ghost" aria-label={t.common.delete} onClick={() => set("questions", state.questions.filter((_, j) => j !== i))}>
                    <X className="size-4" />
                  </Button>
                </div>
                <Dropdown
                  aria-label={t.wizard.questionType}
                  value={q.type}
                  onChange={(type) => set("questions", state.questions.map((x, j) => (j === i ? { ...x, type } : x)))}
                  options={QUESTION_TYPES.map((qt) => ({ value: qt, label: t.wizard[`questionType${qt}`] }))}
                />
                {(q.type === "SINGLE" || q.type === "MULTI") && (
                  <Textarea
                    aria-label={t.wizard.questionOptions}
                    value={q.options.join("\n")}
                    onChange={(e) => set("questions", state.questions.map((x, j) => (j === i ? { ...x, options: e.target.value.split("\n") } : x)))}
                    placeholder={t.wizard.questionOptions}
                  />
                )}
              </div>
            ))}
            {state.questions.length < MAX_QUESTIONS && (
              <Button type="button" variant="secondary" onClick={() => set("questions", [...state.questions, { type: "TEXT", label: "", options: [] }])}>
                + {t.wizard.questionAdd}
              </Button>
            )}
          </fieldset>

          {/* policies */}
          <div className="border-t border-line pt-4 space-y-4">
            <Field label={`${t.wizard.deadlineLabel} (${t.common.optional})`}>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={deadline.date}
                  placeholder={t.wizard.dateLabel}
                  aria-label={t.wizard.deadlineLabel}
                  onChange={(date) => set("rsvpDeadline", new Date(`${date}T${deadline.time || "23:59"}`).toISOString())}
                />
                <TimePicker
                  value={deadline.time}
                  aria-label={t.wizard.deadlineLabel}
                  onChange={(time) => deadline.date && set("rsvpDeadline", new Date(`${deadline.date}T${time}`).toISOString())}
                />
              </div>
            </Field>
            {state.rsvpDeadline && (
              <Field label={t.wizard.deadlinePolicyLabel}>
                <div className="space-y-2">
                  <SegmentedOption name="deadlinePolicy" value="WARN" checked={state.deadlinePolicy === "WARN"} onChange={() => set("deadlinePolicy", "WARN")} title={t.wizard.deadlineWARN} />
                  <SegmentedOption name="deadlinePolicy" value="BLOCK" checked={state.deadlinePolicy === "BLOCK"} onChange={() => set("deadlinePolicy", "BLOCK")} title={t.wizard.deadlineBLOCK} />
                </div>
              </Field>
            )}
            <Field label={`${t.wizard.capacityLabel} (${t.common.optional})`} hint={t.wizard.capacityHint}>
              <Input
                inputMode="numeric"
                value={state.capacity ?? ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  set("capacity", digits ? Math.min(5000, Number(digits)) : null);
                }}
                className="w-32"
              />
            </Field>
            <Field label={t.wizard.notifyLabel}>
              <div className="space-y-2">
                {NOTIFY_MODES.map((m) => (
                  <SegmentedOption key={m} name="notifyMode" value={m} checked={state.notifyMode === m} onChange={() => set("notifyMode", m)} title={t.wizard[`notify${m}`]} />
                ))}
              </div>
            </Field>
          </div>
        </section>
      )}

      {/* STEP 5 — publish */}
      {step === 4 && (
        <section className={clsx("rounded-card border shadow-card p-5 space-y-4 text-center", state.status === "DRAFT" ? "bg-white border-line/60" : "bg-yes-soft border-yes/20")}>
          <div className="flex justify-center" aria-hidden>
            {state.status === "DRAFT" ? <CheckCircle2 className="size-10 text-coral" /> : <Rocket className="size-10 text-yes" />}
          </div>
          <p className="text-ink-soft">{state.status === "DRAFT" ? t.wizard.readyToPublish : t.wizard.publishedNextStep}</p>
          <div className="flex flex-col gap-2">
            {state.status === "DRAFT" ? (
              <>
                <ButtonLink href={`/app/events/${state.id}/preview`} variant="secondary" full>
                  <Eye className="size-4" /> {t.wizard.previewTitle}
                </ButtonLink>
                <Button type="button" full onClick={publish} disabled={pending || !state.name.trim()}>
                  {pending ? t.common.loading : t.wizard.publish}
                </Button>
              </>
            ) : (
              <>
                <ButtonLink href={`/app/events/${state.id}/guests`} full>
                  {t.wizard.manageGuests}
                </ButtonLink>
                <ButtonLink href={`/app/events/${state.id}/preview`} variant="secondary" full>
                  <Eye className="size-4" /> {t.wizard.previewTitle}
                </ButtonLink>
              </>
            )}
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-center font-medium bg-no-soft text-no rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* nav */}
      <div className="flex justify-between gap-3">
        <Button type="button" variant="secondary" onClick={() => goTo(step - 1)} disabled={pending || step === 0}>
          {t.common.back}
        </Button>
        {step < 4 && (
          <Button type="button" onClick={() => goTo(step + 1)} disabled={pending}>
            {pending ? t.common.loading : t.common.next}
          </Button>
        )}
      </div>
    </div>
  );
}

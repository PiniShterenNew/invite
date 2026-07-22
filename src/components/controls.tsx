"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Calendar } from "@/components/shadcn/calendar";

// App-level form controls composed from the shadcn/ui primitives, styled with
// the "באים?" tokens. These fully replace the native date/time/select/number/
// checkbox controls (product requirement) and inherit Radix's collision-aware
// positioning and keyboard/a11y behaviour.

// ── Dropdown (shadcn Select) ──────────────────────────────────────────────

export interface DropdownOption {
  value: string;
  label: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} dir="rtl">
      <SelectTrigger aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── NumberStepper (bespoke — no shadcn equivalent) ────────────────────────

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  "aria-label"?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const btn =
    "grid size-11 place-items-center rounded-xl bg-cream text-xl font-bold text-ink transition-colors hover:bg-sand disabled:opacity-40 disabled:pointer-events-none";
  return (
    <div role="group" aria-label={ariaLabel} className={clsx("inline-flex items-center gap-1 rounded-2xl border border-line bg-white p-1", className)}>
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="פחות">
        −
      </button>
      <span className="min-w-9 text-center text-base font-bold tabular-nums text-ink" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="עוד">
        +
      </button>
    </div>
  );
}

// ── Toggle (shadcn Switch) ────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
}) {
  return <Switch checked={checked} onCheckedChange={onChange} aria-label={ariaLabel} />;
}

// ── DatePicker (shadcn Popover + Calendar) ────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");
const labelFmt = new Intl.DateTimeFormat("he-IL", { weekday: "short", day: "numeric", month: "long" });
const fmtYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseYmd(value: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
}

const triggerCls =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 min-h-11 text-base text-ink text-start transition-colors hover:border-sand focus-visible:border-coral focus-visible:outline-none";

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);

  return (
    <div className={clsx("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={triggerCls} aria-label={ariaLabel}>
          <span className={clsx("truncate", !selected && "text-ink-faint")}>{selected ? labelFmt.format(selected) : placeholder ?? ""}</span>
          <svg aria-hidden viewBox="0 0 20 20" className="size-4 shrink-0 text-ink-faint">
            <path d="M6 2v3M14 2v3M3 8h14M4 5h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              if (d) onChange(fmtYmd(d));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── TimePicker (shadcn Popover + styled columns) ──────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export function TimePicker({
  value,
  onChange,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  const hour = m ? Number(m[1]) : null;
  const minute = m ? Number(m[2]) : null;
  const set = (h: number, mm: number) => onChange(`${pad(h)}:${pad(mm)}`);

  const col = "flex max-h-56 flex-col gap-1 overflow-auto rounded-2xl bg-cream/60 p-1.5";
  const item = (active: boolean) =>
    clsx("rounded-xl py-2.5 text-center text-base font-bold tabular-nums transition-colors", active ? "bg-coral text-white" : "text-ink hover:bg-white");

  return (
    <div className={clsx("relative", className)}>
      <Popover>
        <PopoverTrigger className={triggerCls} aria-label={ariaLabel}>
          <span className={clsx("tabular-nums", value ? "text-ink" : "text-ink-faint")}>{value || placeholder || "--:--"}</span>
          <svg aria-hidden viewBox="0 0 20 20" className="size-4 shrink-0 text-ink-faint">
            <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6v4l2.5 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </PopoverTrigger>
        <PopoverContent className="w-52">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-center text-xs font-bold text-ink-faint">שעה</p>
              <div className={col}>
                {HOURS.map((h) => (
                  <button key={h} type="button" onClick={() => set(h, minute ?? 0)} className={item(h === hour)}>
                    {pad(h)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-center text-xs font-bold text-ink-faint">דקות</p>
              <div className={col}>
                {MINUTES.map((mm) => (
                  <button key={mm} type="button" onClick={() => set(hour ?? 20, mm)} className={item(mm === minute)}>
                    {pad(mm)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

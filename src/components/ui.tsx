import { clsx } from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Small shared UI kit. Visual language: warm paper, ink text, rounded cards,
// coral primary. Every control has a visible focus state and ≥44px hit area.

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles = (variant: ButtonVariant, full?: boolean) =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 min-h-11 text-base font-semibold transition-all",
    "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
    full && "w-full",
    {
      primary: "bg-coral text-white hover:bg-coral-deep shadow-card",
      secondary: "bg-cream text-ink hover:bg-sand border border-line",
      ghost: "text-ink-soft hover:bg-cream",
      danger: "bg-no-soft text-no hover:bg-no hover:text-white border border-no/20",
    }[variant]
  );

export function Button({
  variant = "primary",
  full,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; full?: boolean }) {
  return <button className={clsx(buttonStyles(variant, full), className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  full,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; full?: boolean }) {
  return <Link className={clsx(buttonStyles(variant, full), className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("bg-white rounded-card shadow-card border border-line/60 p-5", className)}>{children}</div>;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-faint">{hint}</span>}
      {error && (
        <span role="alert" className="block text-xs text-no font-medium">
          {error}
        </span>
      )}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 min-h-11 text-base text-ink placeholder:text-ink-faint focus:border-coral";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={clsx(inputCls, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={clsx(inputCls, "py-3 min-h-24", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={clsx(inputCls, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "yes" | "maybe" | "no" | "neutral" | "coral";
  children: ReactNode;
}) {
  return (
    <span
      className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", {
        yes: "bg-yes-soft text-yes",
        maybe: "bg-maybe-soft text-maybe",
        no: "bg-no-soft text-no",
        neutral: "bg-cream text-ink-soft",
        coral: "bg-coral-soft text-coral-deep",
      }[tone])}
    >
      {children}
    </span>
  );
}

/** Radio-group styled as large tappable segments (RSVP, share levels…). */
export function SegmentedOption({
  name,
  value,
  checked,
  onChange,
  title,
  subtitle,
  defaultChecked,
}: {
  name: string;
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <label
      className={clsx(
        "flex flex-col gap-0.5 rounded-2xl border-2 px-4 py-3 cursor-pointer transition-colors",
        "has-checked:border-coral has-checked:bg-coral-soft border-line bg-white hover:border-sand"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="font-semibold text-ink">{title}</span>
      {subtitle && <span className="text-xs text-ink-faint">{subtitle}</span>}
    </label>
  );
}

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6 space-y-3">
      <p className="text-4xl" aria-hidden>
        🎈
      </p>
      <p className="text-lg font-bold text-ink">{title}</p>
      {subtitle && <p className="text-sm text-ink-faint">{subtitle}</p>}
      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-ink-faint">
      <span className="size-5 rounded-full border-2 border-line border-t-coral animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "yes" | "maybe" | "no" }) {
  return (
    <div className="bg-white rounded-2xl border border-line/60 shadow-card px-4 py-3 text-center">
      <div
        className={clsx("text-2xl font-extrabold", {
          "text-yes": tone === "yes",
          "text-maybe": tone === "maybe",
          "text-no": tone === "no",
          "text-ink": !tone,
        })}
      >
        {value}
      </div>
      <div className="text-xs text-ink-faint font-medium">{label}</div>
    </div>
  );
}

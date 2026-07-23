import { clsx } from "clsx";
import { t } from "@/lib/i18n/he";

const stages = [
  { key: "invited", color: "bg-sand", label: t.dashboard.funnelInvited },
  { key: "shared", color: "bg-coral-soft", label: t.dashboard.funnelShared },
  { key: "opened", color: "bg-ocean-soft", label: t.dashboard.funnelOpened },
  { key: "responded", color: "bg-yes-soft", label: t.dashboard.funnelResponded },
] as const;

export function GuestFunnel({ invited, shared, opened, responded }: { invited: number; shared: number; opened: number; responded: number }) {
  if (invited === 0) return null;
  const values = { invited, shared, opened, responded };

  return (
    <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-3">
      <div className="flex gap-1 h-5 rounded-full overflow-hidden bg-cream">
        {stages.map(({ key, color }) => {
          const pct = Math.round((values[key] / invited) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={clsx("h-full rounded-full transition-all duration-500", color)}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {stages.map(({ key, color, label }) => (
          <div key={key} className="space-y-0.5">
            <div className={clsx("mx-auto size-3 rounded-full", color)} />
            <p className="text-lg font-bold text-ink tabular-nums">{values[key]}</p>
            <p className="text-xs text-ink-faint">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useTransition } from "react";
import { t } from "@/lib/i18n/he";
import { adminResolveReport } from "@/app/actions/admin";

interface ReportRow {
  id: string;
  targetType: string;
  targetRef: string;
  reason: string;
  details: string | null;
  createdAt: Date;
}

export function ReportsList({ reports }: { reports: ReportRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-3">
      <h2 className="font-bold text-ink">{t.admin.reports}</h2>
      {reports.length === 0 ? (
        <p className="text-sm text-ink-faint">—</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="border-b border-line/60 pb-3 last:border-0 space-y-1">
              <p className="text-sm font-semibold text-ink">
                {r.targetType === "EVENT" ? t.report.targetEVENT : t.report.targetPROFILE} — {r.reason}
              </p>
              <p className="text-xs text-ink-faint break-all">{r.targetRef}</p>
              {r.details && <p className="text-sm text-ink-soft">{r.details}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={pending}
                  className="text-sm font-semibold text-yes"
                  onClick={() => startTransition(() => { void adminResolveReport(r.id, "RESOLVED"); })}
                >
                  {t.admin.resolve}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="text-sm font-semibold text-ink-faint"
                  onClick={() => startTransition(() => { void adminResolveReport(r.id, "DISMISSED"); })}
                >
                  {t.admin.dismiss}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

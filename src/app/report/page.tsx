"use client";

import { useState, useTransition } from "react";
import { t } from "@/lib/i18n/he";
import { submitReport } from "@/app/actions/report";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export default function ReportPage() {
  const [targetType, setTargetType] = useState("EVENT");
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <main className="min-h-dvh grid place-items-center bg-paper px-6">
        <p className="text-lg font-bold text-ink text-center">{t.report.thanks}</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-paper px-5 py-10">
      <form
        className="max-w-md mx-auto bg-white rounded-card border border-line/60 shadow-card p-6 space-y-4 animate-rise"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const res = await submitReport({ targetType, targetRef: ref, reason, details });
            if (!res.ok) setError(res.error);
            else setDone(true);
          });
        }}
      >
        <h1 className="text-xl font-bold text-ink">{t.report.title}</h1>
        <p className="text-sm text-ink-faint">{t.report.subtitle}</p>

        <Field label={t.report.targetLabel}>
          <Select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
            <option value="EVENT">{t.report.targetEVENT}</option>
            <option value="PROFILE">{t.report.targetPROFILE}</option>
          </Select>
        </Field>
        <Field label={t.report.refLabel}>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} required maxLength={200} />
        </Field>
        <Field label={t.report.reasonLabel}>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={100} />
        </Field>
        <Field label={`${t.report.detailsLabel} (${t.common.optional})`}>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-no font-medium">
            {error}
          </p>
        )}

        <Button type="submit" full disabled={pending || !ref.trim() || !reason.trim()}>
          {pending ? t.common.loading : t.report.submit}
        </Button>
      </form>
    </main>
  );
}

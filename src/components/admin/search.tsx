"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/he";
import { adminToggleEvent } from "@/app/actions/admin";
import { Badge, Input } from "@/components/ui";

interface EventRow {
  id: string;
  name: string;
  slug: string;
  disabledAt: Date | null;
  organizer: { email: string };
}

export function AdminSearch({ query, events }: { query: string; events: EventRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-3">
      <Input
        defaultValue={query}
        placeholder={t.admin.searchPlaceholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") router.push(`/admin?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
        }}
      />
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 border-b border-line/60 pb-2 last:border-0">
            <div className="min-w-0">
              <p className="font-semibold text-ink truncate">{e.name || e.slug}</p>
              <p className="text-xs text-ink-faint truncate" dir="ltr">
                {e.organizer.email}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {e.disabledAt && <Badge tone="no">disabled</Badge>}
              <button
                type="button"
                disabled={pending}
                className="text-sm font-semibold text-coral-deep"
                onClick={() => startTransition(() => { void adminToggleEvent(e.id, !e.disabledAt); })}
              >
                {e.disabledAt ? t.admin.enableEvent : t.admin.disableEvent}
              </button>
            </div>
          </li>
        ))}
        {query && events.length === 0 && <li className="text-sm text-ink-faint">—</li>}
      </ul>
    </section>
  );
}

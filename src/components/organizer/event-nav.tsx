"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { t } from "@/lib/i18n/he";
import { Badge } from "@/components/ui";

const statusTone = { DRAFT: "neutral", PUBLISHED: "yes", ENDED: "maybe", ARCHIVED: "neutral" } as const;

export function EventNav({ eventId, eventName, status }: { eventId: string; eventName: string; status: string }) {
  const pathname = usePathname();
  const base = `/app/events/${eventId}`;

  const tabs = [
    { href: base, label: t.dashboard.title },
    { href: `${base}/guests`, label: t.dashboard.guests },
    { href: `${base}/edit`, label: t.common.edit },
    { href: `${base}/preview`, label: t.wizard.previewTitle },
  ];

  return (
    <div className="space-y-3 pb-1">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/app" className="hover:text-ink underline underline-offset-4">
          {t.nav.myEvents}
        </Link>
        <span aria-hidden>›</span>
        <span className="font-semibold text-ink truncate">{eventName}</span>
        <Badge tone={statusTone[status as keyof typeof statusTone] ?? "neutral"}>
          {t.dashboard[`status${status}` as `status${"DRAFT" | "PUBLISHED" | "ENDED" | "ARCHIVED"}`]}
        </Badge>
      </div>
      <nav className="flex gap-1 overflow-x-auto -mx-1 px-1" aria-label="event navigation">
        {tabs.map(({ href, label }) => {
          const active = pathname === href || (href !== base && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors min-h-10",
                active
                  ? "bg-coral text-white"
                  : "text-ink-soft hover:bg-cream"
              )}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

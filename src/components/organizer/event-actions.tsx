"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/he";
import { archiveEvent, deleteEventPermanently, duplicateEvent } from "@/app/actions/organizer";
import { Button, ButtonLink } from "@/components/ui";

export function EventActions({ eventId, eventName, status }: { eventId: string; eventName: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-2">
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/app/events/${eventId}/preview`} variant="secondary">
          {t.dashboard.preview}
        </ButtonLink>
        <a
          href={`/api/events/${eventId}/export`}
          className="inline-flex items-center rounded-2xl px-5 min-h-11 font-semibold bg-cream text-ink border border-line hover:bg-sand"
        >
          {t.dashboard.exportCsv}
        </a>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await duplicateEvent(eventId);
              if (res.ok) router.push(`/app/events/${res.data!.id}/edit`);
            })
          }
        >
          {t.dashboard.duplicate}
        </Button>
        {status !== "ARCHIVED" && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await archiveEvent(eventId);
                router.push("/app");
              })
            }
          >
            {t.dashboard.archive}
          </Button>
        )}
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (!confirm(`${t.dashboard.deleteConfirm}\n\n(${eventName})`)) return;
            startTransition(async () => {
              const res = await deleteEventPermanently(eventId);
              if (res.ok) router.push("/app");
            });
          }}
        >
          {t.dashboard.deleteEvent}
        </Button>
      </div>
    </section>
  );
}

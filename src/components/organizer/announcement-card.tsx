"use client";

import { useState, useTransition } from "react";
import { t } from "@/lib/i18n/he";
import { setAnnouncement } from "@/app/actions/organizer";
import { waShareUrl } from "@/lib/format";
import { tryWebShare } from "@/lib/share-client";
import { Button, Textarea } from "@/components/ui";
import { Megaphone, X, Share2 } from "lucide-react";

// Single prominent update (no feed). Sharing opens WhatsApp with a prepared
// message — the organizer sends it themselves.

export function AnnouncementCard({
  eventId,
  initial,
  eventName,
  generalLink,
}: {
  eventId: string;
  initial: string;
  eventName: string;
  generalLink: string;
}) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (value: string) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await setAnnouncement(eventId, { text: value });
      if (!res.ok) setError(res.error);
      else setSaved(true);
    });
  };

  return (
    <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-3">
      <h2 className="font-bold text-ink">{t.dashboard.announcementTitle}</h2>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.dashboard.announcementPlaceholder} maxLength={300} />
      {error && (
        <p role="alert" className="text-sm text-no font-medium">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-yes font-medium">
          {t.common.saved} ✓
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => save(text)} disabled={pending || !text.trim()}>
          <Megaphone className="size-4" /> {t.dashboard.announcementPublish}
        </Button>
        {initial && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setText("");
              save("");
            }}
          >
            <X className="size-4" /> {t.dashboard.announcementRemove}
          </Button>
        )}
        {text.trim() && (
          <a
            href={waShareUrl(t.share.updateTemplate(eventName, text.trim(), generalLink))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl px-5 min-h-11 font-semibold bg-cream text-ink border border-line hover:bg-sand"
            onClick={(e) => tryWebShare(e, t.share.updateTemplate(eventName, text.trim(), generalLink))}
          >
            <Share2 className="size-4" /> {t.dashboard.announcementShare}
          </a>
        )}
      </div>
    </section>
  );
}

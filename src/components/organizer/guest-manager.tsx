"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { t } from "@/lib/i18n/he";
import { waShareUrl, formatShortDate } from "@/lib/format";
import {
  addGuest,
  addGuestsFromPaste,
  deleteGuest,
  markShareOpened,
  regenerateGuestLink,
  saveGeneralLinkSettings,
  setManualRsvp,
  updateGuest,
} from "@/app/actions/organizer";
import { parseGuestLines } from "@/lib/services/guest-parse";
import { tryWebShare } from "@/lib/share-client";
import { Badge, Button, EmptyState, Field, Input, Textarea } from "@/components/ui";
import { Dropdown, NumberStepper } from "@/components/controls";
import { ClipboardPaste, Send, Link2, RefreshCw, Trash2 } from "lucide-react";

export interface GuestRow {
  id: string;
  name: string;
  phone: string;
  maxParty: number;
  link: string;
  viaGeneralLink: boolean;
  shareOpened: boolean;
  linkOpened: boolean;
  status: string | null;
  partySize: number | null;
  message: string | null;
  respondedAt: string | null;
}

const STATUS_TONE = { YES: "yes", MAYBE: "maybe", NO: "no" } as const;

export function GuestManager({
  eventId,
  eventName,
  guests,
  generalLink,
  generalLinkEnabled,
  generalLinkMaxParty,
}: {
  eventId: string;
  eventName: string;
  guests: GuestRow[];
  generalLink: string;
  generalLinkEnabled: boolean;
  generalLinkMaxParty: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [singleOpen, setSingleOpen] = useState(false);
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [genMax, setGenMax] = useState(generalLinkMaxParty);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => parseGuestLines(pasteText), [pasteText]);

  const filtered = guests.filter((g) => {
    if (filter !== "ALL" && (g.status ?? "PENDING") !== filter) return false;
    if (query && !g.name.includes(query) && !g.phone.includes(query)) return false;
    return true;
  });

  const pendingList = guests.filter((g) => !g.status);

  return (
    <div className="space-y-5">
      {/* quick add */}
      <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-3">
        {!pasteOpen && !singleOpen ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setPasteOpen(true)}>
              <ClipboardPaste className="size-4" /> {t.wizard.pasteParse}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSingleOpen(true)}>
              + {t.wizard.addSingle}
            </Button>
          </div>
        ) : pasteOpen ? (
          <div className="space-y-3">
            <Field label={t.wizard.pasteTitle} hint={t.wizard.pasteHint}>
              <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={t.wizard.pastePlaceholder} rows={5} />
            </Field>
            {preview.length > 0 && (
              <ul className="text-sm text-ink-soft flex flex-wrap gap-1.5">
                {preview.map((p, i) => (
                  <li key={i} className="bg-cream rounded-full px-3 py-1">
                    {p.name} {p.maxParty > 1 && <span className="text-ink-faint">·{p.maxParty}</span>}
                  </li>
                ))}
              </ul>
            )}
            {pasteError && (
              <p role="alert" className="text-sm font-medium bg-no-soft text-no rounded-xl px-3 py-2">
                {pasteError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={pending || preview.length === 0}
                onClick={() =>
                  startTransition(async () => {
                    setPasteError(null);
                    const res = await addGuestsFromPaste(eventId, { text: pasteText });
                    if (!res.ok) {
                      setPasteError(res.error);
                      return;
                    }
                    setPasteText("");
                    setPasteOpen(false);
                    router.refresh();
                  })
                }
              >
                {t.common.save} ({preview.length})
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setPasteError(null); setPasteOpen(false); }}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <SingleGuestForm eventId={eventId} onDone={() => setSingleOpen(false)} onCancel={() => setSingleOpen(false)} />
        )}
      </section>

      {/* general link */}
      {generalLinkEnabled && (
        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-3">
          <h2 className="font-bold text-ink">{t.wizard.generalLinkTitle}</h2>
          <p className="text-sm text-ink-faint">{t.wizard.generalLinkHint}</p>
          <div className="flex gap-2">
            <Input readOnly value={generalLink} dir="ltr" className="text-sm" />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(generalLink);
                setCopiedGeneral(true);
                setTimeout(() => setCopiedGeneral(false), 1500);
              }}
            >
              {copiedGeneral ? t.common.copied : t.common.copy}
            </Button>
          </div>
          <Field label={t.wizard.generalLinkMaxParty}>
            <NumberStepper
              value={genMax}
              min={1}
              max={10}
              aria-label={t.wizard.generalLinkMaxParty}
              onChange={(v) => {
                setGenMax(v);
                startTransition(async () => {
                  await saveGeneralLinkSettings(eventId, { generalLinkMaxParty: v });
                  router.refresh();
                });
              }}
            />
          </Field>
        </section>
      )}

      {/* reminders */}
      {pendingList.length > 0 && (
        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-2">
          <h2 className="font-bold text-ink">{t.dashboard.remindersTitle}</h2>
          <ul className="space-y-2">
            {pendingList.slice(0, 5).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{g.name}</span>
                <a
                  href={waShareUrl(t.share.reminderTemplate(g.name, eventName, g.link))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-coral-deep underline underline-offset-4"
                  onClick={(e) => {
                    tryWebShare(e, t.share.reminderTemplate(g.name, eventName, g.link));
                    startTransition(() => {
                      void markShareOpened(g.id);
                    });
                  }}
                >
                  {t.dashboard.sendReminder}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* guest list */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.dashboard.searchGuests} className="max-w-56" />
          <Dropdown
            value={filter}
            onChange={setFilter}
            aria-label={t.dashboard.filterAll}
            className="w-40"
            options={[
              { value: "ALL", label: t.dashboard.filterAll },
              { value: "YES", label: t.dashboard.yes },
              { value: "MAYBE", label: t.dashboard.maybe },
              { value: "NO", label: t.dashboard.no },
              { value: "PENDING", label: t.dashboard.guestStatusPENDING },
            ]}
          />
        </div>

        <ul className="space-y-2">
          {filtered.map((g) => (
            <GuestCard key={g.id} guest={g} eventName={eventName} />
          ))}
          {filtered.length === 0 && (
            <li>
              {guests.length === 0 ? (
                <EmptyState title={t.dashboard.noGuests} subtitle={t.dashboard.noGuestsOnboarding} />
              ) : (
                <p className="text-center text-sm text-ink-faint py-8">{t.dashboard.noResults}</p>
              )}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function GuestCard({ guest, eventName }: { guest: GuestRow; eventName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <li className="bg-white rounded-2xl border border-line/60 shadow-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-ink truncate">
            {guest.name}
            {guest.maxParty > 1 && <span className="text-xs font-medium text-ink-faint"> · {t.dashboard.partyOf} {guest.maxParty}</span>}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {[
              { done: true, label: t.dashboard.funnelInvited },
              { done: guest.shareOpened, label: t.dashboard.funnelShared },
              { done: guest.linkOpened, label: t.dashboard.funnelOpened },
              { done: Boolean(guest.status), label: t.dashboard.funnelResponded },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <div className={clsx("w-3 h-0.5 rounded-full", step.done ? "bg-coral" : "bg-sand")} />}
                <div
                  className={clsx("size-2.5 rounded-full", step.done ? "bg-coral" : "bg-sand")}
                  title={step.label}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-end">
            {guest.status ? (
              <Badge tone={STATUS_TONE[guest.status as keyof typeof STATUS_TONE]}>
                {guest.status === "YES" ? t.dashboard.yes : guest.status === "MAYBE" ? t.dashboard.maybe : t.dashboard.no}
                {guest.status === "YES" && guest.partySize && guest.partySize > 1 ? ` ×${guest.partySize}` : ""}
              </Badge>
            ) : (
              <Badge>{t.dashboard.guestStatusPENDING}</Badge>
            )}
            {guest.respondedAt && (
              <span className="block text-[0.65rem] text-ink-faint mt-0.5">{formatShortDate(new Date(guest.respondedAt))}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-ink-faint hover:text-ink text-sm font-bold px-2 min-h-11"
          >
            {open ? "︿" : "﹀"}
          </button>
        </div>
      </div>

      {guest.message && <p className="text-sm text-ink-soft bg-cream rounded-xl px-3 py-2">“{guest.message}”</p>}

      {open && (
        <div className="pt-2 border-t border-line space-y-3">
          <div className="flex flex-wrap gap-2">
            <a
              href={waShareUrl(t.share.messageTemplate(guest.name, eventName, guest.link))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 min-h-10 text-sm font-semibold bg-yes-soft text-yes"
              onClick={(e) => {
                tryWebShare(e, t.share.messageTemplate(guest.name, eventName, guest.link));
                startTransition(() => {
                  void markShareOpened(guest.id);
                });
              }}
            >
              <Send className="size-4" /> {t.dashboard.sendInvite}
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 min-h-10 text-sm font-semibold bg-cream text-ink"
              onClick={() => {
                navigator.clipboard.writeText(guest.link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Link2 className="size-4" /> {copied ? t.common.copied : t.dashboard.copyPersonalLink}
            </button>
            <button
              type="button"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 min-h-10 text-sm font-semibold bg-cream text-ink"
              onClick={() => {
                if (confirm(t.dashboard.regenerateLink)) startTransition(async () => { await regenerateGuestLink(guest.id); router.refresh(); });
              }}
            >
              <RefreshCw className="size-4" /> {t.dashboard.regenerateLink}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <EditGuestForm guest={guest} />
            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-ink">{t.dashboard.manualRsvp}</span>
              <div className="flex gap-1.5">
                {(["YES", "MAYBE", "NO"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => { await setManualRsvp(guest.id, s, guest.partySize ?? 1); router.refresh(); })}
                    className={clsx(
                      "flex-1 rounded-lg py-1.5 text-xs font-bold",
                      guest.status === s ? "bg-coral text-white" : "bg-cream text-ink-soft"
                    )}
                  >
                    {s === "YES" ? t.dashboard.yes : s === "MAYBE" ? t.dashboard.maybe : t.dashboard.no}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-no"
            onClick={() => {
              if (confirm(t.dashboard.deleteGuestConfirm)) startTransition(async () => { await deleteGuest(guest.id); router.refresh(); });
            }}
          >
            <Trash2 className="size-4" /> {t.common.delete}
          </button>
        </div>
      )}
    </li>
  );
}

function EditGuestForm({ guest }: { guest: GuestRow }) {
  const router = useRouter();
  const [name, setName] = useState(guest.name);
  const [phone, setPhone] = useState(guest.phone);
  const [maxParty, setMaxParty] = useState(guest.maxParty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-semibold text-ink">{t.common.edit}</span>
      <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="text-sm" />
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" dir="ltr" className="text-sm" maxLength={20} />
      <div className="flex items-center gap-2">
        <NumberStepper value={maxParty} min={1} max={10} onChange={setMaxParty} aria-label={t.dashboard.partyOf} />
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await updateGuest(guest.id, { name, phone, maxParty });
              if (!res.ok) setError(res.error);
              else router.refresh();
            })
          }
        >
          {t.common.save}
        </Button>
      </div>
      {error && <span role="alert" className="block text-xs text-no font-medium">{error}</span>}
    </div>
  );
}

function SingleGuestForm({ eventId, onDone, onCancel }: { eventId: string; onDone: () => void; onCancel: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [maxParty, setMaxParty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Field label={t.wizard.nameLabel}>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus />
      </Field>
      <Field label={`${t.common.optional}: טלפון`}>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="050-1234567" maxLength={20} />
      </Field>
      <Field label={t.dashboard.partyOf}>
        <NumberStepper value={maxParty} min={1} max={10} onChange={setMaxParty} aria-label={t.dashboard.partyOf} />
      </Field>
      {error && (
        <p role="alert" className="text-sm font-medium bg-no-soft text-no rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending || !name.trim()}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await addGuest(eventId, { name, phone, maxParty });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              router.refresh();
              onDone();
            })
          }
        >
          {t.common.save}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.common.cancel}
        </Button>
      </div>
    </div>
  );
}

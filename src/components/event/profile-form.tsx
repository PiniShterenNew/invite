"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/he";
import { saveProfile, deleteProfile } from "@/app/actions/guest";
import { Button, Field, Input, SegmentedOption } from "@/components/ui";

interface Initial {
  shareLevel: string;
  bio: string;
  instagram: string;
  photoUrl: string | null;
}

export function ProfileForm({ token, initial }: { token: string; initial: Initial | null }) {
  const router = useRouter();
  const [level, setLevel] = useState(initial?.shareLevel ?? "MINIMAL");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="bg-white rounded-card shadow-card border border-line/60 p-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const res = await saveProfile(token, fd);
          if (!res.ok) setError(res.error);
          else {
            setSaved(true);
            router.refresh();
          }
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink pb-1">{t.profile.shareLevelLabel}</legend>
        {(["MINIMAL", "SOCIAL", "OPEN"] as const).map((v) => (
          <SegmentedOption
            key={v}
            name="shareLevel"
            value={v}
            checked={level === v}
            onChange={() => setLevel(v)}
            title={t.profile[`level${v}`]}
          />
        ))}
      </fieldset>

      {level !== "MINIMAL" && (
        <>
          <Field label={t.profile.photoLabel} hint={t.wizard.coverHint}>
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-ink-soft file:me-3 file:rounded-xl file:border-0 file:bg-cream file:px-4 file:py-2.5 file:font-semibold file:text-ink"
            />
          </Field>
          {initial?.photoUrl && <img src={initial.photoUrl} alt="" className="size-16 rounded-full object-cover" />}
          <Field label={t.profile.bioLabel}>
            <Input name="bio" defaultValue={initial?.bio} placeholder={t.profile.bioPlaceholder} maxLength={120} />
          </Field>
        </>
      )}

      {level === "OPEN" && (
        <Field label={t.profile.instagramLabel} hint={t.profile.instagramPlaceholder}>
          <Input name="instagram" defaultValue={initial?.instagram} dir="ltr" placeholder="dana.levi" maxLength={30} />
        </Field>
      )}

      {error && (
        <p role="alert" className="text-sm text-center font-medium bg-no-soft text-no rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-center font-medium bg-yes-soft text-yes rounded-xl px-3 py-2">
          {t.common.saved} ✓
        </p>
      )}

      <Button type="submit" full disabled={pending}>
        {pending ? t.common.loading : t.common.save}
      </Button>

      {initial && (
        <Button
          type="button"
          variant="danger"
          full
          disabled={pending}
          onClick={() => {
            if (!confirm(t.profile.deleteConfirm)) return;
            startTransition(async () => {
              const res = await deleteProfile(token);
              if (!res.ok) setError(res.error);
              else router.push(`/i/${token}`);
            });
          }}
        >
          {t.profile.deleteProfile}
        </Button>
      )}
    </form>
  );
}

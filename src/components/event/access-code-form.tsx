"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/he";
import { submitAccessCode } from "@/app/actions/guest";
import { Button, Input } from "@/components/ui";

export function AccessCodeForm({ slug, eventName }: { slug: string; eventName: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="min-h-dvh grid place-items-center bg-paper px-6">
      <form
        className="w-full max-w-sm bg-white rounded-card shadow-card border border-line/60 p-6 space-y-4 animate-rise"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const res = await submitAccessCode(slug, { code });
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
      >
        <p className="text-3xl text-center" aria-hidden>
          🔒
        </p>
        <h1 className="text-xl font-bold text-center text-ink">{eventName}</h1>
        <p className="text-sm text-center text-ink-faint">{t.invite.codePrompt}</p>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">{t.invite.codeLabel}</span>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            required
            maxLength={20}
            autoComplete="off"
            className="text-center tracking-widest text-lg"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-center font-medium bg-no-soft text-no rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        <Button type="submit" full disabled={pending || !code.trim()}>
          {pending ? t.common.loading : t.invite.codeSubmit}
        </Button>
      </form>
    </main>
  );
}

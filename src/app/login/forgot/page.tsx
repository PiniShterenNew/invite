"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import { t } from "@/lib/i18n/he";
import { Button, Input } from "@/components/ui";
import { ArrowRight, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  if (state?.sent) {
    return (
      <main className="min-h-dvh grid place-items-center bg-paper px-6">
        <div className="w-full max-w-sm text-center space-y-4 animate-rise">
          <MailCheck className="size-12 text-coral mx-auto" />
          <h1 className="text-xl font-bold text-ink">{t.auth.forgotTitle}</h1>
          <p className="text-sm text-ink-soft">{t.auth.resetSent}</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral-deep hover:underline">
            <ArrowRight className="size-4" />
            {t.auth.backToLogin}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-paper px-6">
      <div className="w-full max-w-sm space-y-6 animate-rise">
        <div className="text-center space-y-1">
          <Link href="/" className="text-3xl font-extrabold text-ink">
            {t.common.appName}
          </Link>
          <h1 className="text-xl font-bold text-ink pt-3">{t.auth.forgotTitle}</h1>
          <p className="text-sm text-ink-faint">{t.auth.forgotSubtitle}</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-line/60 p-6">
          <form className="space-y-4" action={action}>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">{t.auth.emailLabel}</span>
              <Input type="email" name="email" required placeholder={t.auth.emailPlaceholder} dir="ltr" autoComplete="email" />
            </label>
            {state?.error && <p role="alert" className="text-sm text-no font-medium">{state.error}</p>}
            <Button type="submit" full disabled={pending}>
              {pending ? t.common.loading : t.auth.sendReset}
            </Button>
          </form>
          <p className="text-center text-sm text-ink-faint mt-4">
            <Link href="/login" className="font-semibold text-coral-deep hover:underline">
              {t.auth.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

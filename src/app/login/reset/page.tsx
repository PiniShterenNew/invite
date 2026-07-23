"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { resetPassword } from "@/app/actions/auth";
import { t } from "@/lib/i18n/he";
import { Button, Input } from "@/components/ui";
import { ArrowRight, CheckCircle2 } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(resetPassword, null);

  if (state?.done) {
    return (
      <main className="min-h-dvh grid place-items-center bg-paper px-6">
        <div className="w-full max-w-sm text-center space-y-4 animate-rise">
          <CheckCircle2 className="size-12 text-yes mx-auto" />
          <h1 className="text-xl font-bold text-ink">{t.auth.resetTitle}</h1>
          <p className="text-sm text-ink-soft">{t.auth.resetDone}</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral-deep hover:underline">
            <ArrowRight className="size-4" />
            {t.auth.backToLogin}
          </Link>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-dvh grid place-items-center bg-paper px-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-xl font-bold text-ink">{t.auth.resetExpired}</h1>
          <Link href="/login/forgot" className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral-deep hover:underline">
            <ArrowRight className="size-4" />
            {t.auth.forgotPassword}
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
          <h1 className="text-xl font-bold text-ink pt-3">{t.auth.resetTitle}</h1>
          <p className="text-sm text-ink-faint">{t.auth.resetSubtitle}</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-line/60 p-6">
          <form className="space-y-4" action={action}>
            <input type="hidden" name="token" value={token} />
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">{t.auth.newPassword}</span>
              <Input type="password" name="password" required minLength={8} maxLength={72} placeholder={t.auth.passwordPlaceholder} dir="ltr" autoComplete="new-password" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">{t.auth.confirmPassword}</span>
              <Input type="password" name="confirmPassword" required minLength={8} maxLength={72} placeholder={t.auth.passwordPlaceholder} dir="ltr" autoComplete="new-password" />
            </label>
            {state?.error && <p role="alert" className="text-sm text-no font-medium">{state.error}</p>}
            <Button type="submit" full disabled={pending}>
              {pending ? t.common.loading : t.auth.resetSubmit}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

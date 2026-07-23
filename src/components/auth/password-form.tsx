"use client";

import { useActionState, useState } from "react";
import { t } from "@/lib/i18n/he";
import { registerUser, loginWithPassword } from "@/app/actions/auth";
import { Button, Input } from "@/components/ui";

export function PasswordForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction, loginPending] = useActionState(loginWithPassword, null);
  const [registerState, registerAction, registerPending] = useActionState(registerUser, null);

  const pending = loginPending || registerPending;
  const error = mode === "login" ? loginState?.error : registerState?.error;

  return (
    <div className="space-y-3">
      <form className="space-y-3" action={mode === "login" ? loginAction : registerAction}>
        {mode === "register" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink">{t.auth.nameLabel}</span>
            <Input type="text" name="name" placeholder={t.auth.nameLabel} autoComplete="name" />
          </label>
        )}
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">{t.auth.emailLabel}</span>
          <Input type="email" name="email" required placeholder={t.auth.emailPlaceholder} dir="ltr" autoComplete="email" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">{t.auth.passwordLabel}</span>
          <Input type="password" name="password" required minLength={8} maxLength={72} placeholder={t.auth.passwordPlaceholder} dir="ltr" autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </label>
        {error && <p role="alert" className="text-sm text-no font-medium">{error}</p>}
        <Button type="submit" full disabled={pending}>
          {pending ? t.common.loading : mode === "login" ? t.auth.loginCta : t.auth.registerCta}
        </Button>
      </form>
      <p className="text-center text-sm text-ink-faint">
        {mode === "login" ? t.auth.noAccount : t.auth.hasAccount}{" "}
        <button type="button" className="font-semibold text-coral-deep underline underline-offset-2" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? t.auth.registerCta : t.auth.loginCta}
        </button>
      </p>
    </div>
  );
}

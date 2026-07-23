import { redirect } from "next/navigation";
import Link from "next/link";
import { signIn, hasEmailAuth, hasGoogleAuth } from "@/lib/auth";
import { currentUser } from "@/lib/authz";
import { emailSchema } from "@/lib/validation/schemas";
import { t } from "@/lib/i18n/he";
import { Button, Input } from "@/components/ui";
import { PasswordForm } from "@/components/auth/password-form";

export const metadata = { title: t.nav.login };

export default async function LoginPage() {
  if (await currentUser()) redirect("/app");
  const devMode = process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY;

  return (
    <main className="min-h-dvh grid place-items-center bg-paper px-6">
      <div className="w-full max-w-sm space-y-6 animate-rise">
        <div className="text-center space-y-1">
          <Link href="/" className="text-3xl font-extrabold text-ink">
            {t.common.appName}
          </Link>
          <h1 className="text-xl font-bold text-ink pt-3">{t.auth.title}</h1>
          <p className="text-sm text-ink-faint">{t.auth.subtitle}</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-line/60 p-6 space-y-4">
          {hasGoogleAuth && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/app" });
              }}
            >
              <Button type="submit" variant="secondary" full>
                {t.auth.google}
              </Button>
            </form>
          )}

          {hasGoogleAuth && <div className="flex items-center gap-3"><div className="flex-1 border-t border-line" /><span className="text-xs text-ink-faint font-semibold">{t.auth.or}</span><div className="flex-1 border-t border-line" /></div>}

          <PasswordForm />

          {hasEmailAuth && (
            <>
              <div className="flex items-center gap-3"><div className="flex-1 border-t border-line" /><span className="text-xs text-ink-faint font-semibold">{t.auth.or}</span><div className="flex-1 border-t border-line" /></div>
              <form
                className="space-y-3"
                action={async (formData: FormData) => {
                  "use server";
                  const email = emailSchema.safeParse(formData.get("email"));
                  if (!email.success) redirect("/login?error=email");
                  await signIn("resend", { email: email.data, redirectTo: "/app" });
                }}
              >
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-ink">{t.auth.sendLink}</span>
                  <Input type="email" name="email" required placeholder={t.auth.emailPlaceholder} dir="ltr" autoComplete="email" />
                </label>
                <Button type="submit" variant="secondary" full>
                  {t.auth.sendLink}
                </Button>
              </form>
            </>
          )}

          {!hasGoogleAuth && !hasEmailAuth && (
            <p className="text-sm text-center text-ink-faint">יש להשלים את הגדרת ההתחברות עם Google.</p>
          )}

          {devMode && <p className="text-xs text-center text-ink-faint">{t.auth.devHint}</p>}
        </div>
      </div>
    </main>
  );
}

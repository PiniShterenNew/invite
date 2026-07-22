import Link from "next/link";
import { t } from "@/lib/i18n/he";

export const metadata = { title: t.auth.checkEmail };

export default function LinkSentPage() {
  return (
    <main className="min-h-dvh grid place-items-center bg-paper px-6">
      <div className="max-w-sm text-center space-y-3 animate-rise">
        <p className="text-5xl" aria-hidden>
          📬
        </p>
        <h1 className="text-2xl font-bold text-ink">{t.auth.checkEmail}</h1>
        <p className="text-ink-faint">{t.auth.linkSent}</p>
        {process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY && (
          <p className="text-xs text-ink-faint">{t.auth.devHint}</p>
        )}
        <Link href="/" className="inline-block text-sm font-semibold text-coral-deep underline underline-offset-4 pt-2">
          {t.common.back}
        </Link>
      </div>
    </main>
  );
}

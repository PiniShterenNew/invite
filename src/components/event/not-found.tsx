import Link from "next/link";
import { t } from "@/lib/i18n/he";

export function NotFoundCard({ title, text }: { title: string; text?: string }) {
  return (
    <main className="min-h-dvh grid place-items-center bg-paper px-6">
      <div className="max-w-sm text-center space-y-3 animate-rise">
        <p className="text-5xl" aria-hidden>
          🫥
        </p>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {text && <p className="text-ink-faint">{text}</p>}
        <Link href="/" className="inline-block text-sm font-semibold text-coral-deep underline underline-offset-4 pt-2">
          {t.common.appName}
        </Link>
      </div>
    </main>
  );
}

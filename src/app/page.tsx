import Link from "next/link";
import { t } from "@/lib/i18n/he";
import { ButtonLink } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col bg-paper">
      <header className="max-w-2xl mx-auto w-full px-5 py-5 flex items-center justify-between">
        <span className="text-xl font-extrabold text-ink">{t.common.appName}</span>
        <Link href="/login" className="text-sm font-semibold text-ink-soft hover:text-ink min-h-11 flex items-center">
          {t.nav.login}
        </Link>
      </header>

      <main className="flex-1">
        <section className="max-w-2xl mx-auto px-5 pt-8 pb-14 text-center animate-rise">
          <p className="text-5xl mb-4" aria-hidden>
            🎉
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight">{t.home.heroTitle}</h1>
          <p className="text-lg text-ink-soft mt-4 max-w-md mx-auto">{t.home.heroSubtitle}</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <ButtonLink href="/login" className="text-lg px-8">
              {t.home.cta}
            </ButtonLink>
            <span className="text-xs font-semibold text-coral-deep bg-coral-soft rounded-full px-3 py-1">{t.home.freeNote}</span>
          </div>
        </section>

        <section className="max-w-2xl mx-auto px-5 pb-16 grid sm:grid-cols-3 gap-4">
          {[
            [t.home.step1Title, t.home.step1Text, "✏️"],
            [t.home.step2Title, t.home.step2Text, "💬"],
            [t.home.step3Title, t.home.step3Text, "✅"],
          ].map(([title, text, emoji]) => (
            <div key={title} className="bg-white rounded-card border border-line/60 shadow-card p-5 text-center">
              <p className="text-2xl mb-2" aria-hidden>
                {emoji}
              </p>
              <p className="font-bold text-ink">{title}</p>
              <p className="text-sm text-ink-faint mt-1">{text}</p>
            </div>
          ))}
        </section>

        <section className="max-w-2xl mx-auto px-5 pb-20 text-center">
          <p className="text-sm text-ink-faint">🔒 {t.home.privacyNote}</p>
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <div className="max-w-2xl mx-auto px-5 flex flex-wrap justify-center gap-4 text-sm text-ink-faint font-medium">
          <Link href="/privacy" className="hover:text-ink">
            {t.footer.privacy}
          </Link>
          <Link href="/terms" className="hover:text-ink">
            {t.footer.terms}
          </Link>
          <Link href="/report" className="hover:text-ink">
            {t.footer.report}
          </Link>
        </div>
      </footer>
    </div>
  );
}

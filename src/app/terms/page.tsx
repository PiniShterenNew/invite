import { t } from "@/lib/i18n/he";

export const metadata = { title: t.legal.termsTitle };

// NOTE (legal): draft terms for MVP; requires human legal review before
// public launch, especially around the "free during launch" framing and
// content-moderation liability.

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-paper px-5 py-10">
      <article className="max-w-2xl mx-auto prose-sm space-y-6 text-ink-soft leading-relaxed">
        <h1 className="text-2xl font-extrabold text-ink">{t.legal.termsTitle}</h1>
        <p>עדכון אחרון: 20 ביולי 2026. מסמך זה טיוטה ל־MVP וטרם עבר בדיקה משפטית מלאה.</p>

        <section>
          <h2 className="font-bold text-ink text-lg">השירות</h2>
          <p>{t.common.appName} מספק כלי ליצירת הזמנות דיגיטליות לאירועים חברתיים פרטיים וניהול אישורי הגעה. השירות ניתן חינם בתקופת ההשקה; ייתכן שינוי עתידי במודל, ללא פגיעה במידע קיים ללא הודעה.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">אחריות המשתמש</h2>
          <ul className="list-disc pr-5 space-y-1">
            <li>המארגן אחראי לנכונות פרטי האירוע ולתוכן שהוא מפרסם.</li>
            <li>אסור לפרסם תוכן פוגעני, מטעה או בלתי חוקי. אנו רשאים להשבית אירוע או פרופיל שמפר זאת.</li>
            <li>המארגן אחראי לקבל הסכמה מתאימה לשימוש בפרטי אורחים שהוא מזין (למשל שמות).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">הגבלת אחריות</h2>
          <p>השירות ניתן כמות שהוא (as-is). איננו אחראים לאי-הגעת הודעות WhatsApp, שכן השליחה מתבצעת ידנית על ידי המארגן.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">דיווח על תוכן</h2>
          <p>ניתן לדווח על אירוע או פרופיל פוגעני בעמוד <a href="/report" className="underline underline-offset-4 font-semibold text-ink">דיווח על תוכן</a>.</p>
        </section>
      </article>
    </main>
  );
}

import { t } from "@/lib/i18n/he";
import {
  ANONYMIZE_DAYS_AFTER_END,
  GUEST_LIST_VISIBLE_DAYS_AFTER_END,
} from "@/lib/constants";

export const metadata = { title: t.legal.privacyTitle };

// NOTE (legal): drafted to reflect the product's actual data handling. This
// is not a substitute for review by an Israeli privacy-law professional
// before public launch — see docs/privacy-and-security.md "requires human
// legal review" section for the specific open questions (e.g. Privacy
// Protection Law Amendment 13 database-registration duties, cross-border
// transfer if a non-Israeli email/hosting provider is used).

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-paper px-5 py-10">
      <article className="max-w-2xl mx-auto prose-sm space-y-6 text-ink-soft leading-relaxed">
        <h1 className="text-2xl font-extrabold text-ink">{t.legal.privacyTitle}</h1>
        <p>עדכון אחרון: 20 ביולי 2026. מסמך זה טיוטה ל־MVP וטרם עבר בדיקה משפטית מלאה.</p>

        <section>
          <h2 className="font-bold text-ink text-lg">איזה מידע נאסף</h2>
          <ul className="list-disc pr-5 space-y-1">
            <li>מארגנים: שם, מייל, תמונת פרופיל (מספק ההתחברות).</li>
            <li>אורחים: שם, ובאופן אופציונלי טלפון, תשובת RSVP, הודעה חופשית, תשובות לשאלות מותאמות, ופרופיל (תמונה, משפט, אינסטגרם) — הכל לפי בחירתם.</li>
            <li>אנחנו לא אוספים מיקום GPS, לא ניגשים לאנשי קשר, ולא דורשים מספר טלפון.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">איך המידע משמש</h2>
          <p>אך ורק כדי להפעיל את האירוע: הצגת עמוד ההזמנה, ניהול אישורי הגעה, התראות למארגן, ורשימת משתתפים — כאשר המארגן הפעיל אותה ורק למי שאישר הגעה.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">שיתוף עם צדדים שלישיים</h2>
          <p>המידע אינו נמכר או משותף לפרסום. ספקי תשתית: אחסון מסד נתונים, שליחת מייל (Resend), ואחסון תמונות. WhatsApp אינו מקבל מידע מהמערכת — השיתוף נעשה ידנית על ידי המארגן דרך המכשיר שלו.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">שמירה ומחיקה</h2>
          <ul className="list-disc pr-5 space-y-1">
            <li>עמוד רשימת המשתתפים נסגר {GUEST_LIST_VISIBLE_DAYS_AFTER_END} ימים אחרי סיום האירוע.</li>
            <li>שמות אורחים, טלפונים, הודעות ופרופילים עוברים אנונימיזציה אוטומטית {ANONYMIZE_DAYS_AFTER_END} יום אחרי סיום האירוע.</li>
            <li>המארגן יכול לייצא גיבוי CSV או למחוק אירוע ומידע מוקדם יותר, בכל עת.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">זכויותיכם</h2>
          <p>ניתן לבקש מחיקת מידע אישי בכל עת בפנייה למארגן האירוע הרלוונטי, או ישירות אלינו.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink text-lg">אבטחה</h2>
          <p>קישורים אישיים אינם ניתנים לניחוש, כל הפעולות הרגישות מאומתות בצד השרת, וסיסמאות/קודי כניסה מאוחסנים מוצפנים.</p>
        </section>
      </article>
    </main>
  );
}

# ארכיטקטורה טכנית — "באים?"

## Stack (נבדק מול גרסאות יציבות נוכחיות, יולי 2026)
- **Next.js 16 (App Router) + React 19 + TypeScript strict** — רכיבי שרת כברירת מחדל, Server Actions לכתיבות.
- **Tailwind CSS 4** — עם design tokens ב־CSS variables (ראה design-system.md), `dir="rtl"` גלובלי.
- **Prisma ORM** — SQLite בפיתוח/בדיקות, PostgreSQL בפרודקשן (ADR-001).
- **Auth.js v5 (next-auth beta)** — Google OAuth + Email Magic Link, Prisma Adapter (ADR-002). מארגנים בלבד; אורחים מזוהים ב־invitation token.
- **Zod** — סכמות ולידציה משותפות client/server (ADR-005).
- **Resend** — שליחת מיילים (magic link, התראות, סיכומים). בפיתוח ללא credentials: מיילים נכתבים ללוג + לתיקיית `.dev-mailbox/`.
- **sharp** — עיבוד תמונות שהועלו: resize, re-encode ל־WebP (מסיר EXIF/metadata), הגבלת גודל.
- **nanoid** — tokens ציבוריים (ADR-003).
- **Vitest** — בדיקות יחידה ואינטגרציה (נגד SQLite in-memory). **Playwright** — E2E (מוגדר; הרצה דורשת `npx playwright install`).
- **פריסה: Vercel** + Postgres מנוהל (Supabase/Neon). Cron של Vercel מפעיל את jobs מחזור-החיים.

## מבנה הקוד
```
src/
  app/                  # ראוטים (App Router)
    (marketing)/        # עמוד בית, מדיניות, תנאים, דיווח
    (auth)/login        # התחברות
    app/                # אזור המארגן (מוגן)
      events/[id]/...   # דשבורד, עריכה, מוזמנים, הגדרות
    e/[slug]/           # עמוד אירוע ציבורי (קישור כללי)
    i/[token]/          # הזמנה אישית + RSVP
    admin/              # Admin מינימלי (תפקיד admin)
    api/                # route handlers: uploads, ics, cron, report
  lib/
    db.ts               # Prisma client
    auth.ts             # Auth.js config
    authz.ts            # בדיקות בעלות/הרשאה — כל גישה עוברת כאן
    tokens.ts           # יצירת tokens
    validation/         # סכמות Zod משותפות
    services/           # לוגיקה עסקית (rsvp, guests, lifecycle, notify)
    email/              # שליחה + תבניות + dev fallback
    storage.ts          # אבסטרקציית קבצים (disk בפיתוח, S3-compatible בפרוד)
    i18n/he.ts          # כל המחרוזות (אין מחרוזות בקומפוננטות)
  components/           # UI
```

## עקרונות אבטחת גישה
1. **אין endpoint כתיבה בלי סשן מארגן או invitation token תקף.** כל server action מתחיל ב־`requireOrganizer(eventId)` או `resolveInvitation(token)`.
2. **כל query מסונן לפי בעלות** — לעולם לא `findUnique(id)` גולמי על משאב של מארגן בלי `where: { organizerId }`.
3. **Tokens:** nanoid באורך 24 (אלפבית ללא תווים דו-משמעיים) לקישורים אישיים; slug אירוע — nanoid 12. אין IDs רציפים ב־URL.
4. **Rate limiting** בזיכרון (פר-instance) על פעולות ציבוריות: RSVP, קוד כניסה, דיווח. בפרודקשן מרובה-instances מומלץ Upstash — מתועד ב־deployment-guide.
5. **מצבי מרוץ:** אישור הגעה רץ בטרנזקציה: נעילת שורת האירוע (Postgres: `SELECT ... FOR UPDATE` דרך `$transaction` סריאלי; SQLite סריאלי מטבעו) → בדיקת מכסה → כתיבה.
6. **noindex** גורף: `X-Robots-Tag` + robots.txt + meta.

## תזרים RSVP (הליבה)
1. אורח פותח `/i/[token]` → נרשם `linkOpenedAt` (פעם ראשונה בלבד).
2. טופס RSVP נשלח כ־server action עם token + סכמת Zod.
3. טרנזקציה: ולידציית סטטוס אירוע (פורסם? לא הסתיים? דדליין?) → מכסת מוזמן → מכסה כוללת (רק "מגיע/ה") → upsert של RSVP + תשובות לשאלות.
4. עדכון חוזר מאותו token מותר תמיד (עד חסימת דדליין, לפי מדיניות המארגן).
5. התראת מארגן נרשמת ל־`EmailJob` (מיידי-מקובץ או סיכום יומי).

## מחזור חיים (jobs)
`/api/cron/lifecycle` (מוגן ב־CRON_SECRET):
- אירוע שעבר זמן סיום → סטטוס `ENDED`.
- `ENDED` + 7 ימים → רשימת משתתפים חסומה לאורחים.
- `ENDED` + 83 יום → מייל התראה למארגן + הצעת ייצוא.
- `ENDED` + 90 יום → אנונימיזציה: שמות אורחים → "אורח", מחיקת טלפונים, הודעות, תשובות טקסט, פרופילים ותמונות. ספירות מצטברות נשמרות.

## i18n
כל המחרוזות ב־`lib/i18n/he.ts` עם טיפוס `Dictionary`. הוספת אנגלית = קובץ `en.ts` + היפוך כיוון לפי locale. תאריכים ב־`Intl.DateTimeFormat('he-IL', { timeZone: event.timezone })`.

## ניטור
לוגים מובנים ללא PII (מזהים פנימיים בלבד, לעולם לא שמות/מיילים/תשובות). שגיאות — hook מוכן ל־Sentry (לא מחובר בהיעדר DSN).

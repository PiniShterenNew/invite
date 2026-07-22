# Deployment Guide — "באים?"

## הקמה מקומית (Dev)

```bash
npm install
npx prisma migrate dev      # יוצר/מעדכן dev.db (SQLite)
npm run db:seed             # נתוני דמו (ראה למטה)
npm run dev                 # http://localhost:3000
```

בלי אף credential חיצוני: התחברות עובדת (Magic Link מודפס לקונסול + נשמר ב-`.dev-mailbox/*.html`), תמונות נשמרות ב-`.uploads/` על הדיסק, מיילים כותבים ל-`.dev-mailbox/`.

**חשבון דמו**: `demo@baim.app` — כניסה דרך `/login`, הזנת המייל, ואז פתיחת הקישור שהודפס לטרמינל (או הקובץ החדש ב-`.dev-mailbox/`).

## משתני סביבה (`.env.example` → `.env`)

| משתנה | חובה ב-Dev? | חובה ב-Prod? | מאיפה משיגים |
|---|---|---|---|
| `DATABASE_URL` | לא (ברירת מחדל SQLite) | **כן** — PostgreSQL | Supabase: Project Settings→Database→Connection string. Neon: Dashboard→Connection Details |
| `AUTH_SECRET` | לא (יש ברירת מחדל לא-בטוחה) | **כן** | `npx auth secret` או `openssl rand -base64 32` |
| `AUTH_URL` / `APP_URL` | לא | **כן** | כתובת הדומיין הסופית, ללא `/` בסוף |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | לא (Google מוסתר אם חסר) | מומלץ | console.cloud.google.com → APIs & Services → Credentials → OAuth Client. Redirect URI: `{APP_URL}/api/auth/callback/google` |
| `RESEND_API_KEY` | לא (fallback ל-`.dev-mailbox/`) | **כן** | resend.com/api-keys, אחרי אימות דומיין שולח |
| `EMAIL_FROM` | לא | מומלץ | כתובת מהדומיין המאומת ב-Resend |
| `CRON_SECRET` | לא | **כן** | מחרוזת אקראית; מוגדרת גם ב-Vercel Cron header |
| `S3_ENDPOINT`/`S3_BUCKET`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` | לא (דיסק מקומי) | **כן** אם רוצים אחסון תמונות עמיד | Supabase Storage / Cloudflare R2 |

## מעבר SQLite → PostgreSQL (חובה לפני פרודקשן)

1. ב-`prisma/schema.prisma`: שנה `provider = "sqlite"` ל-`provider = "postgresql"`.
2. החלף אדפטר ב-`src/lib/db.ts`: `@prisma/adapter-better-sqlite3` → `@prisma/adapter-pg` (`npm install @prisma/adapter-pg pg`).
3. `DATABASE_URL` בפרודקשן = מחרוזת החיבור מ-Supabase/Neon.
4. `npx prisma migrate deploy` (לא `migrate dev`) בפריסה.
5. אחסון תמונות: השלם את מסלול ה-S3 החסר ב-`src/lib/storage.ts` (כרגע `UploadError("s3-not-configured-in-dev")` — יש להחליף בהעלאת PUT חתומה ל-bucket, ולעדכן `imageUrl()` להצביע ל-CDN של הספק).

## פריסה ל-Vercel

1. חבר את המאגר ב-Vercel, הגדר את כל משתני הסביבה מהטבלה למעלה.
2. `vercel.json` כבר מגדיר Cron יומי ל-`/api/cron/lifecycle` (03:00). ודא ש-`CRON_SECRET` מוגדר — Vercel שולח אותו אוטומטית כ-`Authorization: Bearer {CRON_SECRET}` לקריאות Cron מוגדרות.
3. Build command: `npm run build` (כולל `prisma generate` דרך postinstall — ודא זאת קיים או הרץ ידנית לפני build אם צריך).
4. לאחר הפריסה הראשונה: `npx prisma migrate deploy` מול ה-`DATABASE_URL` של הפרודקשן (מריצים דרך Vercel CLI/GitHub Action, לא מתוך קוד האפליקציה).
5. Seed נתוני דמו לפרודקשן הוא **אופציונלי בלבד** ומיועד לסביבת demo/staging — אין להריץ `db:seed` על מסד production אמיתי עם משתמשים חיים.

## Rate limiting במולטי-אינסטנס
`lib/rate-limit.ts` הוא in-memory — עובד נכון רק כשיש instance יחיד (Vercel region בודד, ללא edge functions מקבילות רבות). בקנה מידה גדול יותר: להחליף ב-Upstash Redis (`@upstash/ratelimit`) עם אותו API חתימה (`rateLimit(key, limit, windowMs): boolean`), כדי לא לשנות את קוד הקריאה.

## ניטור
לא מחובר ספק חיצוני כברירת מחדל (למניעת איסוף PII מיותר ללא צורך). מומלץ Sentry עם `beforeSend` שמסנן כל שדה שאינו מזהה טכני — הוסף `SENTRY_DSN` ל-`.env` ו-hook ב-`instrumentation.ts` כאשר רוצים ניטור שגיאות בפרודקשן.

## Checklist לפני השקה
ראה `docs/implementation-plan.md` § "קריטריוני השלמה" לרשימה המלאה מול הדרישות המקוריות.

# Privacy & Security — "באים?"

## מודל איום בקצרה
נכסים רגישים: שמות/טלפונים/תשובות RSVP של אורחים, תמונות פרופיל, קישורי אינסטגרם, כתובות מיקום. תוקפים אפשריים: משתמש סקרן שמנחש URL, מוזמן שרוצה לראות מי עוד בא בלי הרשאה, בוט שמנסה קודי גישה, מארגן זדוני שמנסה לגשת לאירוע של מארגן אחר.

## בקרות שמומשו

| דרישה | מימוש | קובץ |
|---|---|---|
| Tokens אקראיים, לא ניחושיים | nanoid 24 תווים (~138 סיביות), אלפבית ללא תווים דו-משמעיים | `lib/tokens.ts` |
| אין IDs רציפים ב-URL ציבורי | כל ה-URLs הציבוריים משתמשים ב-`slug`/`inviteToken`, לא ב-`cuid` הפנימי | `prisma/schema.prisma` |
| הרשאות בצד שרת לכל פעולה | `requireEvent`/`requireGuest`/`requireAdminOrThrow` — כל query מסונן ל-`organizerId` בפועל, לא רק ב-UI | `lib/authz.ts`, כל `app/actions/*.ts` |
| RLS | **לא רלוונטי** — הוחלף באכיפה בשכבת שירות עקבית בין SQLite/PostgreSQL (ADR-001 ב-product-decisions.md); שקול ל-RLS נוסף אם עוברים ל-Supabase ישירות |
| Rate limiting לפעולות ציבוריות | RSVP (20/דקה), RSVP כללי (10/דקה), קוד גישה (8/דקה — משטח ה-brute-force), דיווח (5/דקה) | `lib/rate-limit.ts`, `app/actions/guest.ts` |
| ולידציה וסניטציה | סכמות Zod משותפות client/server; אין מסלול כתיבה שעוקף אותן | `lib/validation/schemas.ts` |
| הגבלת סוג/גודל תמונות | JPEG/PNG/WebP בלבד, עד 5MB, נבדק בצד שרת (לא רק `accept=`) | `lib/storage.ts` |
| הסרת metadata מתמונות | `sharp` מקודד מחדש כל העלאה (resize+webp) — מוחק EXIF/GPS אוטומטית כתוצר לוואי | `lib/storage.ts` |
| הגנה מפני XSS | React בורח מכל טקסט כברירת מחדל; אין `dangerouslySetInnerHTML` בקוד | — |
| הגנה מפני CSRF | Server Actions של Next.js כוללים הגנת Origin מובנית; אין formsללא same-origin | Next.js runtime |
| הגנה מפני IDOR | כל גישה למשאב עובר דרך `requireEvent`/`requireGuest` שמוודאים בעלות — לא ניתן לטעון משאב של מארגן אחר גם אם ה-ID ידוע | `lib/authz.ts` |
| הגנה מפני Enumeration | טוקן לא נחשב "לא תקין" עם סטטוס HTTP שונה מתוקן — כל token לא קיים מחזיר אותו עמוד "לא נמצא" (200) בלי הבדל תזמון משמעותי | `app/i/[token]/page.tsx` |
| מדיניות פרטיות/תנאי שימוש | קיימים, מסומנים כטיוטה הדורשת בדיקה משפטית | `app/privacy`, `app/terms` |
| מחיקת מידע | המארגן יכול למחוק אירוע לצמיתות (כולל תמונות) בכל עת; אורח יכול למחוק את הפרופיל שלו בעצמו | `app/actions/organizer.ts`, `app/actions/guest.ts` |
| מניעת אינדוקס | `robots.txt` גורף (`Disallow: /`) + `export const metadata = { robots: { index:false } }` בכל layout + `X-Robots-Tag: noindex` על כל route handler ציבורי (uploads/ics/export) | `app/robots.ts`, `app/layout.tsx` |
| Audit trail | טבלת `AuditEvent` לפעולות מארגן/אדמין/מערכת רגישות (publish, delete, admin.disable_event, lifecycle.anonymize…) | `lib/services/lifecycle.ts` (`audit()`) |
| כלי Admin מינימלי | חיפוש אירוע/מארגן, השבתת אירוע, הסרת פרופיל, טיפול בדיווחים | `app/admin`, `app/actions/admin.ts` |
| מנגנון דיווח | טופס ציבורי ללא צורך בזהות, rate-limited | `app/report`, `app/actions/report.ts` |
| אין רשימת משתתפים לא-מורשית | נבדק בצד שרת: `showGuestList && rsvp.status===YES && guestListVisible()` — לא ניתן לעקוף מה-API כי אין API נפרד, רק server component render | `app/i/[token]/attendees/page.tsx` |
| אין PII בלוגים/URLs/Analytics | `console.error` בפעולות שרת מדפיס רק הודעת שגיאה טכנית, לא payload; אין שם/מייל/תשובה ב-URL של אף מסלול | כל `app/actions/*.ts` |
| קודי גישה מוצפנים | scrypt מלוח + salt ייחודי, השוואה ב-`timingSafeEqual` | `lib/services/access.ts` |

## פרטים שדורשים בדיקה משפטית אנושית (לא הוסק כאן משפטית)
1. **חוק הגנת הפרטיות (תיקון 13, נכנס לתוקף 2025)** — האם המערכת (כמערכת שמנהלת מידע אישי של צדדים שלישיים — אורחים — עבור לקוחות המארגנים) נחשבת "בעל מאגר" או "מעבד" מטעם המארגן, ומה חובות הרישום/אבטחה הנגזרות. יש לבדוק מול עו"ד פרטיות.
2. **תקופות השמירה (7/90 יום)** — נבחרו כאיזון סביר בין privacy-by-design לשימושיות, אך לא אומתו מול דרישת מינימום/מקסימום חוקית ספציפית. אם יש דרישה רגולטורית מפורשת, יש לעדכן את `ANONYMIZE_DAYS_AFTER_END` וכו' ב-`lib/constants.ts`.
3. **מיקום שרתים/מעבר גבולות** — אם ה-DB המנוהל (Supabase/Neon) או Resend מארחים מחוץ לישראל/האיחוד האירופי, ייתכנו חובות גילוי נוספות במדיניות הפרטיות.
4. **גיל מינימלי** — קהל היעד 18–40 אך לא מיושמת בדיקת גיל בפועל (לא נדרש ב-MVP, אך שווה החלטה מוצרית מפורשת אם יעד השיווק יתרחב).
5. **תוכן שנוצר ע"י אורחים (בקרוב: תמונת פרופיל)** — מדיניות ה-moderation (report → admin) קיימת אך לא הוגדר SLA משפטי לטיפול בתוכן פוגעני.

## מה עדיין לא מכוסה (מתועד ולא מוסתר)
- **Rate limiting הוא in-memory per-instance** — מספיק ל-instance בודד; בפריסת multi-instance אמיתית יש לעבור ל-Upstash Redis (מתועד ב-deployment-guide.md).
- **אין 2FA למארגנים** — לא נדרש באפיון; Magic Link + Google נחשבים מספיק חזקים ל-MVP.
- **אין סריקת וירוסים על תמונות שהועלו** — הסתמכות על `sharp` re-encode (הופך כל payload עוין בקובץ תמונה ללא-רלוונטי כי הפיקסלים מקודדים מחדש), אך לא הוחלף בסריקה ייעודית.

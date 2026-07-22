# Database Schema — "באים?"

מקור האמת: `prisma/schema.prisma`. מסמך זה מסביר את ההחלטות, לא חוזר על כל שדה.

## החלטות עיצוב סכמה

- **String במקום enum**: SQLite (dev/test) אינו תומך ב-enum של Prisma באופן זהה ל-PostgreSQL; לכן כל שדה "מסוג סגור" (status, type, accessMode…) הוא `String` עם קבועים מקבילים ב-`src/lib/constants.ts` ואכיפה ב-Zod (`src/lib/validation/schemas.ts`). זה גם מפשט מעבר SQLite→PostgreSQL ללא מיגרציית enum.
- **JSON כ-String**: `scheduleJson`, `optionsJson` — נשמרים כמחרוזת JSON (לא Json native type, שאינו נתמך זהה בשני הדיאלקטים) ומפוענחים בשכבת השירות (`lib/services/event-view.ts`).
- **בלי enum מסד-נתונים = בלי CHECK constraint אוטומטי** — הפיצוי: כל כתיבה עוברת סכמת Zod תואמת לפני שהיא מגיעה ל-Prisma (אין נתיב כתיבה שעוקף server actions).

## ישויות וההחלטה עליהן (מול הרשימה המוצעת באפיון)

| ישות מוצעת | הוחלט | הערה |
|---|---|---|
| users | ✅ נשאר | Auth.js managed; `role` (USER/ADMIN) + `disabledAt` למודרציה |
| organizer_profiles | ✅ **מוזג לתוך User** | אין מספיק שדות ייחודיים למארגן כדי להצדיק טבלה נפרדת ב-MVP |
| events | ✅ נשאר | הישות המרכזית; כולל design/content/privacy/policy inline (לא טבלאות נפרדות — ראו הבא) |
| event_themes | ✅ **מוזג לתוך Event** | template/accentColor/typography/coverImage הם 4 שדות סקלריים על Event, לא ישות — אין להם מחזור חיים עצמאי |
| event_sections | ✅ **מוזג לתוך Event** | description/dressCode/scheduleJson/bringList/playlistUrl/showCountdown/showGuestList — "מקטעים" הם שדות אופציונליים על Event, לא רשומות; אין יתרון לנרמל טבלה בגודל קבוע (≤10 שדות) שתמיד נטענת יחד עם האירוע |
| event_access_settings | ✅ **מוזג לתוך Event** | accessMode/accessCodeHash/addressReveal/generalLinkMaxParty — נקרא בכל טעינת עמוד אירוע; טבלה נפרדת רק תוסיף JOIN בלי תועלת |
| guests | ✅ נשאר | מוזמן = השורה שמייצגת גם את ההזמנה האישית (`inviteToken`) |
| invitation_links | ✅ **מוזג לתוך Guest** (`inviteToken`) | קישור אישי הוא תמיד 1:1 עם מוזמן ב-MVP (אין ריבוי קישורים למוזמן); שדה, לא טבלה |
| rsvps | ✅ נשאר | 1:1 עם Guest (`guestId @unique`) — "תשובה נוכחית", לא היסטוריה |
| rsvp_answers | ✅ נשאר | קשר רבים-לרבים לוגי בין Rsvp ל-CustomQuestion, עם `@@unique([rsvpId, questionId])` למניעת כפילות |
| custom_questions | ✅ נשאר | שייך לאירוע; `order` קובע סדר תצוגה |
| attendee_profiles | ✅ נשאר | 1:1 עם Guest; זהו הפרופיל **באירוע הזה בלבד** — לא פרופיל גלובלי חוצה-אירועים (בכוונה: המוצר אינו רשת חברתית) |
| announcements | ✅ **מוזג לתוך Event** (`announcement`, `announcementUpdatedAt`) | "הודעה אחת בולטת, לא פיד" — בדיוק תואם שדה יחיד, לא טבלה עם היסטוריה |
| notification_preferences | ✅ **מוזג לתוך Event** (`notifyMode`) | ההעדפה היא **פר-אירוע** לפי האפיון ("לאפשר שינוי לכל אירוע"), לא פר-משתמש — שדה על Event, לא טבלה נפרדת |
| email_jobs | ✅ נשאר | תור מיילים אמיתי (batching, retry visibility דרך `status`/`error`) |
| audit_events | ✅ נשאר | `eventId` הוא **מזהה חופשי, לא relation** — כדי ששורות audit ישרדו גם אחרי מחיקת אירוע (audit trail לא נמחק במחיקה מדורגת) |
| — | ➕ **נוסף: Report** | לא היה ברשימה המוצעת אך נדרש ע"י "מנגנון דיווח בסיסי" בדרישות האבטחה |

## קשרים ומחיקה מדורגת (cascade)
`User → Event → {Guest, CustomQuestion}`, `Guest → {Rsvp, AttendeeProfile}`, `Rsvp → RsvpAnswer` — כולם `onDelete: Cascade`. מחיקת אירוע (`deleteEventPermanently`) מוחקת את כל שרשרת המידע האישי בפעולה אחת עקבית (וגם קבצים פיזיים — קאבר ותמונות פרופיל — נמחקים לפני מחיקת ה-DB record).

`AuditEvent.eventId` **אינו** relation מוגדר בכוונה — ראה לעיל.

## אינדקסים
`Event(organizerId, status)` — רשימת "האירועים שלי" מסוננת לפי סטטוס. `Event(status, endedAt)` — סריקת cron למחזור חיים. `Guest(eventId)` — טעינת רשימת מוזמנים. `RsvpAnswer(rsvpId, questionId) unique` — מונע תשובה כפולה לאותה שאלה. `EmailJob(status, scheduledAt)` — עיבוד תור. `AuditEvent(eventId, createdAt)`, `Report(status, createdAt)`.

## מניעת ספירה כפולה ומצבי מרוץ
`Rsvp.guestId @unique` הופך כל שליחה לחדשה ל-`upsert` (לא insert) — לא ניתן ליצור שתי תשובות לאותו מוזמן. מכסה כוללת (`Event.capacity`) נבדקת **בתוך** אותה טרנזקציה שכותבת את ה-RSVP (`lib/services/rsvp.ts`), כך שבקשות מקבילות נבדקות עם אותה תמונת מצב עקבית — מכוסה בבדיקת אינטגרציה ייעודית (`rsvp.test.ts`, "holds the last party size across concurrent submissions").

## אזורי זמן
`Event.timezone` (IANA, ברירת מחדל `Asia/Jerusalem`) נשמר לצד `startsAt`/`endsAt` (UTC ב-DB). כל תצוגה משתמשת ב-`Intl.DateTimeFormat("he-IL", { timeZone: event.timezone })` — לעולם לא באזור הזמן של הדפדפן (`lib/format.ts`).

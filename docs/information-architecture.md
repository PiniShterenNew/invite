# Information Architecture — "באים?"

## מפת מסכים ונתיבים (App Router)

```
/                              עמוד בית ציבורי
/login                         התחברות מארגן (Google + Magic Link)
/login/sent                    "בדקו את המייל"
/privacy, /terms                מדיניות
/report                        דיווח על תוכן (ציבורי, ללא התחברות)
/robots.txt                    disallow: / (גורף)

/app                            [מוגן] רשימת אירועי המארגן
/app/events/[id]/edit           [מוגן] אשף יצירה/עריכה (5 שלבים)
/app/events/[id]                [מוגן] דשבורד אירוע (סטטיסטיקות, עדכון, פעולות)
/app/events/[id]/guests          [מוגן] ניהול מוזמנים + שיתוף
/app/events/[id]/preview         [מוגן] תצוגה מקדימה = מה שאורח עם קישור אישי רואה

/e/[slug]                       ציבורי: קישור כללי לאירוע (RSVP + שם)
/i/[token]                      ציבורי: קישור אישי (RSVP)
/i/[token]/profile              ציבורי: עריכת פרופיל אורח
/i/[token]/attendees             ציבורי (מותנה): רשימת משתתפים

/admin                          [מוגן, role=ADMIN] חיפוש, השבתה, דיווחים, יומן

/api/uploads/[...key]           הגשת תמונות (dev)
/api/ics/[token]                קובץ ICS להוספה ליומן
/api/events/[id]/export         ייצוא CSV [מוגן]
/api/cron/lifecycle             cron יומי [מוגן ב-CRON_SECRET]
/api/auth/*                     Auth.js
```

## היררכיית הרשאות
1. **ציבורי ללא זהות** — `/`, `/privacy`, `/terms`, `/report`.
2. **ציבורי עם token** — `/e/[slug]`, `/i/[token]/*` — הזהות היא הידיעה של ה-token/slug עצמו (ADR-003). מסונן נוסף לפי `accessMode`, `addressReveal`, `showGuestList`, דדליין ומכסה — הכל בצד שרת.
3. **מארגן מחובר** — `/app/*` — `requireUser()` מפנה ל-`/login`; כל שאילתה מסוננת ל-`organizerId` של המשתמש המחובר (`requireEvent`/`requireGuest` ב-`lib/authz.ts`).
4. **Admin** — `/admin` — `requireAdmin()` דורש `role === "ADMIN"` בנוסף להתחברות.

## מבנה תוכן עמוד אירוע (guest-facing)
סדר קבוע בכל התבניות (`EventPage`): הודעת עדכון (אם קיימת) → קאבר → hero (סוג+שם+מארגן) → ספירה לאחור (אופציונלי) → תאריך/שעה/מיקום (עם חשיפת כתובת מדורגת) → תיאור → **RSVP** (מוקד העמוד) → פעולות אחרי RSVP (יומן, ניווט, משתתפים, פרופיל) → לוח זמנים / קוד לבוש / מה להביא → פלייליסט → footer.

## עצי החלטה קריטיים

**חשיפת כתובת** (`canSeeAddress`, `lib/services/event-view.ts`):
```
ALWAYS          → תמיד מוצג
AFTER_RSVP      → מוצג רק אם rsvp.status === YES (גם בקישור כללי!)
PERSONAL_ONLY   → מוצג רק ל-viewer.kind === "personal"
```

**גישה לעמוד אירוע**:
```
accessMode = PERSONAL_ONLY  → /e/[slug] תמיד "לא נמצא"; רק /i/[token] עובד
accessMode = CODE           → /e/[slug] דורש קוד (עוגיה חתומה לאחר אימות)
accessMode = GENERAL        → /e/[slug] פתוח לכולם
```

**רשימת משתתפים** (`showGuestList` + `guestListVisible`):
```
דרוש: event.showGuestList === true
  AND viewer.rsvp.status === YES
  AND (event.status === PUBLISHED OR (ENDED AND ≤7 ימים מסיום))
```

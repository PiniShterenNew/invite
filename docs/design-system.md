# Design System — "באים?"

## כיוון חזותי
נייר חם ודיו (paper & ink), לא לבן-קליני ולא סגול-גרדיאנט. אישיות: צעיר, מדויק, חברתי — לא ילדותי, לא "עוד SaaS". ה־MVP הוא עברית מלאה ב־RTL; כל הרכיבים נבנים RTL-first (`dir="rtl"` על ה־`<html>`).

מפורש נמנע: גרדיאנטים סגולים גנריים, glassmorphism מוגזם, כרטיסי דשבורד חסרי אופי, אימוג'ים כתחליף לאייקונוגרפיה עקבית (למעט שימוש מכוון בעמודי אורח לחמימות).

## Tokens (`src/app/globals.css`, `@theme`)

| קטגוריה | טוקנים | שימוש |
|---|---|---|
| בסיס | `--color-paper`, `--color-cream`, `--color-sand`, `--color-ink`, `--color-ink-soft`, `--color-ink-faint`, `--color-line` | רקעים, טקסט, גבולות בכל האפליקציה הכללית (לא בתוך תבניות אירוע) |
| מותג | `--color-coral` / `-deep` / `-soft` | CTA ראשי, מותג |
| אקסנטים לאירוע | `ocean, lime, violet, amber, rose` (+`-soft`) | המארגן בוחר אחד לכל אירוע (שלב עיצוב באשף) |
| סטטוס | `yes/maybe/no` (+`-soft`) | Badges של RSVP בדשבורד |
| משטחים כהים | `--color-night`, `--color-night-soft` | תבנית "midnight" |
| טיפוגרפיה | `--font-sans` (Heebo), `--font-display` (Frank Ruhl Libre) | טקסט רגיל / כותרות חגיגיות |
| צורה/צל | `--radius-card` (1.25rem), `--shadow-card`, `--shadow-pop` | כרטיסים בכל מקום |

## טיפוגרפיה
- **Heebo** — טקסט UI, תמיכה מלאה בעברית, קריאה גבוהה בגדלים קטנים.
- **Frank Ruhl Libre** — כותרות חגיגיות (עמוד בית, hero של תבניות classic/garden). ניגודיות אופי בלי לפגוע בקריאות.

## רכיבי ליבה (`src/components/ui.tsx`)
`Button` (primary/secondary/ghost/danger), `Card`, `Field`+`Input`/`Textarea`/`Select`, `Badge` (5 גוונים), `SegmentedOption` (רדיו כ"כרטיס" — משמש בכל בחירה יחידה: סוג אירוע, פרטיות, מדיניות דדליין), `EmptyState`, `Spinner`, `Stat`. כל אלמנט אינטראקטיבי: `min-h-11` (≥44px מגע), `:focus-visible` בולט בקורל.

## תבניות עמוד אירוע (`src/components/event/templates.ts`)
ארבע תבניות **שונות במבנה**, לא רק בצבע (ראה ADR/החלטה #19 ב־product-decisions.md):

| תבנית | אופי | טיפוגרפיה | רקע |
|---|---|---|---|
| classic | מאוזן, חגיגי-קלאסי | Frank Ruhl display | נייר בהיר |
| midnight | דרמטי, מסיבתי | sans מודגש, uppercase | כהה (`night`) |
| sunset | חם, אנרגטי | sans ענק | גרדיאנט חם עדין |
| garden | רך, אינטימי | display נטוי | ירוק-קרם, פינות מעוגלות מאוד |

לכל תבנית: `page`, `hero`, `heroTitle`, `card`, `sectionTitle`, `chip` — כך שכל עמוד אירוע (`EventPage`) בנוי מאותם בלוקים לוגיים בכל תבנית, רק בסגנון שונה.

## מצבים נדרשים לכל מסך
Loading (`Spinner`/skeleton רק היכן שמשפר), Empty (`EmptyState`), Error (הודעת `role="alert"` בקורל-רקע), Success (הודעת `role="status"` בירוק-רקע). כל טופס שומר את מה שהוזן בשגיאה (state בצד לקוח, לא מתאפס).

## נגישות
מיקוד ברור (`outline: 2px solid coral`), ARIA על כפתורי מצב (`aria-pressed`), טפסים עם `<label>`/`Field`, אזורי הודעה עם `role="status"`/`role="alert"`, `prefers-reduced-motion` מנוטרל אנימציות גלובלית, יעדי מגע ≥44px, ניגודיות טקסט על רקע נבדקה מול WCAG AA (ink #211c15 על paper #faf7f2 = יחס >13:1).

## מובייל תחילה
כל מסכי האורח והאשף בנויים ברוחב מובייל (`max-w-lg`/`max-w-md`) ומתרחבים בעדינות לדסקטופ. כפתורי RSVP/פרטיות הם "כרטיסים" גדולים בני מגע, לא תיבות סימון קטנות.

# באים? 🎉

מערכת חינמית (בתקופת ההשקה) ליצירת הזמנות דיגיטליות לאירועים חברתיים — ימי הולדת, מסיבות בית וגג, מסיבות רווקים/ות. עברית מלאה, RTL, Mobile-first, שיתוף ידני ב-WhatsApp.

> "ליצור אירוע יפה, לשלוח הזמנות אישיות בוואטסאפ, לנהל אישורי הגעה, ולאפשר למשתתפים לראות מי מגיע — לפי רמת הפרטיות שנבחרה."

## תיעוד מלא
כל האפיון, הביקורת על ההחלטות, הארכיטקטורה והתוכנית נמצאים ב-[`docs/`](./docs):
[product-brief](./docs/product-brief.md) · [product-decisions (ADRs)](./docs/product-decisions.md) · [user-flows](./docs/user-flows.md) · [information-architecture](./docs/information-architecture.md) · [design-system](./docs/design-system.md) · [technical-architecture](./docs/technical-architecture.md) · [database-schema](./docs/database-schema.md) · [privacy-and-security](./docs/privacy-and-security.md) · [implementation-plan](./docs/implementation-plan.md) · [testing-plan](./docs/testing-plan.md) · [deployment-guide](./docs/deployment-guide.md)

## Stack
Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · Prisma (SQLite dev / PostgreSQL prod) · Auth.js v5 (Google + Email Magic Link) · Resend · sharp · Zod · Vitest

## הרצה מקומית
```bash
npm install
npx prisma migrate dev     # יוצר dev.db
npm run db:seed            # נתוני דמו (חשבון: demo@baim.app)
npm run dev                # http://localhost:3000
```
בלי אף credential חיצוני: התחברות עובדת (קישור מודפס לקונסול + נשמר ב-`.dev-mailbox/`), תמונות נשמרות ב-`.uploads/`. פרטים מלאים ב-[deployment-guide.md](./docs/deployment-guide.md), כולל בדיוק אילו ערכים חסרים לפרודקשן ומאיפה להשיג אותם (`.env.example`).

## בדיקות ואיכות
```bash
npm run typecheck
npm run lint
npm test          # 37 בדיקות יחידה+אינטגרציה מול SQLite אמיתי
npm run build
```
כל הארבעה נבדקו ועברו נקי. פירוט מלא של מה נבדק בפועל מול מה שנשאר פתוח: [implementation-plan.md](./docs/implementation-plan.md).

## מבנה הפרויקט
```
src/app/            נתיבים (App Router): ציבורי, /app (מארגן), /e /i (אורח), /admin, /api
src/components/     ui.tsx (kit משותף), event/ (עמוד אירוע+תבניות), organizer/, admin/
src/lib/            db, auth, authz, tokens, validation, i18n, services/, email/
prisma/             schema.prisma, migrations/, seed.ts
docs/               כל מסמכי האפיון והתכנון
```

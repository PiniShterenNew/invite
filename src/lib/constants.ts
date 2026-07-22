// Enum-like constants. The Prisma schema stores these as String for
// SQLite/PostgreSQL portability (ADR-001); every write path validates
// against these via Zod (ADR-005).

export const EVENT_TYPES = ["BIRTHDAY", "HOUSE_PARTY", "ROOFTOP", "BACHELOR", "BACHELORETTE", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "ENDED", "ARCHIVED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ACCESS_MODES = ["GENERAL", "PERSONAL_ONLY", "CODE"] as const;
export type AccessMode = (typeof ACCESS_MODES)[number];

export const ADDRESS_REVEALS = ["ALWAYS", "AFTER_RSVP", "PERSONAL_ONLY"] as const;
export type AddressReveal = (typeof ADDRESS_REVEALS)[number];

export const DEADLINE_POLICIES = ["BLOCK", "WARN"] as const;
export type DeadlinePolicy = (typeof DEADLINE_POLICIES)[number];

export const RSVP_STATUSES = ["YES", "MAYBE", "NO"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const QUESTION_TYPES = ["TEXT", "SINGLE", "MULTI", "YESNO"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SHARE_LEVELS = ["MINIMAL", "SOCIAL", "OPEN"] as const;
export type ShareLevel = (typeof SHARE_LEVELS)[number];

export const NOTIFY_MODES = ["IMMEDIATE", "DAILY", "NONE"] as const;
export type NotifyMode = (typeof NOTIFY_MODES)[number];

export const TEMPLATES = ["classic", "midnight", "sunset", "garden"] as const;
export type TemplateId = (typeof TEMPLATES)[number];

export const ACCENT_COLORS = ["coral", "ocean", "lime", "violet", "amber", "rose"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export const MAX_QUESTIONS = 3;
export const MAX_PARTY_PER_GUEST = 10;
export const MAX_GUESTS_PER_EVENT = 500;
export const DEFAULT_TIMEZONE = "Asia/Jerusalem";

export const GUEST_LIST_VISIBLE_DAYS_AFTER_END = 7;
export const ANONYMIZE_DAYS_AFTER_END = 90;
export const ANONYMIZE_WARNING_DAYS_BEFORE = 7;

export const APP_NAME = "באים?";
export const APP_NAME_LATIN = "baim"; // working name, easily replaceable

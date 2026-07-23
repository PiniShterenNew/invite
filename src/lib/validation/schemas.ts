import { z } from "zod";
import {
  ACCENT_COLORS,
  ACCESS_MODES,
  ADDRESS_REVEALS,
  DEADLINE_POLICIES,
  EVENT_TYPES,
  MAX_PARTY_PER_GUEST,
  MAX_QUESTIONS,
  NOTIFY_MODES,
  QUESTION_TYPES,
  RSVP_STATUSES,
  SHARE_LEVELS,
  TEMPLATES,
  BACKGROUND_PATTERNS,
  FONT_SIZES,
} from "@/lib/constants";

// Shared client/server validation (ADR-005). Every server action parses its
// input through one of these before touching the database.

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const scheduleRowSchema = z.object({
  time: trimmed(20),
  label: trimmed(80),
});

export const eventBasicsSchema = z.object({
  type: z.enum(EVENT_TYPES),
  name: trimmed(80),
  hostName: trimmed(60),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  timezone: z.string().trim().min(1).max(50),
});

export const eventLocationSchema = z.object({
  locationName: z.string().trim().max(80).optional().or(z.literal("")),
  locationAddress: z.string().trim().max(160).optional().or(z.literal("")),
  addressReveal: z.enum(ADDRESS_REVEALS),
  accessMode: z.enum(ACCESS_MODES),
  accessCode: z
    .string()
    .trim()
    .regex(/^[0-9a-zA-Zא-ת]{4,8}$/, "code must be 4-8 alphanumeric chars")
    .optional()
    .or(z.literal("")),
});

export const eventDesignSchema = z.object({
  template: z.enum(TEMPLATES),
  accentColor: z.enum(ACCENT_COLORS),
  typography: z.enum(["default", "serif", "bold"]),
  backgroundPattern: z.enum(BACKGROUND_PATTERNS).default("none"),
  fontSize: z.enum(FONT_SIZES).default("normal"),
});

export const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(QUESTION_TYPES),
  label: trimmed(120),
  options: z.array(trimmed(60)).max(8).optional(),
});

export const eventContentSchema = z.object({
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  dressCode: z.string().trim().max(120).optional().or(z.literal("")),
  schedule: z.array(scheduleRowSchema).max(12).optional(),
  bringList: z.string().trim().max(500).optional().or(z.literal("")),
  playlistUrl: z
    .string()
    .trim()
    .url()
    .max(300)
    .refine((u) => u.startsWith("https://"), "https only")
    .optional()
    .or(z.literal("")),
  showCountdown: z.boolean(),
  showGuestList: z.boolean(),
  questions: z.array(questionSchema).max(MAX_QUESTIONS),
  rsvpDeadline: z.coerce.date().nullable().optional(),
  deadlinePolicy: z.enum(DEADLINE_POLICIES),
  capacity: z.number().int().positive().max(5000).nullable().optional(),
  notifyMode: z.enum(NOTIFY_MODES),
});

export const guestCreateSchema = z.object({
  name: trimmed(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-() ]{6,20}$/)
    .optional()
    .or(z.literal("")),
  maxParty: z.number().int().min(1).max(MAX_PARTY_PER_GUEST),
});

export const guestPasteSchema = z.object({
  text: z.string().min(1).max(20000),
});

export const generalLinkSettingsSchema = z.object({
  generalLinkMaxParty: z.number().int().min(1).max(MAX_PARTY_PER_GUEST),
});

export const rsvpSubmitSchema = z.object({
  status: z.enum(RSVP_STATUSES),
  partySize: z.number().int().min(1).max(MAX_PARTY_PER_GUEST),
  message: z.string().trim().max(300).optional().or(z.literal("")),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.string().trim().max(500),
      })
    )
    .max(MAX_QUESTIONS)
    .optional(),
});

// General-link RSVP additionally carries the guest's name.
export const generalRsvpSchema = rsvpSubmitSchema.extend({
  name: trimmed(80),
});

// Instagram: username only — never a full URL (privacy review).
export const profileSchema = z.object({
  shareLevel: z.enum(SHARE_LEVELS),
  bio: z.string().trim().max(120).optional().or(z.literal("")),
  instagram: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._]{1,30}$/, "instagram username only")
    .optional()
    .or(z.literal("")),
});

export const accessCodeSchema = z.object({
  code: z.string().trim().min(1).max(20),
});

export const announcementSchema = z.object({
  text: z.string().trim().max(300),
});

export const reportSchema = z.object({
  targetType: z.enum(["EVENT", "PROFILE"]),
  targetRef: trimmed(200),
  reason: trimmed(100),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const emailSchema = z.string().trim().toLowerCase().email().max(200);

export const passwordSchema = z.string().min(8).max(72);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

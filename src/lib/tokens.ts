import { customAlphabet } from "nanoid";

// Unambiguous alphabet (no 0/O/1/l/I) — links get read aloud and retyped.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

// Personal invitation token: 24 chars ≈ 138 bits — not guessable (ADR-003).
export const newInviteToken = customAlphabet(ALPHABET, 24);

// Public event slug for the general link: 12 chars ≈ 69 bits.
export const newEventSlug = customAlphabet(ALPHABET, 12);

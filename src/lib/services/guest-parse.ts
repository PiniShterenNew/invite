// Parses pasted free-text guest lists (one guest per line) into structured
// rows. Heuristic: "איתי ושירה" (two first names joined by ו') reads as a
// couple → 2 seats. Always shown for correction before saving.

export interface ParsedGuest {
  name: string;
  maxParty: number;
}

const COUPLE_RE = /^[֐-׿'"]+ ו[֐-׿'"]+$/;

export function parseGuestLines(text: string): ParsedGuest[] {
  const seen = new Set<string>();
  const out: ParsedGuest[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name || name.length > 80) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, maxParty: COUPLE_RE.test(name) ? 2 : 1 });
  }
  return out;
}

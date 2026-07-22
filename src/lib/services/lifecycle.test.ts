import { describe, expect, it } from "vitest";
import { effectiveEnd, guestListVisible } from "@/lib/services/lifecycle";
import { GUEST_LIST_VISIBLE_DAYS_AFTER_END } from "@/lib/constants";

describe("effectiveEnd", () => {
  it("uses endsAt when provided", () => {
    const startsAt = new Date("2026-01-01T20:00:00Z");
    const endsAt = new Date("2026-01-02T02:00:00Z");
    expect(effectiveEnd({ startsAt, endsAt })).toEqual(endsAt);
  });

  it("falls back to 6h after start when endsAt is missing", () => {
    const startsAt = new Date("2026-01-01T20:00:00Z");
    expect(effectiveEnd({ startsAt, endsAt: null })).toEqual(new Date("2026-01-02T02:00:00Z"));
  });
});

describe("guestListVisible", () => {
  it("is visible while the event is still published", () => {
    expect(guestListVisible({ status: "PUBLISHED", endedAt: null })).toBe(true);
  });

  it("is visible within the grace window after ending", () => {
    const endedAt = new Date(Date.now() - 2 * 24 * 3600_000);
    expect(guestListVisible({ status: "ENDED", endedAt })).toBe(true);
  });

  it("closes after the grace window", () => {
    const endedAt = new Date(Date.now() - (GUEST_LIST_VISIBLE_DAYS_AFTER_END + 1) * 24 * 3600_000);
    expect(guestListVisible({ status: "ENDED", endedAt })).toBe(false);
  });

  it("is never visible for a draft/archived event without an end date", () => {
    expect(guestListVisible({ status: "ARCHIVED", endedAt: null })).toBe(false);
  });
});

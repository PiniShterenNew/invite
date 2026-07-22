import { describe, expect, it } from "vitest";
import { canSeeAddress } from "@/lib/services/event-view";

describe("canSeeAddress", () => {
  it("ALWAYS reveals to anyone", () => {
    expect(canSeeAddress({ addressReveal: "ALWAYS" }, { kind: "general" })).toBe(true);
    expect(canSeeAddress({ addressReveal: "ALWAYS" }, { kind: "personal" })).toBe(true);
  });

  it("AFTER_RSVP requires a YES rsvp regardless of link kind", () => {
    expect(canSeeAddress({ addressReveal: "AFTER_RSVP" }, { kind: "general", rsvpStatus: "YES" })).toBe(true);
    expect(canSeeAddress({ addressReveal: "AFTER_RSVP" }, { kind: "personal", rsvpStatus: "MAYBE" })).toBe(false);
    expect(canSeeAddress({ addressReveal: "AFTER_RSVP" }, { kind: "personal", rsvpStatus: null })).toBe(false);
  });

  it("PERSONAL_ONLY requires a personal link regardless of rsvp", () => {
    expect(canSeeAddress({ addressReveal: "PERSONAL_ONLY" }, { kind: "personal", rsvpStatus: null })).toBe(true);
    expect(canSeeAddress({ addressReveal: "PERSONAL_ONLY" }, { kind: "general", rsvpStatus: "YES" })).toBe(false);
  });

  it("the organizer preview always sees the address", () => {
    expect(canSeeAddress({ addressReveal: "PERSONAL_ONLY" }, { kind: "preview" })).toBe(true);
  });
});

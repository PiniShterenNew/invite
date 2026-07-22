import { describe, expect, it } from "vitest";
import { profileSchema, guestCreateSchema, rsvpSubmitSchema } from "@/lib/validation/schemas";

describe("profileSchema", () => {
  it("accepts an instagram username", () => {
    expect(profileSchema.safeParse({ shareLevel: "OPEN", instagram: "dana.levi_1" }).success).toBe(true);
  });

  it("rejects a full instagram URL (privacy: username only)", () => {
    expect(profileSchema.safeParse({ shareLevel: "OPEN", instagram: "https://instagram.com/dana" }).success).toBe(false);
  });

  it("rejects an unknown share level", () => {
    expect(profileSchema.safeParse({ shareLevel: "PUBLIC" }).success).toBe(false);
  });
});

describe("guestCreateSchema", () => {
  it("requires a name but not a phone", () => {
    expect(guestCreateSchema.safeParse({ name: "מאיה", maxParty: 1 }).success).toBe(true);
  });

  it("rejects maxParty above the hard cap", () => {
    expect(guestCreateSchema.safeParse({ name: "מאיה", maxParty: 99 }).success).toBe(false);
  });
});

describe("rsvpSubmitSchema", () => {
  it("accepts a minimal YES response", () => {
    expect(rsvpSubmitSchema.safeParse({ status: "YES", partySize: 1 }).success).toBe(true);
  });

  it("rejects an invalid status", () => {
    expect(rsvpSubmitSchema.safeParse({ status: "GOING", partySize: 1 }).success).toBe(false);
  });
});

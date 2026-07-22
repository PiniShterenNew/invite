import { describe, expect, it } from "vitest";
import { hashAccessCode, verifyAccessCode } from "@/lib/services/access";

describe("access code hashing", () => {
  it("verifies the correct code", () => {
    const stored = hashAccessCode("2412");
    expect(verifyAccessCode("2412", stored)).toBe(true);
  });

  it("rejects a wrong code", () => {
    const stored = hashAccessCode("2412");
    expect(verifyAccessCode("0000", stored)).toBe(false);
  });

  it("never stores the code in plaintext", () => {
    const stored = hashAccessCode("2412");
    expect(stored).not.toContain("2412");
  });

  it("produces a different hash each time (salted)", () => {
    expect(hashAccessCode("2412")).not.toBe(hashAccessCode("2412"));
  });
});

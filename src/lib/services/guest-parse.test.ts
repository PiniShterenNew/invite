import { describe, expect, it } from "vitest";
import { parseGuestLines } from "@/lib/services/guest-parse";

describe("parseGuestLines", () => {
  it("splits one guest per line and trims whitespace", () => {
    const result = parseGuestLines("דניאל כהן\n  נועה לוי  \n\nמאיה");
    expect(result.map((r) => r.name)).toEqual(["דניאל כהן", "נועה לוי", "מאיה"]);
  });

  it("detects a couple joined by 'ו' as 2 seats", () => {
    const result = parseGuestLines("איתי ושירה");
    expect(result).toEqual([{ name: "איתי ושירה", maxParty: 2 }]);
  });

  it("defaults a single name to 1 seat", () => {
    const result = parseGuestLines("מאיה");
    expect(result[0].maxParty).toBe(1);
  });

  it("deduplicates case-insensitively", () => {
    const result = parseGuestLines("Dana\ndana\nDANA");
    expect(result).toHaveLength(1);
  });

  it("ignores blank lines and absurdly long lines", () => {
    const long = "א".repeat(200);
    const result = parseGuestLines(`\n\n${long}\nמאיה\n   \n`);
    expect(result.map((r) => r.name)).toEqual(["מאיה"]);
  });
});

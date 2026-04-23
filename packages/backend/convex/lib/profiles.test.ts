import { describe, expect, it } from "bun:test";

import { getDefaultDisplayName } from "./profiles";

describe("getDefaultDisplayName", () => {
  it("uses the trimmed auth name when present", () => {
    expect(getDefaultDisplayName({ name: "  Ana  " })).toBe("Ana");
  });

  it("falls back to a privacy-safe generic name when auth name is missing", () => {
    expect(getDefaultDisplayName({})).toBe("Participante");
  });

  it("falls back to a privacy-safe generic name when auth name is blank", () => {
    expect(getDefaultDisplayName({ name: "   " })).toBe("Participante");
  });
});

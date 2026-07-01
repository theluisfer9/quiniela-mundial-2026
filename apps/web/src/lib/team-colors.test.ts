import { describe, expect, it } from "bun:test";

import { getTeamPrimaryColor } from "./team-colors";

describe("getTeamPrimaryColor", () => {
  it("returns stable primary colors for known national teams", () => {
    expect(getTeamPrimaryColor("ARG")).toBe("#75AADB");
    expect(getTeamPrimaryColor("BRA")).toBe("#FFDF00");
  });

  it("falls back to the neutral bracket color for unknown teams", () => {
    expect(getTeamPrimaryColor("TBD")).toBe("#5f5a50");
    expect(getTeamPrimaryColor(undefined)).toBe("#5f5a50");
  });
});

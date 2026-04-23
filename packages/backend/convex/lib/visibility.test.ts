import { describe, expect, it } from "bun:test";

import { canRevealPrediction, isMatchLocked } from "./visibility";

describe("isMatchLocked", () => {
  it("locks the match exactly at kickoff", () => {
    const kickoff = 1_785_196_800_000;

    expect(isMatchLocked({ kickoff, now: kickoff - 1 })).toBe(false);
    expect(isMatchLocked({ kickoff, now: kickoff })).toBe(true);
  });
});

describe("canRevealPrediction", () => {
  it("reveals predictions exactly at kickoff", () => {
    const kickoff = 1_785_196_800_000;

    expect(canRevealPrediction({ kickoff, now: kickoff - 1 })).toBe(false);
    expect(canRevealPrediction({ kickoff, now: kickoff })).toBe(true);
  });
});

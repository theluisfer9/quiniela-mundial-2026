import { describe, expect, it } from "bun:test";

import { MAX_SOCCER_SCORE, normalizeSoccerScore } from "./scores";

describe("normalizeSoccerScore", () => {
  it("converts valid int64 soccer scores to numbers", () => {
    expect(normalizeSoccerScore(0n)).toBe(0);
    expect(normalizeSoccerScore(7n)).toBe(7);
    expect(normalizeSoccerScore(BigInt(MAX_SOCCER_SCORE))).toBe(MAX_SOCCER_SCORE);
  });

  it("rejects negative scores", () => {
    expect(() => normalizeSoccerScore(-1n)).toThrow("Score must be between 0 and 20");
  });

  it("rejects unreasonably large scores", () => {
    expect(() => normalizeSoccerScore(21n)).toThrow("Score must be between 0 and 20");
  });
});

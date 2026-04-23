import { describe, expect, it } from "bun:test";

import { calculatePredictionPoints } from "./scoring";

describe("calculatePredictionPoints", () => {
  it("gives 3 points for an exact score", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 1,
      }),
    ).toBe(3);
  });

  it("gives 1 point for the correct outcome only", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 3,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 0,
      }),
    ).toBe(1);
  });

  it("gives 0 points for the wrong outcome", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 0,
        actualAway: 1,
      }),
    ).toBe(0);
  });

  it("gives 1 point for the correct away-win outcome", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 0,
        predictedAway: 2,
        actualHome: 1,
        actualAway: 3,
      }),
    ).toBe(1);
  });

  it("gives 1 point for the correct draw outcome", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 2,
        actualHome: 0,
        actualAway: 0,
      }),
    ).toBe(1);
  });
});

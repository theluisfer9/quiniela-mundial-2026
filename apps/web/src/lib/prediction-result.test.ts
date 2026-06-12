import { describe, expect, it } from "bun:test";

import { getPredictionResultSummary } from "./prediction-result";

describe("getPredictionResultSummary", () => {
  it("explains exact score points", () => {
    expect(getPredictionResultSummary({
      actualAway: 1,
      actualHome: 2,
      predictedAway: 1,
      predictedHome: 2,
    })).toEqual({ points: 3, reason: "Marcador exacto" });
  });

  it("explains result plus one exact team score", () => {
    expect(getPredictionResultSummary({
      actualAway: 1,
      actualHome: 2,
      predictedAway: 0,
      predictedHome: 2,
    })).toEqual({ points: 2, reason: "Resultado correcto y un marcador de equipo" });
  });

  it("explains missing predictions", () => {
    expect(getPredictionResultSummary({
      actualAway: 1,
      actualHome: 2,
      predictedAway: null,
      predictedHome: null,
    })).toEqual({ points: 0, reason: "Sin pronóstico guardado" });
  });
});

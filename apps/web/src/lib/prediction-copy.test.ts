import { describe, expect, it } from "bun:test";

import { getPredictionDisplayState, getPredictionInputHint, getPredictionStatusLabel } from "./prediction-copy";

describe("getPredictionStatusLabel", () => {
  it("returns clear labels for active and saved states", () => {
    expect(getPredictionStatusLabel("idle")).toBe("Listo para marcar este partido.");
    expect(getPredictionStatusLabel("saving")).toBe("Guardando tu marcador...");
    expect(getPredictionStatusLabel("saved")).toBe("Marcador guardado.");
    expect(getPredictionStatusLabel("error")).toBe("No pudimos guardar este marcador. Intenta otra vez.");
  });

  it("returns explicit copy when the match is locked", () => {
    expect(getPredictionStatusLabel("locked")).toBe("Pronostico cerrado.");
  });
});

describe("getPredictionInputHint", () => {
  it("keeps score-entry guidance truthful about saving on field exit", () => {
    expect(getPredictionInputHint({ side: "home", state: "idle" })).toBe(
      "Escribe los goles del local y sal del campo para guardar.",
    );
    expect(getPredictionInputHint({ side: "away", state: "idle" })).toBe(
      "Escribe los goles de la visita y sal del campo para guardar.",
    );
  });
});

describe("getPredictionDisplayState", () => {
  it("returns saved when the visible score matches the already-saved value again", () => {
    expect(
      getPredictionDisplayState({
        draftScore: { awayScore: 1, homeScore: 2 },
        isLocked: false,
        savedScore: { awayScore: 1, homeScore: 2 },
        status: "idle",
      }),
    ).toBe("saved");
  });

  it("preserves transient states when the card is still saving or locked", () => {
    expect(
      getPredictionDisplayState({
        draftScore: { awayScore: 1, homeScore: 2 },
        isLocked: false,
        savedScore: { awayScore: 1, homeScore: 2 },
        status: "saving",
      }),
    ).toBe("saving");

    expect(
      getPredictionDisplayState({
        draftScore: { awayScore: 1, homeScore: 2 },
        isLocked: true,
        savedScore: { awayScore: 1, homeScore: 2 },
        status: "saved",
      }),
    ).toBe("locked");
  });
});

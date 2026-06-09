import { describe, expect, it } from "bun:test";

import { getPredictionDisplayState, getPredictionInputHint, getPredictionStatusLabel } from "./prediction-copy";

describe("getPredictionStatusLabel", () => {
  it("returns clear labels for active and saved states", () => {
    expect(getPredictionStatusLabel("idle")).toBe("Pendiente por guardar.");
    expect(getPredictionStatusLabel("saving")).toBe("Guardando tu marcador...");
    expect(getPredictionStatusLabel("saved")).toBe("Marcador guardado.");
    expect(getPredictionStatusLabel("error")).toBe("No pudimos guardar este marcador. Intenta otra vez.");
  });

  it("returns explicit copy when the match is locked", () => {
    expect(getPredictionStatusLabel("locked")).toBe("Partido cerrado.");
  });
});

describe("getPredictionInputHint", () => {
  it("keeps score-entry hints focused on the current input", () => {
    expect(getPredictionInputHint({ side: "home", state: "idle" })).toBe("Goles del equipo local.");
    expect(getPredictionInputHint({ side: "away", state: "idle" })).toBe("Goles del equipo visitante.");
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

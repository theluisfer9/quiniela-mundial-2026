import { describe, expect, it } from "bun:test";

import { getPredictionStatusLabel } from "./prediction-copy";

describe("getPredictionStatusLabel", () => {
  it("returns clear labels for saving lifecycle states", () => {
    expect(getPredictionStatusLabel("saving")).toBe("Guardando pronostico...");
    expect(getPredictionStatusLabel("saved")).toBe("Pronostico guardado");
    expect(getPredictionStatusLabel("error")).toBe("No se pudo guardar. Intenta otra vez.");
  });

  it("returns explicit copy when the match is locked", () => {
    expect(getPredictionStatusLabel("locked")).toBe("Pronostico cerrado: ya no se puede editar desde aqui.");
  });
});

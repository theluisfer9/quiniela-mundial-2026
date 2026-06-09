import { describe, expect, it } from "bun:test";

import {
  INVALID_PIN_MESSAGE,
  LOCKED_PIN_MESSAGE,
  isPinEntrySubmittable,
  isValidPlayerPin,
  normalizePlayerPin,
} from "./pin-entry";

describe("pin-entry", () => {
  it("normalizes display and input PINs with trim and uppercase", () => {
    expect(normalizePlayerPin(" ab9z ")).toBe("AB9Z");
  });

  it("validates exactly four alphanumeric characters", () => {
    expect(isValidPlayerPin("AB12")).toBe(true);
    expect(isValidPlayerPin(" ab12 ")).toBe(true);
    expect(isValidPlayerPin("ABC")).toBe(false);
    expect(isValidPlayerPin("ABCDE")).toBe(false);
    expect(isValidPlayerPin("AB-1")).toBe(false);
  });

  it("provides backend-matching messages for invalid and locked PINs", () => {
    expect(INVALID_PIN_MESSAGE).toBe("PIN no reconocido. Revisa el codigo que te compartieron.");
    expect(LOCKED_PIN_MESSAGE).toBe("Demasiados intentos. Prueba de nuevo en unos minutos.");
  });

  it("exposes a submit enablement helper", () => {
    expect(isPinEntrySubmittable("a1b2")).toBe(true);
    expect(isPinEntrySubmittable("a1b")).toBe(false);
  });
});

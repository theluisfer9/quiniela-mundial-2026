import { describe, expect, it } from "bun:test";

import {
  AUTH_ENTRY_PATH,
  PRIMARY_NAV_ITEMS,
  getHeaderAccountAffordance,
  getHeaderAccountState,
  shouldShowPrimaryNav,
} from "./navigation";

describe("navigation", () => {
  it("defines the main family-friendly destinations in order", () => {
    expect(PRIMARY_NAV_ITEMS).toEqual([
      { to: "/", label: "Inicio" },
      { to: "/pronosticos", label: "Pronósticos" },
    ]);
  });

  it("uses the public home screen as the PIN access entry", () => {
    expect(AUTH_ENTRY_PATH).toBe("/");
  });

  it("derives header player state from the local PIN session only", () => {
    expect(getHeaderAccountState(null)).toBe("needsPin");
    expect(getHeaderAccountState({ sessionToken: "token", displayName: "Ana Perez" })).toBe("storedPlayer");
  });

  it("uses PIN and player copy instead of account/password copy", () => {
    expect(getHeaderAccountAffordance("needsPin")).toEqual({
      eyebrow: "Acceso con PIN",
      label: "Entrar con PIN",
    });

    expect(getHeaderAccountAffordance("storedPlayer", "Ana Perez")).toEqual({
      eyebrow: "Jugador guardado",
      label: "Ana",
    });
  });

  it("shows primary navigation publicly", () => {
    expect(shouldShowPrimaryNav("needsPin")).toBe(true);
    expect(shouldShowPrimaryNav("storedPlayer")).toBe(true);
  });
});

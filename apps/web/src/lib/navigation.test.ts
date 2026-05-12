import { describe, expect, it } from "bun:test";

import {
  AUTH_ENTRY_PATH,
  PRIMARY_NAV_ITEMS,
  getHeaderAccountAffordance,
  getHeaderAccountState,
} from "./navigation";

describe("navigation", () => {
  it("defines the main family-friendly destinations in order", () => {
    expect(PRIMARY_NAV_ITEMS).toEqual([
      { to: "/", label: "Inicio" },
      { to: "/pronosticos", label: "Pronósticos" },
    ]);
  });

  it("keeps dashboard as the auth entry shell", () => {
    expect(AUTH_ENTRY_PATH).toBe("/dashboard");
  });

  it("treats auth loading separately from a signed-out visitor", () => {
    expect(getHeaderAccountState(undefined)).toBe("loading");
    expect(getHeaderAccountState(null)).toBe("signedOut");
    expect(getHeaderAccountState({ name: "Ana" })).toBe("signedIn");
  });

  it("keeps account entry explicit while auth is loading or signed out", () => {
    expect(getHeaderAccountAffordance("loading")).toEqual({
      eyebrow: "Cuenta",
      label: "Cargando acceso",
    });

    expect(getHeaderAccountAffordance("signedOut")).toEqual({
      eyebrow: "Tu cuenta",
      label: "Entrar o crear cuenta",
    });
  });
});

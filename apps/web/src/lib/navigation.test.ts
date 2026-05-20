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

  it("keeps dashboard as the auth entry shell", () => {
    expect(AUTH_ENTRY_PATH).toBe("/dashboard");
  });

  it("treats auth loading separately from a signed-out visitor", () => {
    expect(getHeaderAccountState(undefined)).toBe("loading");
    expect(getHeaderAccountState(undefined, { loadingTimedOut: true })).toBe("signedOut");
    expect(getHeaderAccountState(null)).toBe("signedOut");
    expect(getHeaderAccountState({ name: "Ana" })).toBe("signedIn");
  });

  it("keeps account entry explicit while auth is loading or signed out", () => {
    expect(getHeaderAccountAffordance("loading")).toEqual({
      eyebrow: "Cuenta",
      label: "Revisando sesión",
    });

    expect(getHeaderAccountAffordance("signedOut")).toEqual({
      eyebrow: "Tu cuenta",
      label: "Entrar",
    });
  });

  it("only shows primary navigation for signed-in users", () => {
    expect(shouldShowPrimaryNav("loading")).toBe(false);
    expect(shouldShowPrimaryNav("signedOut")).toBe(false);
    expect(shouldShowPrimaryNav("signedIn")).toBe(true);
  });
});

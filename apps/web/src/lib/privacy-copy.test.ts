import { describe, expect, it } from "bun:test";

import { getPrivacyRevealCopy } from "./privacy-copy";

describe("getPrivacyRevealCopy", () => {
  it("explains the broader reveal rule without implying this route shows other predictions before kickoff", () => {
    expect(getPrivacyRevealCopy({ isLocked: false })).toBe(
      "Tus picks en esta pantalla siguen privados hasta que empiece el partido; la revelacion general ocurre desde ese momento.",
    );
  });

  it("keeps the after-kickoff message truthful for this route", () => {
    expect(getPrivacyRevealCopy({ isLocked: true })).toBe(
      "Este partido ya empezo. Desde aqui ya no puedes editar tu pronostico y esta pantalla no muestra picks de otras personas.",
    );
  });
});

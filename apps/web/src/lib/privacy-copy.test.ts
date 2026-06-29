import { describe, expect, it } from "bun:test";

import { getPrivacyRevealCopy } from "./privacy-copy";

describe("getPrivacyRevealCopy", () => {
  it("explains the broader reveal rule without implying this route shows other predictions before kickoff", () => {
    expect(getPrivacyRevealCopy({ isLocked: false })).toBe(
      "Esta vista muestra solo tus pronósticos. Se mantienen privados hasta que empiece cada partido.",
    );
  });

  it("keeps the after-kickoff message truthful for this route", () => {
    expect(getPrivacyRevealCopy({ isLocked: true })).toBe(
      "Este partido ya empezó. Tu pronóstico queda cerrado y esta vista sigue mostrando solo tus pronósticos.",
    );
  });
});

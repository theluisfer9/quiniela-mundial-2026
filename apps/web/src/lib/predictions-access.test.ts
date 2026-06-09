import { describe, expect, it } from "bun:test";

import { getPredictionsAccessState } from "./predictions-access";

describe("getPredictionsAccessState", () => {
  it("asks for a PIN when there is no stored player session", () => {
    expect(getPredictionsAccessState({ storedSession: null, currentPlayer: undefined })).toEqual({
      state: "needsPin",
    });
  });

  it("labels cached display name as non-authoritative while a stored session is being checked", () => {
    expect(
      getPredictionsAccessState({
        storedSession: { sessionToken: "token-123", displayName: "Luz" },
        currentPlayer: undefined,
      }),
    ).toEqual({ state: "checking", cachedDisplayName: "Luz" });
  });

  it("marks the session invalid when the server rejects it", () => {
    expect(
      getPredictionsAccessState({
        storedSession: { sessionToken: "token-123", displayName: "Luz" },
        currentPlayer: null,
      }),
    ).toEqual({ state: "invalidSession" });
  });

  it("uses the authoritative current player display name when ready", () => {
    expect(
      getPredictionsAccessState({
        storedSession: { sessionToken: "token-123", displayName: "Cached" },
        currentPlayer: { displayName: "Luz Maria" },
      }),
    ).toEqual({ state: "ready", displayName: "Luz Maria" });
  });
});

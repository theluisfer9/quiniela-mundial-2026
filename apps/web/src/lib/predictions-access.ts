import type { StoredPlayerSession } from "./player-session";

type CurrentPlayer = { displayName: string } | null | undefined;

type PredictionsAccessInput = {
  storedSession: StoredPlayerSession | null;
  currentPlayer: CurrentPlayer;
};

export function getPredictionsAccessState({ storedSession, currentPlayer }: PredictionsAccessInput) {
  if (!storedSession) {
    return { state: "needsPin" } as const;
  }

  if (currentPlayer === undefined) {
    return { state: "checking", cachedDisplayName: storedSession.displayName } as const;
  }

  if (currentPlayer === null) {
    return { state: "invalidSession" } as const;
  }

  return { state: "ready", displayName: currentPlayer.displayName } as const;
}

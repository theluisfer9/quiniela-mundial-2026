export type PredictionSaveState = "idle" | "saving" | "saved" | "error" | "locked";

type PredictionScoreValue = {
  homeScore: number | null;
  awayScore: number | null;
};

type PredictionInputSide = "home" | "away";

const PREDICTION_STATUS_LABELS: Record<PredictionSaveState, string> = {
  idle: "Pendiente por guardar.",
  saving: "Guardando tu marcador...",
  saved: "Marcador guardado.",
  error: "No pudimos guardar este marcador. Intenta otra vez.",
  locked: "Partido cerrado.",
};

export function getPredictionStatusLabel(state: PredictionSaveState) {
  return PREDICTION_STATUS_LABELS[state];
}

export function getPredictionInputHint({ side, state }: { side: PredictionInputSide; state: PredictionSaveState }) {
  if (state === "locked") {
    return "Marcador cerrado";
  }

  if (state === "saving") {
    return "Guardando marcador";
  }

  if (state === "error") {
    return "Revisa el marcador y vuelve a guardar.";
  }

  if (state === "saved") {
    return "Marcador guardado. Si lo cambias, vuelve a presionar Guardar.";
  }

  return side === "home" ? "Goles del equipo local." : "Goles del equipo visitante.";
}

export function getPredictionDisplayState({
  draftScore,
  isLocked,
  savedScore,
  status,
}: {
  draftScore: PredictionScoreValue;
  isLocked: boolean;
  savedScore: PredictionScoreValue;
  status: PredictionSaveState;
}) {
  if (isLocked) {
    return "locked";
  }

  if (status === "saving" || status === "error") {
    return status;
  }

  if (hasCompleteScore(savedScore) && draftMatchesSavedScore(draftScore, savedScore)) {
    return "saved";
  }

  return status;
}

function hasCompleteScore(score: PredictionScoreValue) {
  return score.homeScore !== null && score.awayScore !== null;
}

function draftMatchesSavedScore(draftScore: PredictionScoreValue, savedScore: PredictionScoreValue) {
  return draftScore.homeScore === savedScore.homeScore && draftScore.awayScore === savedScore.awayScore;
}

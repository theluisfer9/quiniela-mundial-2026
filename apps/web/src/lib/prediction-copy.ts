export type PredictionSaveState = "idle" | "saving" | "saved" | "error" | "locked";

type PredictionScoreValue = {
  homeScore: number | null;
  awayScore: number | null;
};

type PredictionInputSide = "home" | "away";

const PREDICTION_STATUS_LABELS: Record<PredictionSaveState, string> = {
  idle: "Listo para marcar este partido.",
  saving: "Guardando tu marcador...",
  saved: "Marcador guardado.",
  error: "No pudimos guardar este marcador. Intenta otra vez.",
  locked: "Pronostico cerrado.",
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
    return "Revisa el marcador y sal del campo para reintentar.";
  }

  if (state === "saved") {
    return "Marcador guardado. Si lo cambias, sal del campo para volver a guardar.";
  }

  return side === "home"
    ? "Escribe los goles del local y sal del campo para guardar."
    : "Escribe los goles de la visita y sal del campo para guardar.";
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

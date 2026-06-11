import type { AppCopy } from "@/lib/i18n";

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

function getPredictionStatusLabels(t?: AppCopy): Record<PredictionSaveState, string> {
  if (!t) {
    return PREDICTION_STATUS_LABELS;
  }

  return {
    idle: t.predictionStatus.idle,
    saving: t.predictionStatus.saving,
    saved: t.predictionStatus.saved,
    error: t.predictionStatus.error,
    locked: t.predictionStatus.locked,
  };
}

export function getPredictionStatusLabel(state: PredictionSaveState, t?: AppCopy) {
  const labels = getPredictionStatusLabels(t);
  return labels[state];
}

export function getPredictionInputHint({ side, state, t }: { side: PredictionInputSide; state: PredictionSaveState; t?: AppCopy }) {
  if (state === "locked") {
    return t?.predictionStatus.lockedHint ?? "Marcador cerrado";
  }

  if (state === "saving") {
    return t?.predictionStatus.savingHint ?? "Guardando marcador";
  }

  if (state === "error") {
    return t?.predictionStatus.errorHint ?? "Revisa el marcador y vuelve a guardar.";
  }

  if (state === "saved") {
    return t?.predictionStatus.savedHint ?? "Marcador guardado. Si lo cambias, vuelve a presionar Guardar.";
  }

  return side === "home"
    ? t?.predictionStatus.homeHint ?? "Goles del equipo local."
    : t?.predictionStatus.awayHint ?? "Goles del equipo visitante.";
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

type PredictionResultInput = {
  actualHome: number;
  actualAway: number;
  predictedHome: number | null;
  predictedAway: number | null;
  labels?: PredictionResultLabels;
};

export type PredictionResultLabels = {
  exactScore: string;
  resultAndTeamScore: string;
  correctResult: string;
  oneTeamScore: string;
  noPoints: string;
  noPrediction: string;
};

export type PredictionResultSummary = {
  points: number;
  reason: string;
};

function outcome(home: number, away: number) {
  if (home > away) {
    return "home";
  }

  if (home < away) {
    return "away";
  }

  return "draw";
}

const DEFAULT_LABELS: PredictionResultLabels = {
  correctResult: "Resultado correcto",
  exactScore: "Marcador exacto",
  noPoints: "No sumó puntos",
  noPrediction: "Sin pronóstico guardado",
  oneTeamScore: "Un marcador de equipo",
  resultAndTeamScore: "Resultado correcto y un marcador de equipo",
};

export function getPredictionResultSummary({
  actualAway,
  actualHome,
  labels = DEFAULT_LABELS,
  predictedAway,
  predictedHome,
}: PredictionResultInput): PredictionResultSummary {
  if (predictedHome === null || predictedAway === null) {
    return { points: 0, reason: labels.noPrediction };
  }

  const exactHome = predictedHome === actualHome;
  const exactAway = predictedAway === actualAway;
  const correctOutcome = outcome(predictedHome, predictedAway) === outcome(actualHome, actualAway);

  if (exactHome && exactAway) {
    return { points: 3, reason: labels.exactScore };
  }

  if (correctOutcome && (exactHome || exactAway)) {
    return { points: 2, reason: labels.resultAndTeamScore };
  }

  if (correctOutcome) {
    return { points: 1, reason: labels.correctResult };
  }

  if (exactHome || exactAway) {
    return { points: 1, reason: labels.oneTeamScore };
  }

  return { points: 0, reason: labels.noPoints };
}

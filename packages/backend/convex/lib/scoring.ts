type CalculatePredictionPointsArgs = {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
};

const getOutcome = (homeScore: number, awayScore: number) => {
  if (homeScore > awayScore) {
    return "home";
  }

  if (homeScore < awayScore) {
    return "away";
  }

  return "draw";
};

export function calculatePredictionPoints({
  predictedHome,
  predictedAway,
  actualHome,
  actualAway,
}: CalculatePredictionPointsArgs) {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 3;
  }

  if (getOutcome(predictedHome, predictedAway) === getOutcome(actualHome, actualAway)) {
    return 1;
  }

  return 0;
}

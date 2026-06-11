type CalculatePredictionPointsArgs = {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
};

type StandingsProfile = {
  playerId: string;
  name: string;
};

type StandingsMatch = {
  id: string;
  homeScore: number;
  awayScore: number;
};

type StandingsPrediction = {
  playerId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export type StandingsRow = {
  rank: number;
  name: string;
  points: number;
  rankDelta: -1 | 0 | 1;
  isCurrentUser: boolean;
};

type BuildStandingsRowsArgs = {
  currentPlayerId?: string | null;
  profiles: StandingsProfile[];
  matches: StandingsMatch[];
  predictions: StandingsPrediction[];
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

  const hasCorrectOutcome = getOutcome(predictedHome, predictedAway) === getOutcome(actualHome, actualAway);
  const hasAnyExactTeamScore = predictedHome === actualHome || predictedAway === actualAway;

  if (hasCorrectOutcome && hasAnyExactTeamScore) {
    return 2;
  }

  if (hasCorrectOutcome || hasAnyExactTeamScore) {
    return 1;
  }

  return 0;
}

function calculatePointsByPlayer(
  profiles: StandingsProfile[],
  matches: StandingsMatch[],
  predictions: StandingsPrediction[],
) {
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const pointsByPlayerId = new Map(profiles.map((profile) => [profile.playerId, 0]));

  for (const prediction of predictions) {
    const match = matchById.get(prediction.matchId);
    if (!match || !pointsByPlayerId.has(prediction.playerId)) {
      continue;
    }

    pointsByPlayerId.set(
      prediction.playerId,
      pointsByPlayerId.get(prediction.playerId)! +
        calculatePredictionPoints({
          predictedHome: prediction.homeScore,
          predictedAway: prediction.awayScore,
          actualHome: match.homeScore,
          actualAway: match.awayScore,
        }),
    );
  }

  return pointsByPlayerId;
}

function rankProfiles(profiles: StandingsProfile[], pointsByPlayerId: Map<string, number>) {
  return profiles
    .map((profile) => ({
      playerId: profile.playerId,
      name: profile.name,
      points: pointsByPlayerId.get(profile.playerId) ?? 0,
    }))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) {
        return byName;
      }

      return left.playerId.localeCompare(right.playerId);
    });
}

export function buildStandingsRows({
  currentPlayerId = null,
  profiles,
  matches,
  predictions,
}: BuildStandingsRowsArgs): StandingsRow[] {
  const currentRanked = rankProfiles(
    profiles,
    calculatePointsByPlayer(profiles, matches, predictions),
  );
  const previousRanked = rankProfiles(
    profiles,
    calculatePointsByPlayer(
      profiles,
      matches.slice(0, -1),
      predictions,
    ),
  );
  const previousRanks = new Map(
    previousRanked.map((profile, index) => [profile.playerId, index + 1]),
  );

  return currentRanked.map((profile, index) => {
    const rank = index + 1;
    const previousRank = previousRanks.get(profile.playerId);
    const rankDelta =
      previousRank === undefined || previousRank === rank
        ? 0
        : previousRank > rank
          ? 1
          : -1;

    return {
      rank,
      name: profile.name,
      points: profile.points,
      rankDelta,
      isCurrentUser: currentPlayerId !== null && profile.playerId === currentPlayerId,
    };
  });
}

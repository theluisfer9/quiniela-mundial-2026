type CalculatePredictionPointsArgs = {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
};

type StandingsProfile = {
  userId: string;
  name: string;
};

type StandingsMatch = {
  id: string;
  homeScore: number;
  awayScore: number;
};

type StandingsPrediction = {
  userId: string;
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
  currentUserId: string;
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

  if (getOutcome(predictedHome, predictedAway) === getOutcome(actualHome, actualAway)) {
    return 1;
  }

  return 0;
}

function calculatePointsByUser(
  profiles: StandingsProfile[],
  matches: StandingsMatch[],
  predictions: StandingsPrediction[],
) {
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const pointsByUserId = new Map(profiles.map((profile) => [profile.userId, 0]));

  for (const prediction of predictions) {
    const match = matchById.get(prediction.matchId);
    if (!match || !pointsByUserId.has(prediction.userId)) {
      continue;
    }

    pointsByUserId.set(
      prediction.userId,
      pointsByUserId.get(prediction.userId)! +
        calculatePredictionPoints({
          predictedHome: prediction.homeScore,
          predictedAway: prediction.awayScore,
          actualHome: match.homeScore,
          actualAway: match.awayScore,
        }),
    );
  }

  return pointsByUserId;
}

function rankProfiles(profiles: StandingsProfile[], pointsByUserId: Map<string, number>) {
  return profiles
    .map((profile) => ({
      userId: profile.userId,
      name: profile.name,
      points: pointsByUserId.get(profile.userId) ?? 0,
    }))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) {
        return byName;
      }

      return left.userId.localeCompare(right.userId);
    });
}

export function buildStandingsRows({
  currentUserId,
  profiles,
  matches,
  predictions,
}: BuildStandingsRowsArgs): StandingsRow[] {
  const currentRanked = rankProfiles(
    profiles,
    calculatePointsByUser(profiles, matches, predictions),
  );
  const previousRanked = rankProfiles(
    profiles,
    calculatePointsByUser(
      profiles,
      matches.slice(0, -1),
      predictions,
    ),
  );
  const previousRanks = new Map(
    previousRanked.map((profile, index) => [profile.userId, index + 1]),
  );

  return currentRanked.map((profile, index) => {
    const rank = index + 1;
    const previousRank = previousRanks.get(profile.userId);
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
      isCurrentUser: profile.userId === currentUserId,
    };
  });
}

import type { PublicDashboardMatch } from "./public-dashboard";

export type DashboardAnalyticsRow = {
  rank: number;
  name: string;
  points: number;
  exactScoreCount: number;
  outcomeHitCount: number;
  predictionCount: number;
  precision: number;
  leaderGap: number;
  rankDelta: -1 | 0 | 1;
  currentStreak: number;
  longestStreak: number;
  nearMissCount: number;
  drawPredictionCount: number;
  contrarianHitCount: number;
  mostCommonScore: string | null;
};

export type DashboardAwardCard = {
  label: string;
  name: string;
  value: string;
  description: string;
};

export type DashboardConsensusMatch = {
  matchId: string;
  kickoffAt: number;
  stageLabel: string;
  homeTeamName: string;
  awayTeamName: string;
  homeCount: number;
  drawCount: number;
  awayCount: number;
  totalCount: number;
};

export type DashboardAnalyticsData = {
  rows: DashboardAnalyticsRow[];
  awardCards: DashboardAwardCard[];
  consensusMatches: DashboardConsensusMatch[];
};

export type DashboardSummaryMatchData = {
  liveMatches: PublicDashboardMatch[];
  upcomingMatches: Array<{
    kickoffAt: number;
    homeTeam: { code?: string; name: string };
    awayTeam: { code?: string; name: string };
  }>;
};

function createNextKickoffFormatter(locale = "es-MX") {
  return new Intl.DateTimeFormat(locale, {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  });
}

export function getDashboardSummaryCards(
  data: DashboardAnalyticsData | undefined,
  matches?: DashboardSummaryMatchData,
  options: {
    labels?: {
      leader: string;
      mostExact: string;
      bestStreak: string;
      nextDeadline: string;
      undefined: string;
      noClosedMatches: string;
      markers: (count: number) => string;
      points: (count: number) => string;
      consecutiveHits: (count: number) => string;
      noScheduledMatches: string;
    };
    locale?: string;
  } = {},
) {
  const labels = options.labels ?? {
    leader: "Lider",
    mostExact: "Mas exactos",
    bestStreak: "Mejor racha",
    nextDeadline: "Proximo cierre",
    undefined: "Por definir",
    noClosedMatches: "Sin partidos cerrados",
    markers: (count: number) => `${count} marcadores`,
    points: (count: number) => `${count} puntos`,
    consecutiveHits: (count: number) => `${count} aciertos seguidos`,
    noScheduledMatches: "Sin partidos programados",
  };
  const nextKickoffFormatter = createNextKickoffFormatter(options.locale);
  const leader = data?.rows.find((row) => row.points > 0) ?? null;
  const nextMatch = matches?.upcomingMatches[0] ?? null;
  const bestExact = data?.rows.reduce<DashboardAnalyticsRow | null>((current, row) => {
    if (!current || row.exactScoreCount > current.exactScoreCount) {
      return row;
    }
    return current;
  }, null);
  const bestStreak = data?.rows.reduce<DashboardAnalyticsRow | null>((current, row) => {
    if (!current || row.longestStreak > current.longestStreak) {
      return row;
    }
    return current;
  }, null);
  const hasBestExact = (bestExact?.exactScoreCount ?? 0) > 0;
  const hasBestStreak = (bestStreak?.longestStreak ?? 0) > 0;

  return [
    { label: labels.leader, value: leader?.name ?? labels.undefined, detail: leader ? labels.points(leader.points) : labels.noClosedMatches },
    { label: labels.mostExact, value: hasBestExact ? bestExact!.name : labels.undefined, detail: labels.markers(bestExact?.exactScoreCount ?? 0) },
    { label: labels.bestStreak, value: hasBestStreak ? bestStreak!.name : labels.undefined, detail: labels.consecutiveHits(bestStreak?.longestStreak ?? 0) },
    {
      label: labels.nextDeadline,
      value: nextMatch ? nextKickoffFormatter.format(nextMatch.kickoffAt) : labels.undefined,
      detail: nextMatch ? `${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name}` : labels.noScheduledMatches,
    },
  ];
}

export function formatRankDelta(
  delta: -1 | 0 | 1,
  labels = {
    up: "Sube",
    down: "Baja",
    same: "Igual",
  },
) {
  if (delta > 0) {
    return labels.up;
  }

  if (delta < 0) {
    return labels.down;
  }

  return labels.same;
}

export function formatStreak(
  streak: number,
  labels = {
    hits: (count: number) => `${count} acertados`,
    misses: (count: number) => `${count} fallados`,
    none: "Sin racha",
  },
) {
  if (streak > 0) {
    return labels.hits(streak);
  }

  if (streak < 0) {
    return labels.misses(Math.abs(streak));
  }

  return labels.none;
}

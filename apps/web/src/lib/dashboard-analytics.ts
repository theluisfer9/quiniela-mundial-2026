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
  upcomingMatches: Array<{
    kickoffAt: number;
    homeTeam: { name: string };
    awayTeam: { name: string };
  }>;
};

const nextKickoffFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
});

export function getDashboardSummaryCards(data: DashboardAnalyticsData | undefined, matches?: DashboardSummaryMatchData) {
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
    { label: "Lider", value: leader?.name ?? "Por definir", detail: leader ? `${leader.points} puntos` : "Sin partidos cerrados" },
    { label: "Mas exactos", value: hasBestExact ? bestExact!.name : "Por definir", detail: `${bestExact?.exactScoreCount ?? 0} marcadores` },
    { label: "Mejor racha", value: hasBestStreak ? bestStreak!.name : "Por definir", detail: `${bestStreak?.longestStreak ?? 0} aciertos seguidos` },
    {
      label: "Proximo cierre",
      value: nextMatch ? nextKickoffFormatter.format(nextMatch.kickoffAt) : "Por definir",
      detail: nextMatch ? `${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name}` : "Sin partidos programados",
    },
  ];
}

export function formatRankDelta(delta: -1 | 0 | 1) {
  if (delta > 0) {
    return "Sube";
  }

  if (delta < 0) {
    return "Baja";
  }

  return "Igual";
}

export function formatStreak(streak: number) {
  if (streak > 0) {
    return `${streak} acertados`;
  }

  if (streak < 0) {
    return `${Math.abs(streak)} fallados`;
  }

  return "Sin racha";
}

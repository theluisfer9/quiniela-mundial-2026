import type { HomeStandingsRow, HomeTeamSummary } from "./home-data";

export type PublicDashboardMatch = {
  matchId: string;
  kickoffAt: number;
  stageLabel: string;
  status: "scheduled" | "live" | "finished";
  homeTeam: HomeTeamSummary;
  awayTeam: HomeTeamSummary;
  homeScore?: number;
  awayScore?: number;
};

export type PublicDashboardMatchesData = {
  liveMatches?: PublicDashboardMatch[];
  todayMatches?: PublicDashboardMatch[];
  upcomingMatches?: PublicDashboardMatch[];
  finishedMatches?: PublicDashboardMatch[];
  stats: {
    leaderName: string | null;
    finishedMatchCount: number;
    totalPredictionCountForFinishedMatches: number;
    bestExactScoreCount: number;
  };
};

export type PublicDashboardStatCard = {
  label: string;
  value: string;
  detail: string;
};

export type PublicDashboardHeroMetrics = {
  finishedMatchCount: number;
};

export type PublicDashboardPlayerMetric = {
  name: string;
  exactScoreCount: number;
  currentStreak: number;
};

export type PublicDashboardViewModel = {
  state: "loading" | "empty" | "ready";
  liveMatches: PublicDashboardMatch[];
  todayMatches: PublicDashboardMatch[];
  upcomingMatches: PublicDashboardMatch[];
  finishedMatches: PublicDashboardMatch[];
  standings: HomeStandingsRow[];
  statCards: PublicDashboardStatCard[];
  heroMetrics: PublicDashboardHeroMetrics;
  totalVisibleMatches: number;
};

export type PublicDashboardMatchPage = {
  matches: PublicDashboardMatch[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PublicHomeMatchSections = {
  todayMatches: PublicDashboardMatch[];
  upcomingMatches: PublicDashboardMatch[];
};

type DerivePublicDashboardInput = {
  matches: PublicDashboardMatchesData | undefined;
  standings: HomeStandingsRow[] | undefined;
  labels?: {
    leader: string;
    myPosition: string;
    perfectHits: string;
    streak: string;
    undefined: string;
    enterWithPin: string;
    exactScores: string;
    consecutiveHits: string;
    noStreak: string;
    inLead: string;
    leaderPoints: (points: number) => string;
    leaderGap: (points: number) => string;
  };
  currentPlayerName?: string | null;
  playerMetrics?: PublicDashboardPlayerMetric[];
};

const EMPTY_STATS: PublicDashboardMatchesData["stats"] = {
  leaderName: null,
  finishedMatchCount: 0,
  totalPredictionCountForFinishedMatches: 0,
  bestExactScoreCount: 0,
};

function buildStatCards({
  labels = {
    leader: "Lider",
    myPosition: "Mi posicion",
    perfectHits: "Aciertos perfectos",
    streak: "Racha",
    undefined: "Por definir",
    enterWithPin: "Entra con tu PIN",
    exactScores: "Marcadores exactos",
    consecutiveHits: "Aciertos consecutivos",
    noStreak: "Sin racha activa",
    inLead: "Estas en la punta",
    leaderPoints: (points: number) => `🏆 ${points} pts`,
    leaderGap: (points: number) => `A ${points} ${points === 1 ? "punto" : "puntos"} del lider`,
  },
  currentPlayerName,
  playerMetrics = [],
  standings,
}: {
  labels?: NonNullable<DerivePublicDashboardInput["labels"]>;
  currentPlayerName?: string | null;
  playerMetrics?: PublicDashboardPlayerMetric[];
  standings: HomeStandingsRow[];
}): PublicDashboardStatCard[] {
  const leader = standings[0];
  const currentPlayer = currentPlayerName
    ? standings.find((row) => row.name === currentPlayerName) ?? null
    : null;
  const currentMetrics = currentPlayerName
    ? playerMetrics.find((row) => row.name === currentPlayerName) ?? null
    : null;
  const leaderGap = leader && currentPlayer ? leader.points - currentPlayer.points : null;
  const currentStreak = currentMetrics?.currentStreak ?? 0;

  return [
    {
      label: labels.leader,
      value: leader && leader.points > 0 ? leader.name : labels.undefined,
      detail: leader ? labels.leaderPoints(leader.points) : labels.enterWithPin,
    },
    {
      label: labels.myPosition,
      value: currentPlayer ? `#${currentPlayer.rank}` : "#-",
      detail: leaderGap === 0 ? labels.inLead : leaderGap !== null ? labels.leaderGap(leaderGap) : labels.enterWithPin,
    },
    {
      label: labels.perfectHits,
      value: String(currentMetrics?.exactScoreCount ?? 0),
      detail: labels.exactScores,
    },
    {
      label: labels.streak,
      value: currentStreak > 0 ? `🔥 ${currentStreak}` : "0",
      detail: currentStreak > 0 ? labels.consecutiveHits : labels.noStreak,
    },
  ];
}

function toPublicStandingsRows(standings: HomeStandingsRow[]) {
  return standings.map((row) => ({
    ...row,
    isCurrentUser: false,
  }));
}

export function paginatePublicDashboardMatches(
  matches: PublicDashboardMatch[],
  { page, pageSize }: { page: number; pageSize: number },
): PublicDashboardMatchPage {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(matches.length / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const startIndex = (safePage - 1) * safePageSize;

  return {
    matches: matches.slice(startIndex, startIndex + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    pageCount,
    totalCount: matches.length,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < pageCount,
  };
}

export function getPublicHomeMatchSections(dashboard: PublicDashboardViewModel): PublicHomeMatchSections {
  const nextDayKey = dashboard.upcomingMatches[0] ? getGuatemalaDayKey(dashboard.upcomingMatches[0].kickoffAt) : null;

  return {
    todayMatches: dashboard.todayMatches.filter((match) => match.status !== "live"),
    upcomingMatches: nextDayKey === null
      ? []
      : dashboard.upcomingMatches.filter((match) => getGuatemalaDayKey(match.kickoffAt) === nextDayKey),
  };
}

function getGuatemalaDayKey(timestamp: number) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Guatemala",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function derivePublicDashboardViewModel({
  currentPlayerName,
  labels,
  matches,
  playerMetrics,
  standings,
}: DerivePublicDashboardInput): PublicDashboardViewModel {
  if (!matches || !standings) {
    return {
      state: "loading",
      liveMatches: [],
      todayMatches: [],
      upcomingMatches: [],
      finishedMatches: [],
      standings: [],
      statCards: buildStatCards({
        currentPlayerName,
        labels,
        playerMetrics,
        standings: [],
      }),
      heroMetrics: { finishedMatchCount: EMPTY_STATS.finishedMatchCount },
      totalVisibleMatches: 0,
    };
  }

  const liveMatches = matches.liveMatches ?? [];
  const todayMatches = matches.todayMatches ?? [];
  const upcomingMatches = matches.upcomingMatches ?? [];
  const finishedMatches = matches.finishedMatches ?? [];
  const publicStandings = toPublicStandingsRows(standings);
  const totalVisibleMatches = todayMatches.length + upcomingMatches.length + finishedMatches.length;
  const hasDashboardData = totalVisibleMatches > 0 || publicStandings.length > 0;

  return {
    state: hasDashboardData ? "ready" : "empty",
    liveMatches,
    todayMatches,
    upcomingMatches,
    finishedMatches,
    standings: publicStandings,
    statCards: buildStatCards({
      currentPlayerName,
      labels,
      playerMetrics,
      standings: publicStandings,
    }),
    heroMetrics: { finishedMatchCount: matches.stats.finishedMatchCount },
    totalVisibleMatches,
  };
}

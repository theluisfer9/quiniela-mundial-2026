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
};

export type PublicDashboardViewModel = {
  state: "loading" | "empty" | "ready";
  liveMatches: PublicDashboardMatch[];
  todayMatches: PublicDashboardMatch[];
  upcomingMatches: PublicDashboardMatch[];
  finishedMatches: PublicDashboardMatch[];
  standings: HomeStandingsRow[];
  statCards: PublicDashboardStatCard[];
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

type DerivePublicDashboardInput = {
  matches: PublicDashboardMatchesData | undefined;
  standings: HomeStandingsRow[] | undefined;
  labels?: {
    leader: string;
    leaderPoints: string;
    today: string;
    finished: string;
    undefined: string;
  };
};

const EMPTY_STATS: PublicDashboardMatchesData["stats"] = {
  leaderName: null,
  finishedMatchCount: 0,
  totalPredictionCountForFinishedMatches: 0,
  bestExactScoreCount: 0,
};

function buildStatCards({
  finishedMatchCount,
  labels = {
    leader: "Lider",
    leaderPoints: "Puntos lider",
    today: "Hoy",
    finished: "Cerrados",
    undefined: "Por definir",
  },
  standings,
  todayMatchCount,
}: {
  finishedMatchCount: number;
  labels?: NonNullable<DerivePublicDashboardInput["labels"]>;
  standings: HomeStandingsRow[];
  todayMatchCount: number;
}): PublicDashboardStatCard[] {
  const leader = standings[0];

  return [
    { label: labels.leader, value: leader && leader.points > 0 ? leader.name : labels.undefined },
    { label: labels.leaderPoints, value: leader ? String(leader.points) : "0" },
    { label: labels.today, value: String(todayMatchCount) },
    { label: labels.finished, value: String(finishedMatchCount) },
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

export function derivePublicDashboardViewModel({
  labels,
  matches,
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
        finishedMatchCount: EMPTY_STATS.finishedMatchCount,
        labels,
        standings: [],
        todayMatchCount: 0,
      }),
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
      finishedMatchCount: matches.stats.finishedMatchCount,
      labels,
      standings: publicStandings,
      todayMatchCount: todayMatches.length,
    }),
    totalVisibleMatches,
  };
}

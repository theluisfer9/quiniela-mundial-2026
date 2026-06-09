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
  todayMatches: PublicDashboardMatch[];
  upcomingMatches: PublicDashboardMatch[];
  finishedMatches: PublicDashboardMatch[];
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
  todayMatches: PublicDashboardMatch[];
  upcomingMatches: PublicDashboardMatch[];
  finishedMatches: PublicDashboardMatch[];
  standings: HomeStandingsRow[];
  statCards: PublicDashboardStatCard[];
  totalVisibleMatches: number;
};

type DerivePublicDashboardInput = {
  matches: PublicDashboardMatchesData | undefined;
  standings: HomeStandingsRow[] | undefined;
};

const EMPTY_STATS: PublicDashboardMatchesData["stats"] = {
  leaderName: null,
  finishedMatchCount: 0,
  totalPredictionCountForFinishedMatches: 0,
  bestExactScoreCount: 0,
};

function buildStatCards(stats: PublicDashboardMatchesData["stats"]): PublicDashboardStatCard[] {
  return [
    { label: "Lider", value: stats.leaderName ?? "Sin lider" },
    { label: "Partidos cerrados", value: String(stats.finishedMatchCount) },
    { label: "Pronosticos contados", value: String(stats.totalPredictionCountForFinishedMatches) },
    { label: "Mejor exactos", value: String(stats.bestExactScoreCount) },
  ];
}

function toPublicStandingsRows(standings: HomeStandingsRow[]) {
  return standings.map((row) => ({
    ...row,
    isCurrentUser: false,
  }));
}

export function derivePublicDashboardViewModel({
  matches,
  standings,
}: DerivePublicDashboardInput): PublicDashboardViewModel {
  if (!matches || !standings) {
    return {
      state: "loading",
      todayMatches: [],
      upcomingMatches: [],
      finishedMatches: [],
      standings: [],
      statCards: buildStatCards(EMPTY_STATS),
      totalVisibleMatches: 0,
    };
  }

  const publicStandings = toPublicStandingsRows(standings);
  const totalVisibleMatches =
    matches.todayMatches.length + matches.upcomingMatches.length + matches.finishedMatches.length;
  const hasDashboardData = totalVisibleMatches > 0 || publicStandings.length > 0;

  return {
    state: hasDashboardData ? "ready" : "empty",
    todayMatches: matches.todayMatches,
    upcomingMatches: matches.upcomingMatches,
    finishedMatches: matches.finishedMatches,
    standings: publicStandings,
    statCards: buildStatCards(matches.stats),
    totalVisibleMatches,
  };
}

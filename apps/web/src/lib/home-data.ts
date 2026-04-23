export type HomeStandingsRow = {
  rank: number;
  name: string;
  points: number;
  rankDelta: -1 | 0 | 1;
  isCurrentUser: boolean;
};

export type HomeTeamSummary = {
  id: string;
  code: string;
  name: string;
  flagEmoji?: string;
};

export type HomeMatchSummary = {
  matchId: string;
  kickoffAt: number;
  stageLabel: string;
  homeTeam: HomeTeamSummary;
  awayTeam: HomeTeamSummary;
  hasPrediction: boolean;
};

export type HomeMatchesData = {
  upcomingMatches: HomeMatchSummary[];
  pendingCount: number;
  nextKickoff: {
    kickoffAt: number;
    matchCount: number;
  } | null;
};

export type HomeCurrentUser = {
  name?: string | null;
  email?: string | null;
} | null;

type DeriveHomeViewModelInput = {
  currentUser: HomeCurrentUser;
  standings: HomeStandingsRow[];
  matches: HomeMatchesData;
};

export type HomeViewModel = {
  state: "empty" | "pending" | "upToDate";
  ctaTone: "urgent" | "calm";
  currentUserName: string;
  currentUserStanding: HomeStandingsRow | null;
  standings: HomeStandingsRow[];
  upcomingMatches: HomeMatchSummary[];
  nextKickoff: HomeMatchesData["nextKickoff"];
  pendingCount: number;
  predictedCount: number;
};

export type PredictionEntry = {
  href: string;
  label: string;
};

const FALLBACK_NAME = "participante";

function getCurrentUserName(currentUser: HomeCurrentUser) {
  const name = currentUser?.name?.trim();
  return name ? name : FALLBACK_NAME;
}

export function deriveHomeViewModel({ currentUser, standings, matches }: DeriveHomeViewModelInput): HomeViewModel {
  const currentUserStanding = standings.find((row) => row.isCurrentUser) ?? null;
  const hasTournamentData = standings.length > 0 || matches.upcomingMatches.length > 0 || matches.nextKickoff !== null;

  let state: HomeViewModel["state"] = "upToDate";
  if (!hasTournamentData) {
    state = "empty";
  } else if (matches.pendingCount > 0) {
    state = "pending";
  }

  return {
    state,
    ctaTone: matches.pendingCount > 0 ? "urgent" : "calm",
    currentUserName: getCurrentUserName(currentUser),
    currentUserStanding,
    standings,
    upcomingMatches: matches.upcomingMatches,
    nextKickoff: matches.nextKickoff,
    pendingCount: matches.pendingCount,
    predictedCount: matches.upcomingMatches.filter((match) => match.hasPrediction).length,
  };
}

export function buildPredictionEntry(match?: HomeMatchSummary): PredictionEntry {
  if (!match) {
    return {
      href: "/pronosticos",
      label: "Ir a pronosticos",
    };
  }

  return {
    href: `/pronosticos?match=${match.matchId}`,
    label: match.hasPrediction ? "Continuar pronostico" : "Empezar pronostico",
  };
}

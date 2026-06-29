import type { HomeTeamSummary } from "./home-data";

export type CalendarTeamSummary = HomeTeamSummary & {
  groupCode?: string;
  worldRanking?: number;
};

export type CalendarMatch = {
  matchId: string;
  kickoffAt: number;
  stageLabel: string;
  groupCode: string | null;
  matchNumber?: number;
  venue?: string;
  status: "scheduled" | "live" | "finished";
  homeTeam: CalendarTeamSummary;
  awayTeam: CalendarTeamSummary;
  homeScore?: number;
  awayScore?: number;
};

export type CalendarDaySection = {
  dayKey: string;
  kickoffAt: number;
  matches: CalendarMatch[];
};

export type GroupStandingRow = {
  teamCode: string;
  teamName: string;
  flagEmoji?: string;
  groupCode: string;
  worldRanking?: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type GroupStanding = {
  groupCode: string;
  rows: GroupStandingRow[];
};

export function getSelectedCalendarDaySection(sections: CalendarDaySection[], selectedDayKey: string | null) {
  return sections.find((section) => section.dayKey === selectedDayKey) ?? sections[0] ?? null;
}

export function getDefaultCalendarDayKey(sections: CalendarDaySection[], now = Date.now()) {
  const todayKey = getGuatemalaDayKey(now);
  return sections.some((section) => section.dayKey === todayKey) ? todayKey : (sections[0]?.dayKey ?? null);
}

export function getSelectedGroupStanding(groups: GroupStanding[], selectedGroupCode: string | null) {
  return groups.find((group) => group.groupCode === selectedGroupCode) ?? groups[0] ?? null;
}

function getGuatemalaDayKey(timestamp: number) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Guatemala",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function buildCalendarDaySections(matches: CalendarMatch[]): CalendarDaySection[] {
  const sortedMatches = [...matches].sort((left, right) => left.kickoffAt - right.kickoffAt);
  const sectionByDay = new Map<string, CalendarDaySection>();

  for (const match of sortedMatches) {
    const dayKey = getGuatemalaDayKey(match.kickoffAt);
    const section = sectionByDay.get(dayKey) ?? { dayKey, kickoffAt: match.kickoffAt, matches: [] };
    section.matches.push(match);
    section.kickoffAt = Math.min(section.kickoffAt, match.kickoffAt);
    sectionByDay.set(dayKey, section);
  }

  return [...sectionByDay.values()].sort((left, right) => left.kickoffAt - right.kickoffAt);
}

function getGroupCode(match: CalendarMatch) {
  return match.groupCode ?? match.homeTeam.groupCode ?? match.awayTeam.groupCode;
}

function ensureTeam(rowsByCode: Map<string, GroupStandingRow>, team: CalendarTeamSummary) {
  const existing = rowsByCode.get(team.code);
  if (existing) {
    return existing;
  }

  const row: GroupStandingRow = {
    teamCode: team.code,
    teamName: team.name,
    flagEmoji: team.flagEmoji,
    groupCode: team.groupCode ?? "?",
    worldRanking: team.worldRanking,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
  rowsByCode.set(team.code, row);
  return row;
}

export function buildGroupStandings(matches: CalendarMatch[]): GroupStanding[] {
  const groups = new Map<string, Map<string, GroupStandingRow>>();

  for (const match of matches) {
    if ((match.matchNumber ?? 0) >= 73) {
      continue;
    }

    const groupCode = getGroupCode(match);
    if (!groupCode) {
      continue;
    }
    const rowsByCode = groups.get(groupCode) ?? new Map<string, GroupStandingRow>();
    const homeRow = ensureTeam(rowsByCode, match.homeTeam);
    const awayRow = ensureTeam(rowsByCode, match.awayTeam);
    groups.set(groupCode, rowsByCode);

    if ((match.status !== "live" && match.status !== "finished") || match.homeScore === undefined || match.awayScore === undefined) {
      continue;
    }

    homeRow.played += 1;
    awayRow.played += 1;
    homeRow.goalsFor += match.homeScore;
    homeRow.goalsAgainst += match.awayScore;
    awayRow.goalsFor += match.awayScore;
    awayRow.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      homeRow.won += 1;
      homeRow.points += 3;
      awayRow.lost += 1;
    } else if (match.homeScore < match.awayScore) {
      awayRow.won += 1;
      awayRow.points += 3;
      homeRow.lost += 1;
    } else {
      homeRow.drawn += 1;
      awayRow.drawn += 1;
      homeRow.points += 1;
      awayRow.points += 1;
    }

    homeRow.goalDifference = homeRow.goalsFor - homeRow.goalsAgainst;
    awayRow.goalDifference = awayRow.goalsFor - awayRow.goalsAgainst;
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([groupCode, rowsByCode]) => ({
      groupCode,
      rows: [...rowsByCode.values()].sort((left, right) =>
        right.points - left.points ||
        right.goalDifference - left.goalDifference ||
        right.goalsFor - left.goalsFor ||
        (left.worldRanking ?? Number.POSITIVE_INFINITY) - (right.worldRanking ?? Number.POSITIVE_INFINITY) ||
        left.teamName.localeCompare(right.teamName)
      ),
    }));
}

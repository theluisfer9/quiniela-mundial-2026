import { describe, expect, it } from "bun:test";

import {
  buildCalendarDaySections,
  buildGroupStandings,
  getDefaultCalendarDayKey,
  getSelectedCalendarDaySection,
  getSelectedGroupStanding,
  type CalendarMatch,
} from "./calendar-groups";

const TEAM_MEX = { id: "mex", code: "MEX", name: "Mexico", groupCode: "A" };
const TEAM_RSA = { id: "rsa", code: "RSA", name: "South Africa", groupCode: "A" };
const TEAM_KOR = { id: "kor", code: "KOR", name: "South Korea", groupCode: "A" };
const TEAM_CZE = { id: "cze", code: "CZE", name: "Czech Republic", groupCode: "A" };

function match(overrides: Partial<CalendarMatch> = {}): CalendarMatch {
  return {
    matchId: "match-1",
    kickoffAt: new Date("2026-06-12T18:00:00.000Z").getTime(),
    stageLabel: "Grupo A",
    groupCode: "A",
    status: "scheduled",
    homeTeam: TEAM_MEX,
    awayTeam: TEAM_RSA,
    ...overrides,
  };
}

describe("buildCalendarDaySections", () => {
  it("groups matches by Guatemala day in kickoff order", () => {
    const first = match({ matchId: "first", kickoffAt: new Date("2026-06-12T15:00:00.000Z").getTime() });
    const second = match({ matchId: "second", kickoffAt: new Date("2026-06-13T02:00:00.000Z").getTime() });
    const third = match({ matchId: "third", kickoffAt: new Date("2026-06-13T19:00:00.000Z").getTime() });

    expect(buildCalendarDaySections([third, second, first]).map((section) => ({
      dayKey: section.dayKey,
      matchIds: section.matches.map((row) => row.matchId),
    }))).toEqual([
      { dayKey: "2026-06-12", matchIds: ["first", "second"] },
      { dayKey: "2026-06-13", matchIds: ["third"] },
    ]);
  });

  it("selects one day section with first day fallback", () => {
    const sections = buildCalendarDaySections([
      match({ matchId: "first", kickoffAt: new Date("2026-06-12T15:00:00.000Z").getTime() }),
      match({ matchId: "second", kickoffAt: new Date("2026-06-13T19:00:00.000Z").getTime() }),
    ]);

    expect(getSelectedCalendarDaySection(sections, "2026-06-13")?.matches.map((row) => row.matchId)).toEqual(["second"]);
    expect(getSelectedCalendarDaySection(sections, "missing")?.matches.map((row) => row.matchId)).toEqual(["first"]);
  });

  it("uses the current Guatemala day as default when it exists", () => {
    const sections = buildCalendarDaySections([
      match({ matchId: "first", kickoffAt: new Date("2026-06-12T15:00:00.000Z").getTime() }),
      match({ matchId: "today", kickoffAt: new Date("2026-06-15T19:00:00.000Z").getTime() }),
      match({ matchId: "later", kickoffAt: new Date("2026-06-16T19:00:00.000Z").getTime() }),
    ]);

    expect(getDefaultCalendarDayKey(sections, new Date("2026-06-15T20:00:00.000Z").getTime())).toBe("2026-06-15");
  });
});

describe("buildGroupStandings", () => {
  it("calculates group table from finished and live scores", () => {
    const standings = buildGroupStandings([
      match({ matchId: "mex-rsa", homeTeam: TEAM_MEX, awayTeam: TEAM_RSA, status: "finished", homeScore: 2, awayScore: 0 }),
      match({ matchId: "kor-cze", homeTeam: TEAM_KOR, awayTeam: TEAM_CZE, status: "live", homeScore: 1, awayScore: 1 }),
      match({ matchId: "scheduled", homeTeam: TEAM_MEX, awayTeam: TEAM_KOR, status: "scheduled" }),
    ]);

    expect(standings).toMatchObject([
      {
        groupCode: "A",
        rows: [
          { teamCode: "MEX", points: 3, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2 },
          { teamCode: "CZE", points: 1, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference: 0 },
          { teamCode: "KOR", points: 1, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference: 0 },
          { teamCode: "RSA", points: 0, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, goalDifference: -2 },
        ],
      },
    ]);
  });

  it("selects one group table with first group fallback", () => {
    const groupA = match({ matchId: "a", groupCode: "A", homeTeam: TEAM_MEX, awayTeam: TEAM_RSA });
    const groupB = match({
      matchId: "b",
      groupCode: "B",
      homeTeam: { id: "usa", code: "USA", name: "United States", groupCode: "B" },
      awayTeam: { id: "par", code: "PAR", name: "Paraguay", groupCode: "B" },
    });
    const standings = buildGroupStandings([groupB, groupA]);

    expect(getSelectedGroupStanding(standings, "B")?.groupCode).toBe("B");
    expect(getSelectedGroupStanding(standings, "missing")?.groupCode).toBe("A");
  });

  it("uses FIFA ranking before team name when group rows are otherwise tied", () => {
    const standings = buildGroupStandings([
      match({
        matchId: "tie-1",
        homeTeam: { id: "eng", code: "ENG", name: "England", groupCode: "L", worldRanking: 4 },
        awayTeam: { id: "cro", code: "CRO", name: "Croatia", groupCode: "L", worldRanking: 11 },
        groupCode: "L",
        status: "scheduled",
      }),
      match({
        matchId: "tie-2",
        homeTeam: { id: "gha", code: "GHA", name: "Ghana", groupCode: "L", worldRanking: 72 },
        awayTeam: { id: "pan", code: "PAN", name: "Panama", groupCode: "L", worldRanking: 34 },
        groupCode: "L",
        status: "scheduled",
      }),
    ]);

    expect(standings[0]?.rows.map((row) => row.teamCode)).toEqual(["ENG", "CRO", "PAN", "GHA"]);
  });

  it("ignores knockout matches without group metadata", () => {
    const standings = buildGroupStandings([
      match({ matchId: "group", homeTeam: TEAM_MEX, awayTeam: TEAM_RSA, status: "finished", homeScore: 2, awayScore: 0 }),
      match({
        matchId: "m73",
        matchNumber: 73,
        stageLabel: "16avos",
        groupCode: null,
        homeTeam: { id: "arg", code: "ARG", name: "Argentina" },
        awayTeam: { id: "bra", code: "BRA", name: "Brazil" },
        status: "finished",
        homeScore: 1,
        awayScore: 1,
      }),
    ]);

    expect(standings.map((group) => group.groupCode)).toEqual(["A"]);
    expect(standings[0]?.rows.map((row) => row.teamCode)).toEqual(["MEX", "RSA"]);
  });

  it("ignores knockout matches even when teams still have original group metadata", () => {
    const standings = buildGroupStandings([
      match({ matchId: "group", homeTeam: TEAM_MEX, awayTeam: TEAM_RSA, status: "finished", homeScore: 2, awayScore: 0 }),
      match({
        matchId: "m73",
        matchNumber: 73,
        stageLabel: "16avos",
        groupCode: "A",
        homeTeam: TEAM_MEX,
        awayTeam: TEAM_RSA,
        status: "finished",
        homeScore: 1,
        awayScore: 1,
      }),
    ]);

    expect(standings[0]?.rows.find((row) => row.teamCode === "MEX")?.played).toBe(1);
    expect(standings[0]?.rows.find((row) => row.teamCode === "RSA")?.played).toBe(1);
  });
});

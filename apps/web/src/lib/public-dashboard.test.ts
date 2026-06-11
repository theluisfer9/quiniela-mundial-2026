import { describe, expect, it } from "bun:test";

import { derivePublicDashboardViewModel, paginatePublicDashboardMatches, type PublicDashboardMatch } from "./public-dashboard";

const TEAM_ARG = { id: "arg", code: "ARG", name: "Argentina", flagEmoji: "AR" };
const TEAM_MEX = { id: "mex", code: "MEX", name: "Mexico", flagEmoji: "MX" };
const TEAM_BRA = { id: "bra", code: "BRA", name: "Brazil", flagEmoji: "BR" };
const TEAM_FRA = { id: "fra", code: "FRA", name: "France", flagEmoji: "FR" };

function match(overrides: Partial<PublicDashboardMatch> = {}): PublicDashboardMatch {
  return {
    matchId: "match-1",
    kickoffAt: Date.UTC(2026, 5, 15, 18),
    stageLabel: "Grupo A",
    status: "scheduled" as const,
    homeTeam: TEAM_ARG,
    awayTeam: TEAM_MEX,
    ...overrides,
  };
}

describe("derivePublicDashboardViewModel", () => {
  it("returns loading while either public query is unresolved", () => {
    expect(derivePublicDashboardViewModel({ matches: undefined, standings: [] })).toMatchObject({
      state: "loading",
      liveMatches: [],
      todayMatches: [],
      upcomingMatches: [],
      finishedMatches: [],
      standings: [],
    });

    expect(
      derivePublicDashboardViewModel({
        matches: {
          liveMatches: [],
          todayMatches: [],
          upcomingMatches: [],
          finishedMatches: [],
          stats: {
            leaderName: null,
            finishedMatchCount: 0,
            totalPredictionCountForFinishedMatches: 0,
            bestExactScoreCount: 0,
          },
        },
        standings: undefined,
      }),
    ).toMatchObject({ state: "loading" });
  });

  it("returns an empty state when the public dashboard has no rows or matches", () => {
    const dashboard = derivePublicDashboardViewModel({
      matches: {
        liveMatches: [],
        todayMatches: [],
        upcomingMatches: [],
        finishedMatches: [],
        stats: {
          leaderName: null,
          finishedMatchCount: 0,
          totalPredictionCountForFinishedMatches: 0,
          bestExactScoreCount: 0,
        },
      },
      standings: [],
    });

    expect(dashboard).toMatchObject({
      state: "empty",
      totalVisibleMatches: 0,
      standings: [],
    });
    expect(dashboard.statCards).toEqual([
      { label: "Lider", value: "Por definir" },
      { label: "Puntos lider", value: "0" },
      { label: "Hoy", value: "0" },
      { label: "Cerrados", value: "0" },
    ]);
  });

  it("formats public stat labels around the tournament state", () => {
    const dashboard = derivePublicDashboardViewModel({
      matches: {
        liveMatches: [],
        todayMatches: [match()],
        upcomingMatches: [match({ matchId: "upcoming-1" })],
        finishedMatches: [
          match({ matchId: "finished-1", status: "finished" }),
          match({ matchId: "finished-2", status: "finished" }),
          match({ matchId: "finished-3", status: "finished" }),
        ],
        stats: {
          leaderName: "Ana",
          finishedMatchCount: 3,
          totalPredictionCountForFinishedMatches: 18,
          bestExactScoreCount: 4,
        },
      },
      standings: [{ rank: 1, name: "Ana", points: 12, rankDelta: 0, isCurrentUser: false }],
    });

    expect(dashboard.statCards).toEqual([
      { label: "Lider", value: "Ana" },
      { label: "Puntos lider", value: "12" },
      { label: "Hoy", value: "1" },
      { label: "Cerrados", value: "3" },
    ]);
  });

  it("keeps today, upcoming, and historical finished match groups separate", () => {
    const dashboard = derivePublicDashboardViewModel({
      matches: {
        liveMatches: [match({ matchId: "today-2", status: "live" })],
        todayMatches: [match({ matchId: "today-1" }), match({ matchId: "today-2", status: "live" })],
        upcomingMatches: [match({ matchId: "upcoming-1", kickoffAt: Date.UTC(2026, 5, 16, 18), homeTeam: TEAM_BRA, awayTeam: TEAM_FRA })],
        finishedMatches: [
          match({
            matchId: "finished-1",
            status: "finished",
            kickoffAt: Date.UTC(2026, 5, 14, 18),
            homeScore: 2,
            awayScore: 1,
          }),
        ],
        stats: {
          leaderName: "Ana",
          finishedMatchCount: 1,
          totalPredictionCountForFinishedMatches: 2,
          bestExactScoreCount: 1,
        },
      },
      standings: [],
    });

    expect(dashboard.state).toBe("ready");
    expect(dashboard.todayMatches).toHaveLength(2);
    expect(dashboard.liveMatches).toHaveLength(1);
    expect(dashboard.upcomingMatches).toHaveLength(1);
    expect(dashboard.finishedMatches).toHaveLength(1);
    expect(dashboard.totalVisibleMatches).toBe(4);
  });

  it("keeps public standings rows displayed without a current user", () => {
    const dashboard = derivePublicDashboardViewModel({
      matches: {
        liveMatches: [],
        todayMatches: [],
        upcomingMatches: [],
        finishedMatches: [],
        stats: {
          leaderName: "Ana",
          finishedMatchCount: 0,
          totalPredictionCountForFinishedMatches: 0,
          bestExactScoreCount: 0,
        },
      },
      standings: [
        { rank: 1, name: "Ana", points: 12, rankDelta: 1, isCurrentUser: true },
        { rank: 2, name: "Beto", points: 9, rankDelta: -1, isCurrentUser: false },
      ],
    });

    expect(dashboard.standings).toEqual([
      { rank: 1, name: "Ana", points: 12, rankDelta: 1, isCurrentUser: false },
      { rank: 2, name: "Beto", points: 9, rankDelta: -1, isCurrentUser: false },
    ]);
  });
});

describe("paginatePublicDashboardMatches", () => {
  it("returns a bounded page and page metadata for long match lists", () => {
    const matches = Array.from({ length: 13 }, (_, index) => match({ matchId: `match-${index + 1}` }));

    expect(paginatePublicDashboardMatches(matches, { page: 1, pageSize: 6 })).toMatchObject({
      page: 1,
      pageSize: 6,
      pageCount: 3,
      totalCount: 13,
      hasPreviousPage: false,
      hasNextPage: true,
      matches: matches.slice(0, 6),
    });

    expect(paginatePublicDashboardMatches(matches, { page: 3, pageSize: 6 })).toMatchObject({
      page: 3,
      pageCount: 3,
      hasPreviousPage: true,
      hasNextPage: false,
      matches: matches.slice(12),
    });
  });

  it("clamps invalid pages to the available range", () => {
    const matches = Array.from({ length: 2 }, (_, index) => match({ matchId: `match-${index + 1}` }));

    expect(paginatePublicDashboardMatches(matches, { page: 99, pageSize: 6 })).toMatchObject({
      page: 1,
      pageCount: 1,
      matches,
    });

    expect(paginatePublicDashboardMatches([], { page: 4, pageSize: 6 })).toMatchObject({
      page: 1,
      pageCount: 1,
      matches: [],
      totalCount: 0,
    });
  });
});

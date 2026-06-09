import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { convexTest, type TestConvex } from "convex-test";
import { anyApi } from "convex/server";

import schema from "./schema";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();

type TestInstance = TestConvex<typeof schema>;

const api = anyApi as any;

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./matches.ts": async () => await import("./matches"),
  "./standings.ts": async () => await import("./standings"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

async function seedTeams(t: TestInstance) {
  return await t.run(async (ctx) => {
    const argentinaId = await ctx.db.insert("teams", { code: "ARG", name: "Argentina", flagEmoji: "ARG" });
    const brazilId = await ctx.db.insert("teams", { code: "BRA", name: "Brazil", flagEmoji: "BRA" });
    const mexicoId = await ctx.db.insert("teams", { code: "MEX", name: "Mexico", flagEmoji: "MEX" });
    const canadaId = await ctx.db.insert("teams", { code: "CAN", name: "Canada", flagEmoji: "CAN" });

    return { argentinaId, brazilId, mexicoId, canadaId };
  });
}

async function seedPublicDashboardData(t: TestInstance) {
  const teams = await seedTeams(t);

  return await t.run(async (ctx) => {
    const anaId = await ctx.db.insert("profiles", {
      displayName: "Ana",
      pinHash: "pin:ana",
      active: true,
      userId: "legacy|ana",
    });
    const betoId = await ctx.db.insert("profiles", {
      displayName: "Beto",
      pinHash: "pin:beto",
      active: true,
    });
    await ctx.db.insert("profiles", {
      displayName: "Legacy No Pin",
      userId: "legacy|nopin",
      active: true,
    });
    await ctx.db.insert("profiles", {
      displayName: "Inactive Player",
      pinHash: "pin:inactive",
      active: false,
    });
    await ctx.db.insert("playerSessions", {
      playerId: anaId,
      tokenHash: "session-hash",
      createdAt: NOW,
      lastUsedAt: NOW,
      expiresAt: NOW + 86_400_000,
    });

    const yesterdayFinishedId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-11T23:00:00.000Z").getTime(),
      homeTeamId: teams.argentinaId,
      awayTeamId: teams.brazilId,
      stageLabel: "Group A",
      status: "finished",
      homeScore: 2n,
      awayScore: 1n,
    });
    const todayScheduledId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T15:00:00.000Z").getTime(),
      homeTeamId: teams.mexicoId,
      awayTeamId: teams.canadaId,
      stageLabel: "Group B",
      status: "scheduled",
      homeScore: 4n,
      awayScore: 4n,
    });
    const todayLiveId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T20:00:00.000Z").getTime(),
      homeTeamId: teams.argentinaId,
      awayTeamId: teams.mexicoId,
      stageLabel: "Group C",
      status: "live",
      homeScore: 1n,
      awayScore: 0n,
    });
    const tomorrowScheduledId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-13T01:00:00.000Z").getTime(),
      homeTeamId: teams.brazilId,
      awayTeamId: teams.canadaId,
      stageLabel: "Group D",
      status: "scheduled",
    });

    await ctx.db.insert("predictions", {
      playerId: anaId,
      matchId: yesterdayFinishedId,
      homeScore: 2n,
      awayScore: 1n,
      updatedAt: NOW - 120_000,
    });
    await ctx.db.insert("predictions", {
      playerId: betoId,
      matchId: yesterdayFinishedId,
      homeScore: 2n,
      awayScore: 1n,
      updatedAt: NOW - 120_000,
    });
    await ctx.db.insert("predictions", {
      userId: "legacy|ana",
      matchId: yesterdayFinishedId,
      homeScore: 2n,
      awayScore: 1n,
      updatedAt: NOW - 120_000,
    });
    await ctx.db.insert("predictions", {
      playerId: anaId,
      matchId: todayScheduledId,
      homeScore: 4n,
      awayScore: 4n,
      updatedAt: NOW - 60_000,
    });
    await ctx.db.insert("predictions", {
      playerId: betoId,
      matchId: todayLiveId,
      homeScore: 1n,
      awayScore: 0n,
      updatedAt: NOW - 60_000,
    });

    return { yesterdayFinishedId, todayScheduledId, todayLiveId, tomorrowScheduledId };
  });
}

describe("public dashboard", () => {
  const realNow = Date.now;

  beforeEach(() => {
    Date.now = () => NOW;
  });

  afterEach(() => {
    Date.now = realNow;
  });

  it("allows unauthenticated public dashboard access with UTC grouped matches and safe JSON", async () => {
    const t = createTest();
    const ids = await seedPublicDashboardData(t);

    const dashboard = await t.query(api.matches.getPublicDashboardMatches, {});

    expect(dashboard.todayMatches.map((match: { matchId: string }) => match.matchId)).toEqual([
      ids.todayScheduledId,
      ids.todayLiveId,
    ]);
    expect(dashboard.upcomingMatches.map((match: { matchId: string }) => match.matchId)).toEqual([
      ids.tomorrowScheduledId,
    ]);
    expect(dashboard.finishedMatches.map((match: { matchId: string }) => match.matchId)).toEqual([
      ids.yesterdayFinishedId,
    ]);
    expect(dashboard.finishedMatches[0]).toMatchObject({ homeScore: 2, awayScore: 1 });
    expect(dashboard.todayMatches[0]).not.toHaveProperty("homeScore");
    expect(dashboard.todayMatches[0]).not.toHaveProperty("awayScore");
    expect(dashboard.todayMatches[1]).not.toHaveProperty("homeScore");
    expect(dashboard.todayMatches[1]).not.toHaveProperty("awayScore");

    const json = JSON.stringify(dashboard);
    expect(json).not.toContain("pinHash");
    expect(json).not.toContain("tokenHash");
    expect(json).not.toContain("sessionToken");
    expect(json).not.toContain("userId");
    expect(json).not.toContain("predictions");
    expect(json).not.toContain('"homeScore":4');
    expect(json).not.toContain('"awayScore":4');
  });

  it("counts finished-match public stats only and derives the leader from public standings", async () => {
    const t = createTest();
    await seedPublicDashboardData(t);

    const dashboard = await t.query(api.matches.getPublicDashboardMatches, {});

    expect(dashboard.stats).toEqual({
      leaderName: "Ana",
      finishedMatchCount: 1,
      totalPredictionCountForFinishedMatches: 2,
      bestExactScoreCount: 1,
    });
  });

  it("returns public standings with all rows marked as not current user", async () => {
    const t = createTest();
    await seedPublicDashboardData(t);

    const standings = await t.query(api.standings.getPublicStandings, {});

    expect(standings).toEqual([
      { rank: 1, name: "Ana", points: 3, rankDelta: 0, isCurrentUser: false },
      { rank: 2, name: "Beto", points: 3, rankDelta: 0, isCurrentUser: false },
    ]);
  });
});

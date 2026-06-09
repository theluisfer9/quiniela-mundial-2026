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
    const secondFinishedId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T01:00:00.000Z").getTime(),
      homeTeamId: teams.mexicoId,
      awayTeamId: teams.canadaId,
      stageLabel: "Group E",
      status: "finished",
      homeScore: 1n,
      awayScore: 1n,
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
    await ctx.db.insert("predictions", {
      playerId: anaId,
      matchId: secondFinishedId,
      homeScore: 1n,
      awayScore: 0n,
      updatedAt: NOW - 30_000,
    });
    await ctx.db.insert("predictions", {
      playerId: betoId,
      matchId: secondFinishedId,
      homeScore: 1n,
      awayScore: 1n,
      updatedAt: NOW - 30_000,
    });
    await ctx.db.insert("predictions", {
      matchId: secondFinishedId,
      homeScore: 0n,
      awayScore: 0n,
      updatedAt: NOW - 30_000,
    });

    return { yesterdayFinishedId, todayScheduledId, todayLiveId, tomorrowScheduledId, secondFinishedId };
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
      ids.secondFinishedId,
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
      leaderName: "Beto",
      finishedMatchCount: 2,
      totalPredictionCountForFinishedMatches: 4,
      bestExactScoreCount: 2,
    });
  });

  it("returns public standings with all rows marked as not current user", async () => {
    const t = createTest();
    await seedPublicDashboardData(t);

    const standings = await t.query(api.standings.getPublicStandings, {});

    expect(standings).toEqual([
      { rank: 1, name: "Beto", points: 6, rankDelta: 1, isCurrentUser: false },
      { rank: 2, name: "Ana", points: 3, rankDelta: -1, isCurrentUser: false },
    ]);
  });

  it("returns rich public analytics without exposing scheduled private predictions", async () => {
    const t = createTest();
    const ids = await seedPublicDashboardData(t);

    const analytics = await t.query(api.standings.getPublicDashboardAnalytics, {});

    expect(analytics.rows).toEqual([
      expect.objectContaining({
        rank: 1,
        name: "Beto",
        points: 6,
        exactScoreCount: 2,
        outcomeHitCount: 2,
        predictionCount: 2,
        precision: 100,
        leaderGap: 0,
        rankDelta: 1,
        currentStreak: 2,
        longestStreak: 2,
        nearMissCount: 0,
        drawPredictionCount: 1,
        contrarianHitCount: 0,
        mostCommonScore: "2-1",
      }),
      expect.objectContaining({
        rank: 2,
        name: "Ana",
        points: 3,
        exactScoreCount: 1,
        outcomeHitCount: 1,
        predictionCount: 2,
        precision: 50,
        leaderGap: 3,
        rankDelta: -1,
        currentStreak: -1,
        longestStreak: 1,
        nearMissCount: 1,
        drawPredictionCount: 0,
        contrarianHitCount: 0,
        mostCommonScore: "2-1",
      }),
    ]);
    expect(analytics.awardCards.map((award: { label: string }) => award.label)).toEqual([
      "Nostradamus",
      "Mas exactos",
      "Rey de las tragedias",
      "Senor empate",
      "Rey del 1-0",
      "Contra la corriente",
    ]);
    expect(analytics.consensusMatches.map((match: { matchId: string }) => match.matchId)).toEqual([
      ids.yesterdayFinishedId,
      ids.secondFinishedId,
      ids.todayLiveId,
    ]);
    expect(JSON.stringify(analytics)).not.toContain(String(ids.todayScheduledId));
    expect(JSON.stringify(analytics)).not.toContain("Legacy No Pin");
    expect(JSON.stringify(analytics)).not.toContain("Inactive Player");
    expect(JSON.stringify(analytics)).not.toContain("pinHash");
    expect(JSON.stringify(analytics)).not.toContain("sessionToken");
    expect(JSON.stringify(analytics)).not.toContain("predictions");
  });

  it("does not assign awards before there are real results", async () => {
    const t = createTest();

    await t.run(async (ctx) => {
      await ctx.db.insert("profiles", { displayName: "Ale", pinHash: "pin:ale", active: true });
      await ctx.db.insert("profiles", { displayName: "Boris", pinHash: "pin:boris", active: true });
    });

    const analytics = await t.query(api.standings.getPublicDashboardAnalytics, {});

    expect(analytics.awardCards).toEqual([
      expect.objectContaining({ label: "Nostradamus", name: "Por definir", value: "0 pts" }),
      expect.objectContaining({ label: "Mas exactos", name: "Por definir", value: "0 exactos" }),
      expect.objectContaining({ label: "Rey de las tragedias", name: "Por definir", value: "0 por un gol" }),
      expect.objectContaining({ label: "Senor empate", name: "Por definir", value: "0 empates" }),
      expect.objectContaining({ label: "Rey del 1-0", name: "Por definir", value: "1-0" }),
      expect.objectContaining({ label: "Contra la corriente", name: "Por definir", value: "0 aciertos" }),
    ]);
  });
});

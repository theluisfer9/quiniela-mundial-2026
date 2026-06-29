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
    const argentinaId = await ctx.db.insert("teams", { code: "ARG", name: "Argentina", flagEmoji: "ARG", groupCode: "A", worldRanking: 1 });
    const brazilId = await ctx.db.insert("teams", { code: "BRA", name: "Brazil", flagEmoji: "BRA", groupCode: "A", worldRanking: 6 });
    const mexicoId = await ctx.db.insert("teams", { code: "MEX", name: "Mexico", flagEmoji: "MEX", groupCode: "B", worldRanking: 13 });
    const canadaId = await ctx.db.insert("teams", { code: "CAN", name: "Canada", flagEmoji: "CAN", groupCode: "B", worldRanking: 32 });

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

    const groupFinishedId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-11T23:00:00.000Z").getTime(),
      homeTeamId: teams.argentinaId,
      awayTeamId: teams.brazilId,
      stageLabel: "Group A",
      matchNumber: 1,
      status: "finished",
      homeScore: 2n,
      awayScore: 1n,
    });
    const todayScheduledId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T15:00:00.000Z").getTime(),
      homeTeamId: teams.mexicoId,
      awayTeamId: teams.canadaId,
      stageLabel: "Group B",
      matchNumber: 2,
      status: "scheduled",
      homeScore: 4n,
      awayScore: 4n,
    });
    const todayLiveId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T20:00:00.000Z").getTime(),
      homeTeamId: teams.argentinaId,
      awayTeamId: teams.mexicoId,
      stageLabel: "Group C",
      matchNumber: 3,
      status: "live",
      homeScore: 1n,
      awayScore: 0n,
    });
    const tomorrowScheduledId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-13T01:00:00.000Z").getTime(),
      homeTeamId: teams.brazilId,
      awayTeamId: teams.canadaId,
      stageLabel: "Group D",
      matchNumber: 4,
      status: "scheduled",
    });
    const knockoutFinishedId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T01:00:00.000Z").getTime(),
      homeTeamId: teams.mexicoId,
      awayTeamId: teams.canadaId,
      stageLabel: "Round of 32",
      matchNumber: 73,
      status: "finished",
      homeScore: 1n,
      awayScore: 1n,
    });
    const knockoutScheduledId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T18:00:00.000Z").getTime(),
      homeTeamId: teams.argentinaId,
      awayTeamId: teams.canadaId,
      stageLabel: "Round of 32",
      matchNumber: 74,
      status: "scheduled",
    });
    const knockoutLiveId = await ctx.db.insert("matches", {
      kickoffAt: new Date("2026-06-12T19:00:00.000Z").getTime(),
      homeTeamId: teams.argentinaId,
      awayTeamId: teams.brazilId,
      stageLabel: "Round of 32",
      matchNumber: 75,
      status: "live",
      homeScore: 2n,
      awayScore: 0n,
    });

    await ctx.db.insert("predictions", {
      playerId: anaId,
      matchId: groupFinishedId,
      homeScore: 2n,
      awayScore: 1n,
      updatedAt: NOW - 120_000,
    });
    await ctx.db.insert("predictions", {
      playerId: betoId,
      matchId: groupFinishedId,
      homeScore: 2n,
      awayScore: 1n,
      updatedAt: NOW - 120_000,
    });
    await ctx.db.insert("predictions", {
      userId: "legacy|ana",
      matchId: groupFinishedId,
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
      matchId: knockoutFinishedId,
      homeScore: 1n,
      awayScore: 0n,
      updatedAt: NOW - 30_000,
    });
    await ctx.db.insert("predictions", {
      playerId: betoId,
      matchId: knockoutFinishedId,
      homeScore: 1n,
      awayScore: 1n,
      updatedAt: NOW - 30_000,
    });
    await ctx.db.insert("predictions", {
      matchId: knockoutFinishedId,
      homeScore: 0n,
      awayScore: 0n,
      updatedAt: NOW - 30_000,
    });
    await ctx.db.insert("predictions", {
      playerId: anaId,
      matchId: knockoutLiveId,
      homeScore: 1n,
      awayScore: 0n,
      updatedAt: NOW - 20_000,
    });
    await ctx.db.insert("predictions", {
      playerId: betoId,
      matchId: knockoutLiveId,
      homeScore: 2n,
      awayScore: 0n,
      updatedAt: NOW - 20_000,
    });

    return { groupFinishedId, todayScheduledId, todayLiveId, tomorrowScheduledId, knockoutFinishedId, knockoutScheduledId, knockoutLiveId };
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

  it("allows unauthenticated public dashboard access with Guatemala-day grouped matches and safe JSON", async () => {
    const t = createTest();
    const ids = await seedPublicDashboardData(t);

    const dashboard = await t.query(api.matches.getPublicDashboardMatches, {});

    expect(dashboard.liveMatches.map((match: { matchId: string }) => match.matchId)).toEqual([ids.knockoutLiveId]);
    expect(dashboard.todayMatches.map((match: { matchId: string }) => match.matchId)).toEqual([
      ids.knockoutScheduledId,
      ids.knockoutLiveId,
    ]);
    expect(dashboard.upcomingMatches.map((match: { matchId: string }) => match.matchId)).toEqual([]);
    expect(dashboard.finishedMatches.map((match: { matchId: string }) => match.matchId)).toEqual([
      ids.knockoutFinishedId,
    ]);
    expect(dashboard.finishedMatches[0]).toMatchObject({ homeScore: 1, awayScore: 1 });
    expect(dashboard.todayMatches[0]).not.toHaveProperty("homeScore");
    expect(dashboard.todayMatches[0]).not.toHaveProperty("awayScore");
    expect(dashboard.todayMatches[1]).toMatchObject({ homeScore: 2, awayScore: 0 });

    const json = JSON.stringify(dashboard);
    expect(json).not.toContain("pinHash");
    expect(json).not.toContain("tokenHash");
    expect(json).not.toContain("sessionToken");
    expect(json).not.toContain("userId");
    expect(json).not.toContain("predictions");
    expect(json).not.toContain(String(ids.groupFinishedId));
    expect(json).not.toContain(String(ids.todayLiveId));
    expect(json).not.toContain('"homeScore":4');
    expect(json).not.toContain('"awayScore":4');
  });

  it("counts scored public stats without reading predictions", async () => {
    const t = createTest();
    await seedPublicDashboardData(t);

    const dashboard = await t.query(api.matches.getPublicDashboardMatches, {});

    expect(dashboard.stats).toEqual({
      leaderName: null,
      finishedMatchCount: 1,
      totalPredictionCountForFinishedMatches: 0,
      bestExactScoreCount: 0,
    });
  });

  it("can explicitly read the historical overall dashboard when needed", async () => {
    const t = createTest();
    await seedPublicDashboardData(t);

    const dashboard = await t.query(api.matches.getPublicDashboardMatches, { phase: "overall" });

    expect(dashboard.stats.finishedMatchCount).toBe(2);
  });

  it("returns public calendar rows with group metadata and safe scheduled scores", async () => {
    const t = createTest();
    const ids = await seedPublicDashboardData(t);

    const calendar = await t.query(api.matches.getPublicCalendar, {});

    expect(calendar.matches.map((match: { matchId: string }) => match.matchId)).toContain(ids.todayScheduledId);
    const scheduled = calendar.matches.find((match: { matchId: string }) => match.matchId === ids.todayScheduledId);
    const live = calendar.matches.find((match: { matchId: string }) => match.matchId === ids.todayLiveId);
    const knockout = calendar.matches.find((match: { matchId: string }) => match.matchId === ids.knockoutScheduledId);
    expect(scheduled).toMatchObject({
      groupCode: "B",
      homeTeam: { groupCode: "B", name: "México", worldRanking: 13 },
      awayTeam: { groupCode: "B", name: "Canadá", worldRanking: 32 },
      status: "scheduled",
    });
    expect(scheduled).not.toHaveProperty("homeScore");
    expect(scheduled).not.toHaveProperty("awayScore");
    expect(live).toMatchObject({ homeScore: 1, awayScore: 0, status: "live" });
    expect(knockout).toMatchObject({ groupCode: null, matchNumber: 74, stageLabel: "16avos" });
  });

  it("returns public standings with all rows marked as not current user", async () => {
    const t = createTest();
    await seedPublicDashboardData(t);

    const standings = await t.query(api.standings.getPublicStandings, {});

    expect(standings).toEqual([
      { rank: 1, name: "Beto", points: 6, rankDelta: 0, isCurrentUser: false },
      { rank: 2, name: "Ana", points: 3, rankDelta: 0, isCurrentUser: false },
    ]);
  });

  it("can return group-stage and overall standings without mixing them into knockout", async () => {
    const t = createTest();
    await seedPublicDashboardData(t);

    await expect(t.query(api.standings.getPublicStandings, { phase: "group" })).resolves.toEqual([
      { rank: 1, name: "Beto", points: 6, rankDelta: 1, isCurrentUser: false },
      { rank: 2, name: "Ana", points: 3, rankDelta: -1, isCurrentUser: false },
    ]);
    await expect(t.query(api.standings.getPublicStandings, { phase: "overall" })).resolves.toEqual([
      { rank: 1, name: "Beto", points: 12, rankDelta: 0, isCurrentUser: false },
      { rank: 2, name: "Ana", points: 6, rankDelta: 0, isCurrentUser: false },
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
        rankDelta: 0,
        currentStreak: 2,
        longestStreak: 2,
        nearMissCount: 0,
        drawPredictionCount: 1,
        contrarianHitCount: 0,
        mostCommonScore: "1-1",
      }),
      expect.objectContaining({
        rank: 2,
        name: "Ana",
        points: 3,
        exactScoreCount: 0,
        outcomeHitCount: 1,
        predictionCount: 2,
        precision: 50,
        leaderGap: 3,
        rankDelta: 0,
        currentStreak: 1,
        longestStreak: 1,
        nearMissCount: 2,
        drawPredictionCount: 0,
        contrarianHitCount: 0,
        mostCommonScore: "1-0",
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
      ids.knockoutFinishedId,
      ids.knockoutLiveId,
    ]);
    expect(JSON.stringify(analytics)).not.toContain(String(ids.todayScheduledId));
    expect(JSON.stringify(analytics)).not.toContain(String(ids.groupFinishedId));
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

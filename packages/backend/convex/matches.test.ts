import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { convexTest, type TestConvex } from "convex-test";
import { anyApi } from "convex/server";

import { hashPin } from "./lib/pinAccess";
import schema from "./schema";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();
const TEST_PEPPER = "test-pepper";

type TestInstance = TestConvex<typeof schema>;

const api = anyApi as any;

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./matches.ts": async () => await import("./matches"),
  "./players.ts": async () => await import("./players"),
  "./predictions.ts": async () => await import("./predictions"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

async function seedPlayer(
  t: TestInstance,
  { displayName = "Ana", pin = "A1B2", active = true } = {},
) {
  const pinHash = await hashPin(pin, TEST_PEPPER);
  const playerId = await t.run((ctx) =>
    ctx.db.insert("profiles", {
      userId: `legacy|${displayName.toLowerCase()}`,
      displayName,
      pinHash,
      active,
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );

  return { playerId, displayName, pin };
}

async function loginWithPin(t: TestInstance, pin: string) {
  const result = await t.mutation(api.players.loginWithPin, { pin });
  expect(result.status).toBe("ok");
  return result.sessionToken as string;
}

async function seedTeams(t: TestInstance) {
  return await t.run(async (ctx) => {
    const argentinaId = await ctx.db.insert("teams", { code: "ARG", name: "Argentina", flagEmoji: "ARG" });
    const brazilId = await ctx.db.insert("teams", { code: "BRA", name: "Brazil", flagEmoji: "BRA" });
    const mexicoId = await ctx.db.insert("teams", { code: "MEX", name: "Mexico", flagEmoji: "MEX" });

    return { argentinaId, brazilId, mexicoId };
  });
}

async function seedMatch(
  t: TestInstance,
  {
    kickoffAt = NOW + 60_000,
    matchNumber,
    stageLabel = "Group A",
  }: { kickoffAt?: number; matchNumber?: number; stageLabel?: string } = {},
) {
  const { argentinaId, brazilId } = await seedTeams(t);

  return await t.run((ctx) =>
    ctx.db.insert("matches", {
      kickoffAt,
      homeTeamId: argentinaId,
      awayTeamId: brazilId,
      matchNumber,
      stageLabel,
      status: "scheduled",
    }),
  );
}

describe("matches.listHomeMatches", () => {
  const realNow = Date.now;
  const originalPinPepper = process.env.PIN_PEPPER;
  const originalMatchManagement = process.env.ENABLE_MATCH_MANAGEMENT;

  beforeEach(() => {
    process.env.PIN_PEPPER = TEST_PEPPER;
    Date.now = () => NOW;
  });

  afterEach(() => {
    if (originalPinPepper === undefined) {
      delete process.env.PIN_PEPPER;
    } else {
      process.env.PIN_PEPPER = originalPinPepper;
    }
    if (originalMatchManagement === undefined) {
      delete process.env.ENABLE_MATCH_MANAGEMENT;
    } else {
      process.env.ENABLE_MATCH_MANAGEMENT = originalMatchManagement;
    }
    Date.now = realNow;
  });

  it("rejects fake sessions", async () => {
    const t = createTest();
    await seedMatch(t);

    await expect(t.query(api.matches.listHomeMatches, { sessionToken: "fake-token" })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("returns upcoming matches for a valid session", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const matchId = await seedMatch(t, { kickoffAt: NOW + 60_000, matchNumber: 73, stageLabel: "Round of 32" });
    const pastMatchId = await seedMatch(t, { kickoffAt: NOW - 60_000, stageLabel: "Past Match" });

    const result = await t.query(api.matches.listHomeMatches, { sessionToken });

    expect(result.upcomingMatches).toHaveLength(1);
    expect(result.upcomingMatches[0]).toMatchObject({
      matchId,
      kickoffAt: NOW + 60_000,
      stageLabel: "16avos",
      homeTeam: {
        code: "ARG",
        name: "Argentina",
        flagEmoji: "ARG",
      },
      awayTeam: {
        code: "BRA",
        name: "Brasil",
        flagEmoji: "BRA",
      },
      hasPrediction: false,
    });
    expect(result.historicalMatches).toHaveLength(1);
    expect(result.historicalMatches[0]).toMatchObject({
      matchId: pastMatchId,
      kickoffAt: NOW - 60_000,
      stageLabel: "Past Match",
      homeTeam: {
        code: "ARG",
        name: "Argentina",
        flagEmoji: "ARG",
      },
      awayTeam: {
        code: "BRA",
        name: "Brasil",
        flagEmoji: "BRA",
      },
      hasPrediction: false,
    });
    expect(result.pendingCount).toBe(1);
    expect(result.nextKickoff).toEqual({ kickoffAt: NOW + 60_000, matchCount: 1 });
  });

  it("uses knockout as the active upcoming phase without hiding group history", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    await seedMatch(t, { kickoffAt: NOW + 60_000, matchNumber: 10, stageLabel: "Group A" });
    const knockoutMatchId = await seedMatch(t, { kickoffAt: NOW + 120_000, matchNumber: 73, stageLabel: "Round of 32" });
    const groupHistoryId = await seedMatch(t, { kickoffAt: NOW - 60_000, matchNumber: 1, stageLabel: "Group A" });

    const result = await t.query(api.matches.listHomeMatches, { sessionToken });

    expect(result.upcomingMatches.map((match: { matchId: string }) => match.matchId)).toEqual([knockoutMatchId]);
    expect(result.historicalMatches.map((match: { matchId: string }) => match.matchId)).toEqual([groupHistoryId]);
    expect(result.pendingCount).toBe(1);
  });

  it("scopes hasPrediction and pendingCount to the session player", async () => {
    const t = createTest();
    const ana = await seedPlayer(t, { displayName: "Ana", pin: "A1B2" });
    const beto = await seedPlayer(t, { displayName: "Beto", pin: "B2C3" });
    const anaSessionToken = await loginWithPin(t, ana.pin);
    const betoSessionToken = await loginWithPin(t, beto.pin);
    const firstMatchId = await seedMatch(t, { kickoffAt: NOW + 60_000, matchNumber: 73, stageLabel: "First" });
    const secondMatchId = await seedMatch(t, { kickoffAt: NOW + 120_000, matchNumber: 74, stageLabel: "Second" });

    await t.mutation(api.predictions.upsertPrediction, {
      sessionToken: anaSessionToken,
      matchId: firstMatchId,
      homeScore: 1n,
      awayScore: 0n,
    });
    await t.mutation(api.predictions.upsertPrediction, {
      sessionToken: betoSessionToken,
      matchId: secondMatchId,
      homeScore: 2n,
      awayScore: 1n,
    });

    const result = await t.query(api.matches.listHomeMatches, { sessionToken: anaSessionToken });

    expect(result.upcomingMatches.map((match: { matchId: string; hasPrediction: boolean }) => ({
      matchId: match.matchId,
      hasPrediction: match.hasPrediction,
    }))).toEqual([
      { matchId: firstMatchId, hasPrediction: true },
      { matchId: secondMatchId, hasPrediction: false },
    ]);
    expect(result.pendingCount).toBe(1);
  });

  it("includes final scores for scored historical matches", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const { argentinaId, brazilId } = await seedTeams(t);
    const matchId = await t.run((ctx) =>
      ctx.db.insert("matches", {
        awayScore: 1n,
        awayTeamId: brazilId,
        homeScore: 2n,
        homeTeamId: argentinaId,
        kickoffAt: NOW - 60_000,
        stageLabel: "Finished Match",
        status: "finished",
      }),
    );

    const result = await t.query(api.matches.listHomeMatches, { sessionToken });

    expect(result.historicalMatches[0]).toMatchObject({
      matchId,
      awayScore: 1,
      homeScore: 2,
      status: "finished",
    });
  });

  it("rejects deactivated player sessions", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    await seedMatch(t);

    await t.run((ctx) => ctx.db.patch(player.playerId, { active: false, updatedAt: NOW }));

    await expect(t.query(api.matches.listHomeMatches, { sessionToken })).rejects.toThrow("Not authenticated");
  });

  it("rejects match score updates when match management is disabled", async () => {
    const t = createTest();
    const matchId = await seedMatch(t);

    await expect(t.mutation(api.matches.updateMatchScore, {
      matchId,
      homeScore: 1,
      awayScore: 0,
      status: "live",
    })).rejects.toThrow("Match management is not enabled");
  });

  it("updates a match with a live score when match management is enabled", async () => {
    const t = createTest();
    process.env.ENABLE_MATCH_MANAGEMENT = "true";
    const matchId = await seedMatch(t);

    await expect(t.mutation(api.matches.updateMatchScore, {
      matchId,
      homeScore: 1,
      awayScore: 0,
      status: "live",
    })).resolves.toEqual({
      matchId,
      homeScore: 1,
      awayScore: 0,
      status: "live",
    });

    const match = await t.run((ctx) => ctx.db.get(matchId));
    expect(match).toMatchObject({ homeScore: 1n, awayScore: 0n, status: "live" });
  });

  it("stores knockout advancement separately from the 90-minute score", async () => {
    const t = createTest();
    process.env.ENABLE_MATCH_MANAGEMENT = "true";
    const { argentinaId, brazilId } = await seedTeams(t);
    const matchId = await t.run((ctx) =>
      ctx.db.insert("matches", {
        awayTeamId: brazilId,
        homeTeamId: argentinaId,
        kickoffAt: NOW,
        matchNumber: 74,
        stageLabel: "Round of 32",
        status: "live",
        homeScore: 1n,
        awayScore: 1n,
      }),
    );

    await expect(t.mutation(api.matches.updateMatchScore, {
      matchId,
      homeScore: 1,
      awayScore: 1,
      status: "finished",
    })).rejects.toThrow("Winner team is required");

    await expect(t.mutation(api.matches.updateMatchScore, {
      matchId,
      homeScore: 1,
      awayScore: 1,
      status: "finished",
      winnerTeamId: brazilId,
      advancementMethod: "penalties",
    })).resolves.toEqual({
      matchId,
      homeScore: 1,
      awayScore: 1,
      status: "finished",
      winnerTeamId: brazilId,
      advancementMethod: "penalties",
    });

    const match = await t.run((ctx) => ctx.db.get(matchId));
    expect(match).toMatchObject({
      homeScore: 1n,
      awayScore: 1n,
      status: "finished",
      winnerTeamId: brazilId,
      advancementMethod: "penalties",
    });
  });

  it("returns only the minimal knockout bracket data for the public home preview", async () => {
    const t = createTest();
    const { argentinaId, brazilId, mexicoId } = await seedTeams(t);
    const groupMatchId = await t.run((ctx) =>
      ctx.db.insert("matches", {
        awayTeamId: mexicoId,
        homeTeamId: argentinaId,
        kickoffAt: NOW,
        matchNumber: 12,
        stageLabel: "Group A",
        status: "scheduled",
        venue: "Group Venue",
      }),
    );
    const knockoutMatchId = await t.run((ctx) =>
      ctx.db.insert("matches", {
        awayScore: 1n,
        awayTeamId: brazilId,
        homeScore: 2n,
        homeTeamId: argentinaId,
        kickoffAt: NOW + 60_000,
        matchNumber: 73,
        stageLabel: "Round of 32",
        status: "finished",
        venue: "Knockout Venue",
      }),
    );

    const result = await t.query(api.matches.getPublicKnockoutBracket, {});

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]).toEqual({
      awayScore: 1,
      awayTeam: {
        code: "BRA",
        flagEmoji: "BRA",
        id: brazilId,
        name: "Brasil",
      },
      homeScore: 2,
      homeTeam: {
        code: "ARG",
        flagEmoji: "ARG",
        id: argentinaId,
        name: "Argentina",
      },
      kickoffAt: NOW + 60_000,
      matchId: knockoutMatchId,
      matchNumber: 73,
      stageLabel: "16avos",
      status: "finished",
      venue: "Knockout Venue",
    });
    expect(result.matches.map((match: { matchId: string }) => match.matchId)).not.toContain(groupMatchId);
    expect("groupCode" in result.matches[0]).toBe(false);
  });
});

describe("matches.markStartedMatchesLive", () => {
  const realNow = Date.now;

  beforeEach(() => {
    Date.now = () => NOW;
  });

  afterEach(() => {
    Date.now = realNow;
  });

  it("marks scheduled matches at or after kickoff as live", async () => {
    const t = createTest();
    const { argentinaId, brazilId, mexicoId } = await seedTeams(t);

    const ids = await t.run(async (ctx) => ({
      pastScheduledId: await ctx.db.insert("matches", {
        kickoffAt: NOW - 60_000,
        homeTeamId: argentinaId,
        awayTeamId: brazilId,
        stageLabel: "Past Scheduled",
        status: "scheduled",
      }),
      currentScheduledId: await ctx.db.insert("matches", {
        kickoffAt: NOW,
        homeTeamId: brazilId,
        awayTeamId: mexicoId,
        stageLabel: "Current Scheduled",
        status: "scheduled",
      }),
      futureScheduledId: await ctx.db.insert("matches", {
        kickoffAt: NOW + 60_000,
        homeTeamId: mexicoId,
        awayTeamId: argentinaId,
        stageLabel: "Future Scheduled",
        status: "scheduled",
      }),
      alreadyLiveId: await ctx.db.insert("matches", {
        kickoffAt: NOW - 120_000,
        homeTeamId: argentinaId,
        awayTeamId: mexicoId,
        stageLabel: "Already Live",
        status: "live",
      }),
      finishedId: await ctx.db.insert("matches", {
        kickoffAt: NOW - 180_000,
        homeTeamId: brazilId,
        awayTeamId: argentinaId,
        stageLabel: "Finished",
        status: "finished",
        homeScore: 1n,
        awayScore: 0n,
      }),
    }));

    await expect(t.mutation(api.matches.markStartedMatchesLive, {})).resolves.toEqual({ updatedMatches: 2 });
    await expect(t.mutation(api.matches.markStartedMatchesLive, {})).resolves.toEqual({ updatedMatches: 0 });

    const matches = await t.run(async (ctx) => ({
      pastScheduled: await ctx.db.get(ids.pastScheduledId),
      currentScheduled: await ctx.db.get(ids.currentScheduledId),
      futureScheduled: await ctx.db.get(ids.futureScheduledId),
      alreadyLive: await ctx.db.get(ids.alreadyLiveId),
      finished: await ctx.db.get(ids.finishedId),
    }));

    expect(matches.pastScheduled?.status).toBe("live");
    expect(matches.pastScheduled).toMatchObject({ homeScore: 0n, awayScore: 0n });
    expect(matches.currentScheduled?.status).toBe("live");
    expect(matches.currentScheduled).toMatchObject({ homeScore: 0n, awayScore: 0n });
    expect(matches.futureScheduled?.status).toBe("scheduled");
    expect(matches.futureScheduled?.homeScore).toBeUndefined();
    expect(matches.futureScheduled?.awayScore).toBeUndefined();
    expect(matches.alreadyLive?.status).toBe("live");
    expect(matches.alreadyLive?.homeScore).toBeUndefined();
    expect(matches.alreadyLive?.awayScore).toBeUndefined();
    expect(matches.finished?.status).toBe("finished");
  });
});


describe("matches.upsertKnockoutMatches", () => {
  const originalKnockoutFixtureUpdate = process.env.ENABLE_KNOCKOUT_FIXTURE_UPDATE;

  afterEach(() => {
    if (originalKnockoutFixtureUpdate === undefined) {
      delete process.env.ENABLE_KNOCKOUT_FIXTURE_UPDATE;
    } else {
      process.env.ENABLE_KNOCKOUT_FIXTURE_UPDATE = originalKnockoutFixtureUpdate;
    }
  });

  it("inserts knockout matches without deleting existing group matches or predictions", async () => {
    const t = createTest();
    process.env.ENABLE_KNOCKOUT_FIXTURE_UPDATE = "true";
    const groupMatchId = await seedMatch(t, { kickoffAt: NOW - 60_000, stageLabel: "Group A" });

    await t.run(async (ctx) => {
      await ctx.db.insert("predictions", {
        matchId: groupMatchId,
        homeScore: 1n,
        awayScore: 0n,
        updatedAt: NOW,
      });
    });

    await expect(t.mutation(api.matches.upsertKnockoutMatches, {
      confirmUpdate: true,
      fixtures: [{
        awayTeamCode: "BRA",
        homeTeamCode: "ARG",
        kickoffAt: NOW + 86_400_000,
        matchNumber: 73,
        stageLabel: "Round of 32",
        venue: "Los Angeles Stadium",
      }],
    })).resolves.toEqual({ insertedMatches: 1, skippedLockedMatches: 0, updatedMatches: 0 });

    const data = await t.run(async (ctx) => ({
      matches: await ctx.db.query("matches").collect(),
      predictions: await ctx.db.query("predictions").collect(),
    }));

    expect(data.matches).toHaveLength(2);
    expect(data.predictions).toHaveLength(1);
    expect(data.matches.find((match) => match.matchNumber === 73)).toMatchObject({
      kickoffAt: NOW + 86_400_000,
      stageLabel: "Round of 32",
      status: "scheduled",
      venue: "Los Angeles Stadium",
    });
    expect(data.matches.find((match) => match._id === groupMatchId)).toBeDefined();
  });

  it("updates existing scheduled knockout matches but skips locked live/finished matches", async () => {
    const t = createTest();
    process.env.ENABLE_KNOCKOUT_FIXTURE_UPDATE = "true";
    const { argentinaId, brazilId, mexicoId } = await seedTeams(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("matches", {
        awayTeamId: brazilId,
        homeTeamId: argentinaId,
        kickoffAt: NOW + 60_000,
        matchNumber: 73,
        stageLabel: "Round of 32",
        status: "scheduled",
      });
      await ctx.db.insert("matches", {
        awayScore: 1n,
        awayTeamId: brazilId,
        homeScore: 1n,
        homeTeamId: argentinaId,
        kickoffAt: NOW + 120_000,
        matchNumber: 74,
        stageLabel: "Round of 32",
        status: "finished",
      });
    });

    await expect(t.mutation(api.matches.upsertKnockoutMatches, {
      confirmUpdate: true,
      fixtures: [
        {
          awayTeamCode: "MEX",
          homeTeamCode: "BRA",
          kickoffAt: NOW + 86_400_000,
          matchNumber: 73,
          stageLabel: "Round of 32",
        },
        {
          awayTeamCode: "MEX",
          homeTeamCode: "BRA",
          kickoffAt: NOW + 86_400_000,
          matchNumber: 74,
          stageLabel: "Round of 32",
        },
      ],
    })).resolves.toEqual({ insertedMatches: 0, skippedLockedMatches: 1, updatedMatches: 1 });

    const matches = await t.run(async (ctx) => await ctx.db.query("matches").collect());
    const updatedMatch = matches.find((match) => match.matchNumber === 73);
    const lockedMatch = matches.find((match) => match.matchNumber === 74);
    expect(updatedMatch).toMatchObject({ awayTeamId: mexicoId, homeTeamId: brazilId, kickoffAt: NOW + 86_400_000 });
    expect(lockedMatch).toMatchObject({ status: "finished", homeTeamId: argentinaId, awayTeamId: brazilId });
  });

  it("rejects when the operation is not explicitly enabled", async () => {
    const t = createTest();
    await seedTeams(t);

    await expect(t.mutation(api.matches.upsertKnockoutMatches, {
      confirmUpdate: true,
      fixtures: [{
        awayTeamCode: "BRA",
        homeTeamCode: "ARG",
        kickoffAt: NOW + 86_400_000,
        matchNumber: 73,
        stageLabel: "Round of 32",
      }],
    })).rejects.toThrow("Knockout fixture update is not enabled");
  });
});

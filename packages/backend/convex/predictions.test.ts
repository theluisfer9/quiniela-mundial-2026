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
  "./players.ts": async () => await import("./players"),
  "./predictions.ts": async () => await import("./predictions"),
  "./scoreOperators.ts": async () => await import("./scoreOperators"),
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

async function seedOperator(t: TestInstance, { displayName = "Marcador", pin = "M1M1" } = {}) {
  const pinHash = await hashPin(pin, TEST_PEPPER);
  const operatorId = await t.run((ctx) =>
    ctx.db.insert("scoreOperators", {
      active: true,
      createdAt: NOW,
      displayName,
      pinHash,
      updatedAt: NOW,
    }),
  );

  return { operatorId, displayName, pin };
}

async function loginWithPin(t: TestInstance, pin: string) {
  const result = await t.mutation(api.players.loginWithPin, { pin });
  expect(result.status).toBe("ok");
  return result.sessionToken as string;
}

async function loginOperatorWithPin(t: TestInstance, pin: string) {
  const result = await t.mutation(api.players.loginWithPin, { pin });
  expect(result.status).toBe("ok_operator");
  return result.sessionToken as string;
}

async function seedTeams(t: TestInstance) {
  return await t.run(async (ctx) => {
    const argentinaId = await ctx.db.insert("teams", { code: "ARG", name: "Argentina", flagEmoji: "ARG" });
    const brazilId = await ctx.db.insert("teams", { code: "BRA", name: "Brazil", flagEmoji: "BRA" });

    return { argentinaId, brazilId };
  });
}

async function seedMatch(t: TestInstance, kickoffAt = NOW + 60_000, matchNumber?: number) {
  const { argentinaId, brazilId } = await seedTeams(t);

  return await t.run((ctx) =>
    ctx.db.insert("matches", {
      kickoffAt,
      homeTeamId: argentinaId,
      awayTeamId: brazilId,
      matchNumber,
      stageLabel: "Group A",
      status: "scheduled",
    }),
  );
}

describe("predictions", () => {
  const realNow = Date.now;
  const originalPinPepper = process.env.PIN_PEPPER;

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
    Date.now = realNow;
  });

  it("rejects missing and fake sessions for list and upsert", async () => {
    const t = createTest();
    const matchId = await seedMatch(t);

    await expect(t.query(api.predictions.listMyPredictions, { sessionToken: "" })).rejects.toThrow("Not authenticated");
    await expect(t.query(api.predictions.listMyPredictions, { sessionToken: "fake-token" })).rejects.toThrow(
      "Not authenticated",
    );
    await expect(
      t.mutation(api.predictions.upsertPrediction, {
        sessionToken: "",
        matchId,
        homeScore: 1n,
        awayScore: 0n,
      }),
    ).rejects.toThrow("Not authenticated");
    await expect(
      t.mutation(api.predictions.upsertPrediction, {
        sessionToken: "fake-token",
        matchId,
        homeScore: 1n,
        awayScore: 0n,
      }),
    ).rejects.toThrow("Not authenticated");
  });

  it("valid player can upsert and update one future-match row using playerId only", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const matchId = await seedMatch(t);

    const first = await t.mutation(api.predictions.upsertPrediction, {
      sessionToken,
      matchId,
      homeScore: 1n,
      awayScore: 0n,
    });
    const second = await t.mutation(api.predictions.upsertPrediction, {
      sessionToken,
      matchId,
      homeScore: 2n,
      awayScore: 1n,
    });

    expect(first.status).toBe("saved");
    expect(second.status).toBe("saved");

    const predictions = await t.run((ctx) =>
      ctx.db
        .query("predictions")
        .withIndex("by_player_id_match_id", (q) => q.eq("playerId", player.playerId).eq("matchId", matchId))
        .collect(),
    );

    expect(predictions).toHaveLength(1);
    expect(predictions[0]).toMatchObject({ playerId: player.playerId, matchId, homeScore: 2n, awayScore: 1n });
    expect(predictions[0]?.userId).toBeUndefined();
  });

  it("keeps two players predicting the same match isolated when listing", async () => {
    const t = createTest();
    const ana = await seedPlayer(t, { displayName: "Ana", pin: "A1B2" });
    const beto = await seedPlayer(t, { displayName: "Beto", pin: "B2C3" });
    const anaSessionToken = await loginWithPin(t, ana.pin);
    const betoSessionToken = await loginWithPin(t, beto.pin);
    const matchId = await seedMatch(t);

    await t.mutation(api.predictions.upsertPrediction, {
      sessionToken: anaSessionToken,
      matchId,
      homeScore: 1n,
      awayScore: 0n,
    });
    await t.mutation(api.predictions.upsertPrediction, {
      sessionToken: betoSessionToken,
      matchId,
      homeScore: 0n,
      awayScore: 2n,
    });

    await expect(t.query(api.predictions.listMyPredictions, { sessionToken: anaSessionToken })).resolves.toEqual([
      {
        matchId,
        homeScore: 1n,
        awayScore: 0n,
        updatedAt: NOW,
      },
    ]);

    const predictions = await t.run((ctx) => ctx.db.query("predictions").withIndex("by_match_id", (q) => q.eq("matchId", matchId)).collect());
    expect(predictions).toHaveLength(2);
    expect(predictions.map((prediction) => prediction.playerId).sort()).toEqual([ana.playerId, beto.playerId].sort());
    expect(predictions.every((prediction) => prediction.userId === undefined)).toBe(true);
  });

  it("includes future knockout predictions and allows 90-minute draws", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const matchId = await seedMatch(t, NOW + 60_000, 73);

    await t.mutation(api.predictions.upsertPrediction, {
      sessionToken,
      matchId,
      homeScore: 1n,
      awayScore: 1n,
    });

    await expect(t.query(api.predictions.listMyPredictions, { sessionToken })).resolves.toEqual([
      {
        matchId,
        homeScore: 1n,
        awayScore: 1n,
        updatedAt: NOW,
      },
    ]);
  });

  it("rejects locked matches", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const matchId = await seedMatch(t, NOW);

    await expect(
      t.mutation(api.predictions.upsertPrediction, { sessionToken, matchId, homeScore: 1n, awayScore: 0n }),
    ).rejects.toThrow("Match is locked");
  });

  it("rejects invalid scores", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const matchId = await seedMatch(t);

    await expect(
      t.mutation(api.predictions.upsertPrediction, { sessionToken, matchId, homeScore: -1n, awayScore: 0n }),
    ).rejects.toThrow("Score must be between 0 and 20");
  });

  it("rejects deactivated player sessions", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const matchId = await seedMatch(t);

    await t.run((ctx) => ctx.db.patch(player.playerId, { active: false, updatedAt: NOW }));

    await expect(t.query(api.predictions.listMyPredictions, { sessionToken })).rejects.toThrow("Not authenticated");
    await expect(
      t.mutation(api.predictions.upsertPrediction, { sessionToken, matchId, homeScore: 1n, awayScore: 0n }),
    ).rejects.toThrow("Not authenticated");
  });

  it("lists public predictions for a live match sorted by player name", async () => {
    const t = createTest();
    const ana = await seedPlayer(t, { displayName: "Ana", pin: "A1B2" });
    const beto = await seedPlayer(t, { displayName: "Beto", pin: "B2C3" });
    const anaSessionToken = await loginWithPin(t, ana.pin);
    const betoSessionToken = await loginWithPin(t, beto.pin);
    const matchId = await seedMatch(t, NOW + 60_000);
    await t.mutation(api.predictions.upsertPrediction, { sessionToken: betoSessionToken, matchId, homeScore: 0n, awayScore: 2n });
    await t.mutation(api.predictions.upsertPrediction, { sessionToken: anaSessionToken, matchId, homeScore: 1n, awayScore: 0n });
    await t.run((ctx) => ctx.db.patch(matchId, { status: "live", homeScore: 1n, awayScore: 0n }));

    await expect(t.query(api.predictions.listPublicMatchPredictions, { matchId })).resolves.toEqual([
      { playerName: "Ana", homeScore: 1n, awayScore: 0n },
      { playerName: "Beto", homeScore: 0n, awayScore: 2n },
    ]);
  });

  it("does not reveal public predictions for a scheduled match", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    const matchId = await seedMatch(t, NOW + 60_000);
    await t.mutation(api.predictions.upsertPrediction, { sessionToken, matchId, homeScore: 1n, awayScore: 0n });

    await expect(t.query(api.predictions.listPublicMatchPredictions, { matchId })).rejects.toThrow("Match predictions are private until kickoff");
  });

  it("lets operators inspect scheduled match votes and pending players", async () => {
    const t = createTest();
    const operator = await seedOperator(t);
    const ana = await seedPlayer(t, { displayName: "Ana", pin: "A1B2" });
    await seedPlayer(t, { displayName: "Beto", pin: "B2C3" });
    const anaSessionToken = await loginWithPin(t, ana.pin);
    const operatorSessionToken = await loginOperatorWithPin(t, operator.pin);
    const matchId = await seedMatch(t, NOW + 60_000);
    await t.mutation(api.predictions.upsertPrediction, { sessionToken: anaSessionToken, matchId, homeScore: 3n, awayScore: 1n });

    await expect(t.query(api.predictions.listOperatorMatchVotes, { sessionToken: operatorSessionToken })).resolves.toMatchObject({
      matches: [
        {
          matchId,
          totalPlayers: 2,
          votedCount: 1,
          votes: [
            { playerName: "Ana", homeScore: 3n, awayScore: 1n, hasPrediction: true },
            { playerName: "Beto", hasPrediction: false },
          ],
        },
      ],
    });
  });

  it("rejects fake operator sessions when inspecting votes", async () => {
    const t = createTest();

    await expect(t.query(api.predictions.listOperatorMatchVotes, { sessionToken: "fake-token" })).rejects.toThrow("Not authenticated");
  });
});

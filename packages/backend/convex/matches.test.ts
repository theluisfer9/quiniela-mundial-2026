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
    stageLabel = "Group A",
  }: { kickoffAt?: number; stageLabel?: string } = {},
) {
  const { argentinaId, brazilId } = await seedTeams(t);

  return await t.run((ctx) =>
    ctx.db.insert("matches", {
      kickoffAt,
      homeTeamId: argentinaId,
      awayTeamId: brazilId,
      stageLabel,
      status: "scheduled",
    }),
  );
}

describe("matches.listHomeMatches", () => {
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
    const matchId = await seedMatch(t, { kickoffAt: NOW + 60_000, stageLabel: "Opening Match" });
    await seedMatch(t, { kickoffAt: NOW - 60_000, stageLabel: "Past Match" });

    const result = await t.query(api.matches.listHomeMatches, { sessionToken });

    expect(result.upcomingMatches).toEqual([
      {
        matchId,
        kickoffAt: NOW + 60_000,
        stageLabel: "Opening Match",
        homeTeam: {
          id: expect.any(String),
          code: "ARG",
          name: "Argentina",
          flagEmoji: "ARG",
        },
        awayTeam: {
          id: expect.any(String),
          code: "BRA",
          name: "Brazil",
          flagEmoji: "BRA",
        },
        hasPrediction: false,
      },
    ]);
    expect(result.pendingCount).toBe(1);
    expect(result.nextKickoff).toEqual({ kickoffAt: NOW + 60_000, matchCount: 1 });
  });

  it("scopes hasPrediction and pendingCount to the session player", async () => {
    const t = createTest();
    const ana = await seedPlayer(t, { displayName: "Ana", pin: "A1B2" });
    const beto = await seedPlayer(t, { displayName: "Beto", pin: "B2C3" });
    const anaSessionToken = await loginWithPin(t, ana.pin);
    const betoSessionToken = await loginWithPin(t, beto.pin);
    const firstMatchId = await seedMatch(t, { kickoffAt: NOW + 60_000, stageLabel: "First" });
    const secondMatchId = await seedMatch(t, { kickoffAt: NOW + 120_000, stageLabel: "Second" });

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

  it("rejects deactivated player sessions", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = await loginWithPin(t, player.pin);
    await seedMatch(t);

    await t.run((ctx) => ctx.db.patch(player.playerId, { active: false, updatedAt: NOW }));

    await expect(t.query(api.matches.listHomeMatches, { sessionToken })).rejects.toThrow("Not authenticated");
  });
});

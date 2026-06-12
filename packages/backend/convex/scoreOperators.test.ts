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
  "./scoreOperators.ts": async () => await import("./scoreOperators"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

async function seedOperator(t: TestInstance, { displayName = "Marcador", pin = "M1M1", active = true } = {}) {
  const pinHash = await hashPin(pin, TEST_PEPPER);
  const operatorId = await t.run((ctx) =>
    ctx.db.insert("scoreOperators", {
      active,
      createdAt: NOW,
      displayName,
      pinHash,
      updatedAt: NOW,
    }),
  );

  return { operatorId, displayName, pin };
}

async function seedTeams(t: TestInstance) {
  return await t.run(async (ctx) => ({
    argentinaId: await ctx.db.insert("teams", { code: "ARG", name: "Argentina", flagEmoji: "ARG" }),
    brazilId: await ctx.db.insert("teams", { code: "BRA", name: "Brazil", flagEmoji: "BRA" }),
  }));
}

async function seedMatch(t: TestInstance, overrides: Record<string, unknown> = {}) {
  const { argentinaId, brazilId } = await seedTeams(t);

  return await t.run((ctx) =>
    ctx.db.insert("matches", {
      awayTeamId: brazilId,
      homeTeamId: argentinaId,
      kickoffAt: NOW,
      stageLabel: "Group A",
      status: "scheduled",
      ...overrides,
    }),
  );
}

describe("score operators", () => {
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

  it("logs in from the shared PIN endpoint as an operator", async () => {
    const t = createTest();
    const operator = await seedOperator(t);

    const result = await t.mutation(api.players.loginWithPin, { pin: operator.pin });

    expect(result).toMatchObject({
      status: "ok_operator",
      operator: { operatorId: operator.operatorId, displayName: operator.displayName },
    });
    expect(result.sessionToken).toBeString();
    expect(await t.run((ctx) => ctx.db.query("scoreOperatorSessions").collect())).toHaveLength(1);
  });

  it("lets an operator list manageable matches", async () => {
    const t = createTest();
    const operator = await seedOperator(t);
    const session = await t.mutation(api.players.loginWithPin, { pin: operator.pin });
    const matchId = await seedMatch(t, { homeScore: 0n, awayScore: 1n, status: "live" });

    const result = await t.query(api.matches.listManageableMatches, { sessionToken: session.sessionToken });

    expect(result.matches[0]).toMatchObject({
      matchId,
      homeScore: 0,
      awayScore: 1,
      status: "live",
      homeTeam: { name: "Argentina" },
      awayTeam: { name: "Brasil" },
    });
  });

  it("only lists live matches as manageable", async () => {
    const t = createTest();
    const operator = await seedOperator(t);
    const session = await t.mutation(api.players.loginWithPin, { pin: operator.pin });
    const liveMatchId = await seedMatch(t, { homeScore: 0n, awayScore: 1n, status: "live" });
    await seedMatch(t, { kickoffAt: NOW + 60_000, status: "scheduled" });
    await seedMatch(t, { homeScore: 2n, awayScore: 1n, kickoffAt: NOW - 60_000, status: "finished" });

    const result = await t.query(api.matches.listManageableMatches, { sessionToken: session.sessionToken });

    expect(result.matches.map((match: { matchId: string }) => match.matchId)).toEqual([liveMatchId]);
  });

  it("updates scores with an operator session without the global env flag", async () => {
    const t = createTest();
    const operator = await seedOperator(t);
    const session = await t.mutation(api.players.loginWithPin, { pin: operator.pin });
    const matchId = await seedMatch(t, { homeScore: 0n, awayScore: 0n, status: "live" });

    await expect(t.mutation(api.matches.updateMatchScoreWithOperatorSession, {
      awayScore: 1,
      homeScore: 2,
      matchId,
      sessionToken: session.sessionToken,
      status: "live",
    })).resolves.toEqual({
      awayScore: 1,
      homeScore: 2,
      matchId,
      status: "live",
    });

    await expect(t.run((ctx) => ctx.db.get(matchId))).resolves.toMatchObject({
      awayScore: 1n,
      homeScore: 2n,
      status: "live",
    });
  });

  it("rejects operator updates for matches that are not currently live", async () => {
    const t = createTest();
    const operator = await seedOperator(t);
    const session = await t.mutation(api.players.loginWithPin, { pin: operator.pin });
    const scheduledMatchId = await seedMatch(t, { status: "scheduled" });
    const finishedMatchId = await seedMatch(t, { homeScore: 1n, awayScore: 0n, status: "finished" });

    await expect(t.mutation(api.matches.updateMatchScoreWithOperatorSession, {
      awayScore: 1,
      homeScore: 2,
      matchId: scheduledMatchId,
      sessionToken: session.sessionToken,
      status: "live",
    })).rejects.toThrow("Only live matches can be updated");

    await expect(t.mutation(api.matches.updateMatchScoreWithOperatorSession, {
      awayScore: 1,
      homeScore: 2,
      matchId: finishedMatchId,
      sessionToken: session.sessionToken,
      status: "finished",
    })).rejects.toThrow("Only live matches can be updated");
  });

  it("rejects fake operator sessions for score updates", async () => {
    const t = createTest();
    const matchId = await seedMatch(t);

    await expect(t.mutation(api.matches.updateMatchScoreWithOperatorSession, {
      awayScore: 1,
      homeScore: 2,
      matchId,
      sessionToken: "fake-token",
      status: "live",
    })).rejects.toThrow("Not authenticated");
  });
});

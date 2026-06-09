import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { convexTest, type TestConvex } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();

type TestInstance = TestConvex<typeof schema>;

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./auth.ts": async () => await import("./auth"),
  "./matches.ts": async () => await import("./matches"),
  "./profiles.ts": async () => await import("./profiles"),
  "./standings.ts": async () => await import("./standings"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

async function seedTeams(t: TestInstance) {
  return await t.run(async (ctx) => {
    const argentinaId = await ctx.db.insert("teams", { code: "ARG", name: "Argentina", flagEmoji: "🇦🇷" });
    const brazilId = await ctx.db.insert("teams", { code: "BRA", name: "Brazil", flagEmoji: "🇧🇷" });
    const mexicoId = await ctx.db.insert("teams", { code: "MEX", name: "Mexico", flagEmoji: "🇲🇽" });

    return { argentinaId, brazilId, mexicoId };
  });
}

describe("Task 2 handlers", () => {
  const realNow = Date.now;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTestFallback = process.env.CONVEX_TEST_AUTH_FALLBACK;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.SITE_URL = "http://localhost:3000";
    process.env.CONVEX_TEST_AUTH_FALLBACK = "true";
    Date.now = () => NOW;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalTestFallback === undefined) {
      delete process.env.CONVEX_TEST_AUTH_FALLBACK;
    } else {
      process.env.CONVEX_TEST_AUTH_FALLBACK = originalTestFallback;
    }
    Date.now = realNow;
  });

  describe("standings.getHomeStandings", () => {
    it("computes standings rows from finished matches without exposing raw predictions", async () => {
      const t = createTest();
      const asAna = t.withIdentity({ name: "Ana", email: "ana@example.com", tokenIdentifier: "test|ana" });
      const asBeto = t.withIdentity({ name: "Beto", email: "beto@example.com", tokenIdentifier: "test|beto" });
      const { argentinaId, brazilId, mexicoId } = await seedTeams(t);
      await t.run(async (ctx) => {
        await ctx.db.insert("profiles", { userId: "test|ana", displayName: "Ana" });
        await ctx.db.insert("profiles", { userId: "test|beto", displayName: "Beto" });
      });

      const matchOneId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW - 120_000,
          homeTeamId: argentinaId,
          awayTeamId: brazilId,
          stageLabel: "Group A",
          status: "finished",
          homeScore: 2n,
          awayScore: 1n,
        }),
      );
      const matchTwoId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW - 60_000,
          homeTeamId: mexicoId,
          awayTeamId: brazilId,
          stageLabel: "Group B",
          status: "finished",
          homeScore: 0n,
          awayScore: 0n,
        }),
      );

      await t.run(async (ctx) => {
        await ctx.db.insert("predictions", {
          userId: "test|ana",
          matchId: matchOneId,
          homeScore: 2n,
          awayScore: 1n,
          updatedAt: NOW - 180_000,
        });
        await ctx.db.insert("predictions", {
          userId: "test|ana",
          matchId: matchTwoId,
          homeScore: 1n,
          awayScore: 1n,
          updatedAt: NOW - 90_000,
        });
        await ctx.db.insert("predictions", {
          userId: "test|beto",
          matchId: matchOneId,
          homeScore: 1n,
          awayScore: 0n,
          updatedAt: NOW - 180_000,
        });
        await ctx.db.insert("predictions", {
          userId: "test|beto",
          matchId: matchTwoId,
          homeScore: 1n,
          awayScore: 0n,
          updatedAt: NOW - 90_000,
        });
      });

      const standings = await asAna.query(api.standings.getHomeStandings, {});

      expect(standings).toEqual([
        {
          rank: 1,
          name: "Ana",
          points: 4,
          rankDelta: 0,
          isCurrentUser: true,
        },
        {
          rank: 2,
          name: "Beto",
          points: 1,
          rankDelta: 0,
          isCurrentUser: false,
        },
      ]);
      expect(standings[0]).not.toHaveProperty("predictions");
    });
  });
});

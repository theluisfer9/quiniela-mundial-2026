import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { convexTest } from "convex-test";

import schema from "./schema";
import { listHomeMatches } from "./matches";
import { listMyPredictions, upsertPrediction } from "./predictions";
import { ensureCurrentProfile } from "./profiles";
import { getHomeStandings } from "./standings";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();

type TestInstance = ReturnType<typeof convexTest<typeof schema>>;

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./auth.ts": async () => await import("./auth"),
  "./matches.ts": async () => await import("./matches"),
  "./predictions.ts": async () => await import("./predictions"),
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

  describe("profiles.ensureCurrentProfile", () => {
    it("rejects unauthenticated callers", async () => {
      const t = createTest();

      await expect(t.mutation(ensureCurrentProfile, {})).rejects.toThrow("Not authenticated");
    });

    it("creates a profile once and reuses it on later calls", async () => {
      const t = createTest();
      const asAna = t.withIdentity({
        name: "Ana",
        email: "ana@example.com",
        tokenIdentifier: "test|ana",
      });

      const first = await asAna.mutation(ensureCurrentProfile, {});
      const second = await asAna.mutation(ensureCurrentProfile, {});

      expect(first.created).toBe(true);
      expect(second.created).toBe(false);
      expect(second.profileId).toBe(first.profileId);
      expect(second.displayName).toBe("Ana");

      const profiles = await t.run((ctx) => ctx.db.query("profiles").collect());
      expect(profiles).toHaveLength(1);
      expect(profiles[0]?.userId).toBe("test|ana");
    });

    it("uses a privacy-safe generic fallback when auth name is blank", async () => {
      const t = createTest();
      const asAnonymous = t.withIdentity({
        name: "   ",
        email: "hidden@example.com",
        tokenIdentifier: "test|anonymous",
      });

      const profile = await asAnonymous.mutation(ensureCurrentProfile, {});

      expect(profile.displayName).toBe("Participante");
    });
  });

  describe("predictions.upsertPrediction", () => {
    it("rejects unauthenticated callers", async () => {
      const t = createTest();
      const { argentinaId, brazilId } = await seedTeams(t);
      const matchId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW + 60_000,
          homeTeamId: argentinaId,
          awayTeamId: brazilId,
          stageLabel: "Group A",
          status: "scheduled",
        }),
      );

      await expect(
        t.mutation(upsertPrediction, { matchId, homeScore: 1n, awayScore: 0n }),
      ).rejects.toThrow("Not authenticated");
    });

    it("rejects locked matches", async () => {
      const t = createTest();
      const asAna = t.withIdentity({ name: "Ana", email: "ana@example.com", tokenIdentifier: "test|ana" });
      const { argentinaId, brazilId } = await seedTeams(t);
      const matchId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW,
          homeTeamId: argentinaId,
          awayTeamId: brazilId,
          stageLabel: "Group A",
          status: "scheduled",
        }),
      );

      await expect(
        asAna.mutation(upsertPrediction, { matchId, homeScore: 1n, awayScore: 0n }),
      ).rejects.toThrow("Match is locked");
    });

    it("rejects invalid scores", async () => {
      const t = createTest();
      const asAna = t.withIdentity({ name: "Ana", email: "ana@example.com", tokenIdentifier: "test|ana" });
      const { argentinaId, brazilId } = await seedTeams(t);
      const matchId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW + 60_000,
          homeTeamId: argentinaId,
          awayTeamId: brazilId,
          stageLabel: "Group A",
          status: "scheduled",
        }),
      );

      await expect(
        asAna.mutation(upsertPrediction, { matchId, homeScore: -1n, awayScore: 0n }),
      ).rejects.toThrow("Score must be between 0 and 20");
    });

    it("upserts one prediction row for the current user", async () => {
      const t = createTest();
      const asAna = t.withIdentity({ name: "Ana", email: "ana@example.com", tokenIdentifier: "test|ana" });
      const { argentinaId, brazilId } = await seedTeams(t);
      const matchId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW + 60_000,
          homeTeamId: argentinaId,
          awayTeamId: brazilId,
          stageLabel: "Group A",
          status: "scheduled",
        }),
      );

      const first = await asAna.mutation(upsertPrediction, { matchId, homeScore: 1n, awayScore: 0n });
      const second = await asAna.mutation(upsertPrediction, { matchId, homeScore: 2n, awayScore: 1n });

      expect(first.status).toBe("saved");
      expect(second.status).toBe("saved");

      const predictions = await t.run((ctx) =>
        ctx.db
          .query("predictions")
          .withIndex("by_match_id", (q) => q.eq("matchId", matchId))
          .collect(),
      );

      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toMatchObject({ userId: "test|ana", homeScore: 2n, awayScore: 1n });
    });
  });

  describe("predictions.listMyPredictions", () => {
    it("returns only the current user's predictions", async () => {
      const t = createTest();
      const asAna = t.withIdentity({ name: "Ana", email: "ana@example.com", tokenIdentifier: "test|ana" });
      const asBeto = t.withIdentity({ name: "Beto", email: "beto@example.com", tokenIdentifier: "test|beto" });
      const { argentinaId, brazilId, mexicoId } = await seedTeams(t);
      const matchId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW + 60_000,
          homeTeamId: argentinaId,
          awayTeamId: brazilId,
          stageLabel: "Group A",
          status: "scheduled",
        }),
      );
      const otherMatchId = await t.run((ctx) =>
        ctx.db.insert("matches", {
          kickoffAt: NOW + 120_000,
          homeTeamId: mexicoId,
          awayTeamId: brazilId,
          stageLabel: "Group B",
          status: "scheduled",
        }),
      );

      await asAna.mutation(upsertPrediction, { matchId, homeScore: 1n, awayScore: 0n });
      await asBeto.mutation(upsertPrediction, { matchId: otherMatchId, homeScore: 0n, awayScore: 2n });

      const mine = await asAna.query(listMyPredictions, {});

      expect(mine).toEqual([
        {
          matchId,
          homeScore: 1n,
          awayScore: 0n,
          updatedAt: expect.any(Number),
        },
      ]);
    });
  });

  describe("standings.getHomeStandings", () => {
    it("computes standings rows from finished matches without exposing raw predictions", async () => {
      const t = createTest();
      const asAna = t.withIdentity({ name: "Ana", email: "ana@example.com", tokenIdentifier: "test|ana" });
      const asBeto = t.withIdentity({ name: "Beto", email: "beto@example.com", tokenIdentifier: "test|beto" });
      const { argentinaId, brazilId, mexicoId } = await seedTeams(t);
      await asAna.mutation(ensureCurrentProfile, {});
      await asBeto.mutation(ensureCurrentProfile, {});

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

      const standings = await asAna.query(getHomeStandings, {});

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

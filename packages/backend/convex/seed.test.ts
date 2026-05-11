import { describe, expect, it } from "bun:test";
import { convexTest } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { seededGroupStageTeams } from "./lib/worldCup2026GroupStage";

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./seed.ts": async () => await import("./seed"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

describe("seedGroupStage", () => {
  it("rejects callers unless confirmReset is true", async () => {
    const t = createTest();

    await expect(t.mutation(api.seed.seedGroupStage, { confirmReset: false })).rejects.toThrow(
      "confirmReset must be true",
    );
  });

  it("replaces teams, matches, and predictions with the seeded group stage", async () => {
    const t = createTest();

    await t.run(async (ctx) => {
      const homeTeamId = await ctx.db.insert("teams", { code: "OLD", name: "Old Team" });
      const awayTeamId = await ctx.db.insert("teams", { code: "LEG", name: "Legacy Team" });
      const matchId = await ctx.db.insert("matches", {
        kickoffAt: Date.UTC(2025, 0, 1, 18),
        homeTeamId,
        awayTeamId,
        stageLabel: "Legacy",
        status: "scheduled",
      });

      await ctx.db.insert("predictions", {
        userId: "test|seed",
        matchId,
        homeScore: 1n,
        awayScore: 0n,
        updatedAt: Date.UTC(2025, 0, 1, 12),
      });
    });

    const result = await t.mutation(api.seed.seedGroupStage, { confirmReset: true });

    expect(result.inserted.teams).toBe(seededGroupStageTeams.length);
    expect(result.inserted.matches).toBe(72);
    expect(result.deleted.teams).toBe(2);
    expect(result.deleted.matches).toBe(1);
    expect(result.deleted.predictions).toBe(1);

    const data = await t.run(async (ctx) => ({
      teams: await ctx.db.query("teams").collect(),
      matches: await ctx.db.query("matches").collect(),
      predictions: await ctx.db.query("predictions").collect(),
    }));

    expect(data.teams).toHaveLength(seededGroupStageTeams.length);
    expect(data.matches).toHaveLength(72);
    expect(data.predictions).toHaveLength(0);
    expect(data.teams.some((team) => team.code === "MEX" && team.groupCode === "A")).toBe(true);
    expect(data.matches.some((match) => match.matchNumber === 1 && match.stageLabel === "Group A")).toBe(true);
  });
});

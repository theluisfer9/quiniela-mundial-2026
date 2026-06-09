import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { convexTest } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { hashPin } from "./lib/pinAccess";
import { SEEDED_PROFILE_TIMESTAMP, seededPlayers } from "./lib/seedPlayers";
import { seededGroupStageTeams } from "./lib/worldCup2026GroupStage";

const TEST_PEPPER = "test-pepper";
const SEEDED_PLAYER_NAMES = seededPlayers.map((player) => player.displayName);

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./seed.ts": async () => await import("./seed"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

describe("seedGroupStage", () => {
  const originalPinPepper = process.env.PIN_PEPPER;
  const originalEnableSeedReset = process.env.ENABLE_SEED_RESET;

  beforeEach(() => {
    process.env.PIN_PEPPER = TEST_PEPPER;
    process.env.ENABLE_SEED_RESET = "true";
  });

  afterEach(() => {
    if (originalPinPepper === undefined) {
      delete process.env.PIN_PEPPER;
    } else {
      process.env.PIN_PEPPER = originalPinPepper;
    }

    if (originalEnableSeedReset === undefined) {
      delete process.env.ENABLE_SEED_RESET;
    } else {
      process.env.ENABLE_SEED_RESET = originalEnableSeedReset;
    }
  });

  it("rejects callers unless confirmReset is true", async () => {
    const t = createTest();

    await expect(t.mutation(api.seed.seedGroupStage, { confirmReset: false })).rejects.toThrow(
      "confirmReset must be true",
    );
  });

  it("rejects destructive reset unless seed reset is enabled server-side", async () => {
    const t = createTest();
    delete process.env.ENABLE_SEED_RESET;

    await expect(t.mutation(api.seed.seedGroupStage, { confirmReset: true })).rejects.toThrow(
      "Seed reset is not enabled",
    );
  });

  it("replaces teams, matches, predictions, and PIN access data with the seeded group stage and players", async () => {
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

      const profileId = await ctx.db.insert("profiles", {
        displayName: "Legacy Player",
        pinHash: await hashPin("A1B2", TEST_PEPPER),
        active: true,
        createdAt: Date.UTC(2025, 0, 1, 12),
        updatedAt: Date.UTC(2025, 0, 1, 12),
      });

      await ctx.db.insert("playerSessions", {
        playerId: profileId,
        tokenHash: "legacy-token-hash",
        createdAt: Date.UTC(2025, 0, 1, 12),
        lastUsedAt: Date.UTC(2025, 0, 1, 12),
        expiresAt: Date.UTC(2025, 0, 31, 12),
      });
      await ctx.db.insert("pinLoginAttempts", {
        pinHash: "legacy-pin-hash",
        failureCount: 2,
        updatedAt: Date.UTC(2025, 0, 1, 12),
      });
    });

    const result = await t.mutation(api.seed.seedGroupStage, { confirmReset: true });

    expect(result.inserted.teams).toBe(seededGroupStageTeams.length);
    expect(result.inserted.matches).toBe(72);
    expect(result.inserted.players).toBe(seededPlayers.length);
    expect(result.deleted.teams).toBe(2);
    expect(result.deleted.matches).toBe(1);
    expect(result.deleted.predictions).toBe(1);
    expect(result.deleted.profiles).toBe(1);
    expect(result.deleted.playerSessions).toBe(1);
    expect(result.deleted.pinLoginAttempts).toBe(1);

    const data = await t.run(async (ctx) => ({
      teams: await ctx.db.query("teams").collect(),
      matches: await ctx.db.query("matches").collect(),
      predictions: await ctx.db.query("predictions").collect(),
      profiles: await ctx.db.query("profiles").collect(),
      playerSessions: await ctx.db.query("playerSessions").collect(),
      pinLoginAttempts: await ctx.db.query("pinLoginAttempts").collect(),
    }));

    expect(data.teams).toHaveLength(seededGroupStageTeams.length);
    expect(data.matches).toHaveLength(72);
    expect(data.predictions).toHaveLength(0);
    expect(data.playerSessions).toHaveLength(0);
    expect(data.pinLoginAttempts).toHaveLength(0);
    expect(data.teams.some((team) => team.code === "MEX" && team.groupCode === "A")).toBe(true);
    expect(data.matches.some((match) => match.matchNumber === 1 && match.stageLabel === "Group A")).toBe(true);

    expect(data.profiles.map((profile) => profile.displayName)).toEqual(SEEDED_PLAYER_NAMES);
    expect(data.profiles).toHaveLength(22);
    expect(data.profiles.every((profile) => profile.active === true)).toBe(true);
    expect(data.profiles.every((profile) => profile.createdAt === SEEDED_PROFILE_TIMESTAMP)).toBe(true);
    expect(data.profiles.every((profile) => profile.updatedAt === SEEDED_PROFILE_TIMESTAMP)).toBe(true);

    const pinHashes = data.profiles.map((profile) => profile.pinHash);
    expect(new Set(pinHashes).size).toBe(seededPlayers.length);
    for (const player of seededPlayers) {
      expect(pinHashes).not.toContain(player.pin);
    }

    const serializedProfiles = JSON.stringify(data.profiles);
    for (const player of seededPlayers.slice(0, 3)) {
      expect(serializedProfiles).not.toContain(player.pin);
    }
  });

  it("rejects clearly when PIN_PEPPER is missing", async () => {
    const t = createTest();
    delete process.env.PIN_PEPPER;

    await expect(t.mutation(api.seed.seedGroupStage, { confirmReset: true })).rejects.toThrow(
      "PIN access is not configured",
    );
  });
});

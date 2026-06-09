import { describe, expect, it } from "bun:test";
import { convexTest } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./profiles.ts": async () => await import("./profiles"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

describe("profiles.listActivePlayers", () => {
  it("returns active players and excludes inactive or legacy profiles", async () => {
    const t = createTest();

    const { activePlayerId } = await t.run(async (ctx) => {
      const activePlayerId = await ctx.db.insert("profiles", {
        displayName: "Ana",
        pinHash: "hash:ana",
        active: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
      await ctx.db.insert("profiles", {
        displayName: "Beto",
        pinHash: "hash:beto",
        active: false,
        createdAt: NOW,
        updatedAt: NOW,
      });
      await ctx.db.insert("profiles", {
        userId: "test|legacy",
        displayName: "Legacy",
        active: true,
      });

      return { activePlayerId };
    });

    const players = await t.query(api.profiles.listActivePlayers, {});

    expect(players).toEqual([{ playerId: activePlayerId, displayName: "Ana" }]);
  });
});

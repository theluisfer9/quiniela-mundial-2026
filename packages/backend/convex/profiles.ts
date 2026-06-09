import { v } from "convex/values";

import { query } from "./_generated/server";

export const listActivePlayers = query({
  args: {},
  returns: v.array(
    v.object({
      playerId: v.id("profiles"),
      displayName: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const players = await ctx.db
      .query("profiles")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    return players.flatMap((player) =>
      player.pinHash ? [{ playerId: player._id, displayName: player.displayName }] : [],
    );
  },
});

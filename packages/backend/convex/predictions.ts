import { ConvexError, v } from "convex/values";

import { query, mutation } from "./_generated/server";
import { normalizeSoccerScore } from "./lib/scores";
import { isMatchLocked } from "./lib/visibility";
import { requirePlayerBySessionToken } from "./players";

const predictionSummary = v.object({
  matchId: v.id("matches"),
  homeScore: v.int64(),
  awayScore: v.int64(),
  updatedAt: v.number(),
});

export const upsertPrediction = mutation({
  args: {
    sessionToken: v.string(),
    matchId: v.id("matches"),
    homeScore: v.int64(),
    awayScore: v.int64(),
  },
  returns: v.object({
    status: v.literal("saved"),
    matchId: v.id("matches"),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const player = await requirePlayerBySessionToken(ctx, args.sessionToken);

    let homeScore: number;
    let awayScore: number;
    try {
      homeScore = normalizeSoccerScore(args.homeScore);
      awayScore = normalizeSoccerScore(args.awayScore);
    } catch (error) {
      throw new ConvexError(error instanceof Error ? error.message : "Invalid score");
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new ConvexError("Match not found");
    }

    if (isMatchLocked({ kickoff: match.kickoffAt, now: Date.now() })) {
      throw new ConvexError("Match is locked");
    }

    const existingPrediction = await ctx.db
      .query("predictions")
      .withIndex("by_player_id_match_id", (q) =>
        q.eq("playerId", player.playerId).eq("matchId", args.matchId),
      )
      .unique();
    const updatedAt = Date.now();

    if (existingPrediction) {
      await ctx.db.patch(existingPrediction._id, {
        homeScore: BigInt(homeScore),
        awayScore: BigInt(awayScore),
        updatedAt,
      });
    } else {
      await ctx.db.insert("predictions", {
        playerId: player.playerId,
        matchId: args.matchId,
        homeScore: BigInt(homeScore),
        awayScore: BigInt(awayScore),
        updatedAt,
      });
    }

    return {
      status: "saved" as const,
      matchId: args.matchId,
      updatedAt,
    };
  },
});

export const listMyPredictions = query({
  args: { sessionToken: v.string() },
  returns: v.array(predictionSummary),
  handler: async (ctx, args) => {
    const player = await requirePlayerBySessionToken(ctx, args.sessionToken);

    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_player_id_match_id", (q) => q.eq("playerId", player.playerId))
      .collect();

    return predictions.map((prediction) => ({
      matchId: prediction.matchId,
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
      updatedAt: prediction.updatedAt,
    }));
  },
});

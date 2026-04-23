import { ConvexError, v } from "convex/values";

import { query, mutation } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/currentUser";
import { normalizeSoccerScore } from "./lib/scores";
import { isMatchLocked } from "./lib/visibility";

const predictionSummary = v.object({
  matchId: v.id("matches"),
  homeScore: v.int64(),
  awayScore: v.int64(),
  updatedAt: v.number(),
});

export const upsertPrediction = mutation({
  args: {
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
    const authUser = await getCurrentUserOrNull(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const userId = authUser.userId;
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

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
      .withIndex("by_user_id_match_id", (q) =>
        q.eq("userId", userId).eq("matchId", args.matchId),
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
        userId,
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
  args: {},
  returns: v.array(predictionSummary),
  handler: async (ctx) => {
    const authUser = await getCurrentUserOrNull(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const userId = authUser.userId;
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_user_id_match_id", (q) => q.eq("userId", userId))
      .collect();

    return predictions.map((prediction) => ({
      matchId: prediction.matchId,
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
      updatedAt: prediction.updatedAt,
    }));
  },
});

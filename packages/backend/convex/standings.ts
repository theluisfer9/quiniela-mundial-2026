import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/currentUser";
import { buildStandingsRows } from "./lib/scoring";
import { normalizeSoccerScore } from "./lib/scores";

type FinishedMatch = Doc<"matches"> & {
  status: "finished";
  homeScore: bigint;
  awayScore: bigint;
};

function isFinishedMatch(match: Doc<"matches">): match is FinishedMatch {
  return match.status === "finished" && match.homeScore !== undefined && match.awayScore !== undefined;
}

const standingsRow = v.object({
  rank: v.number(),
  name: v.string(),
  points: v.number(),
  rankDelta: v.union(v.literal(-1), v.literal(0), v.literal(1)),
  isCurrentUser: v.boolean(),
});

export const getHomeStandings = query({
  args: {},
  returns: v.array(standingsRow),
  handler: async (ctx) => {
    const authUser = await getCurrentUserOrNull(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const userId = authUser.userId;
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const profiles = await ctx.db.query("profiles").collect();
    const finishedMatches = (await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect()).filter(isFinishedMatch);
    const predictionGroups = await Promise.all(
      finishedMatches.map((match) =>
        ctx.db.query("predictions").withIndex("by_match_id", (q) => q.eq("matchId", match._id)).collect(),
      ),
    );

    const matches = finishedMatches.map((match) => {
      try {
        return {
          id: match._id,
          homeScore: normalizeSoccerScore(match.homeScore),
          awayScore: normalizeSoccerScore(match.awayScore),
        };
      } catch (error) {
        throw new ConvexError(error instanceof Error ? error.message : "Invalid stored match score");
      }
    });

    const predictions = predictionGroups.flat().map((prediction) => {
      try {
        return {
          userId: prediction.userId,
          matchId: prediction.matchId,
          homeScore: normalizeSoccerScore(prediction.homeScore),
          awayScore: normalizeSoccerScore(prediction.awayScore),
        };
      } catch (error) {
        throw new ConvexError(error instanceof Error ? error.message : "Invalid stored prediction score");
      }
    });

    return buildStandingsRows({
      currentUserId: userId,
      profiles: profiles.map((profile) => ({
        userId: profile.userId,
        name: profile.displayName,
      })),
      matches,
      predictions,
    });
  },
});

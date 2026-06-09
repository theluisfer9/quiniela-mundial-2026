import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
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

async function getFinishedStandingsInputs(ctx: QueryCtx, publicOnly: boolean) {
  const profiles = (await ctx.db.query("profiles").collect()).filter((profile) =>
    publicOnly ? profile.pinHash !== undefined && profile.active === true : true,
  );
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

  const predictions = predictionGroups.flat().flatMap((prediction) => {
    const playerId = publicOnly ? prediction.playerId : (prediction.playerId ?? prediction.userId);
    if (!playerId) {
      return [];
    }

    try {
      return [{
        playerId,
        matchId: prediction.matchId,
        homeScore: normalizeSoccerScore(prediction.homeScore),
        awayScore: normalizeSoccerScore(prediction.awayScore),
      }];
    } catch (error) {
      throw new ConvexError(error instanceof Error ? error.message : "Invalid stored prediction score");
    }
  });

  return { profiles, matches, predictions };
}

export const getPublicStandings = query({
  args: {},
  returns: v.array(standingsRow),
  handler: async (ctx) => {
    const { profiles, matches, predictions } = await getFinishedStandingsInputs(ctx, true);

    return buildStandingsRows({
      currentPlayerId: null,
      profiles: profiles.map((profile) => ({
        playerId: profile._id,
        name: profile.displayName,
      })),
      matches,
      predictions,
    });
  },
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

    const { profiles, matches, predictions } = await getFinishedStandingsInputs(ctx, false);

    return buildStandingsRows({
      currentPlayerId: userId,
      profiles: profiles.map((profile) => ({
        playerId: profile.userId ?? profile._id,
        name: profile.displayName,
      })),
      matches,
      predictions,
    });
  },
});

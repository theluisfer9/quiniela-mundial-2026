import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/currentUser";

const teamSummary = v.object({
  id: v.id("teams"),
  code: v.string(),
  name: v.string(),
  flagEmoji: v.optional(v.string()),
});

const homeMatchSummary = v.object({
  matchId: v.id("matches"),
  kickoffAt: v.number(),
  stageLabel: v.string(),
  homeTeam: teamSummary,
  awayTeam: teamSummary,
  hasPrediction: v.boolean(),
});

const homeMatchesResult = v.object({
  upcomingMatches: v.array(homeMatchSummary),
  pendingCount: v.number(),
  nextKickoff: v.union(
    v.null(),
    v.object({
      kickoffAt: v.number(),
      matchCount: v.number(),
    }),
  ),
});

async function getTeamMap(ctx: QueryCtx, matches: Doc<"matches">[]) {
  const teamIds = new Set<Id<"teams">>();
  for (const match of matches) {
    teamIds.add(match.homeTeamId);
    teamIds.add(match.awayTeamId);
  }

  const teams = await Promise.all([...teamIds].map((teamId) => ctx.db.get(teamId)));
  return new Map(teams.filter((team): team is NonNullable<typeof team> => team !== null).map((team) => [team._id, team]));
}

export const listHomeMatches = query({
  args: {},
  returns: homeMatchesResult,
  handler: async (ctx) => {
    const authUser = await getCurrentUserOrNull(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const userId = authUser.userId;
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const now = Date.now();
    const allMatches = await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect();
    const upcomingMatches = allMatches.filter((match) => match.kickoffAt > now);
    const predictionDocs = await ctx.db
      .query("predictions")
      .withIndex("by_user_id_match_id", (q) => q.eq("userId", userId))
      .collect();
    const predictedMatchIds = new Set(predictionDocs.map((prediction) => prediction.matchId));
    const teamById = await getTeamMap(ctx, upcomingMatches);

    const upcomingMatchSummaries = upcomingMatches.flatMap((match) => {
      const homeTeam = teamById.get(match.homeTeamId);
      const awayTeam = teamById.get(match.awayTeamId);
      if (!homeTeam || !awayTeam) {
        return [];
      }

      return [{
        matchId: match._id,
        kickoffAt: match.kickoffAt,
        stageLabel: match.stageLabel,
        homeTeam: {
          id: homeTeam._id,
          code: homeTeam.code,
          name: homeTeam.name,
          flagEmoji: homeTeam.flagEmoji,
        },
        awayTeam: {
          id: awayTeam._id,
          code: awayTeam.code,
          name: awayTeam.name,
          flagEmoji: awayTeam.flagEmoji,
        },
        hasPrediction: predictedMatchIds.has(match._id),
      }];
    });

    const nextKickoffAt = upcomingMatchSummaries[0]?.kickoffAt;

    return {
      upcomingMatches: upcomingMatchSummaries,
      pendingCount: upcomingMatchSummaries.filter((match) => !match.hasPrediction).length,
      nextKickoff:
        nextKickoffAt === undefined
          ? null
          : {
              kickoffAt: nextKickoffAt,
              matchCount: upcomingMatchSummaries.filter((match) => match.kickoffAt === nextKickoffAt).length,
            },
    };
  },
});

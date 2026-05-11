import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import {
  buildSeededGroupStageMatches,
  seededGroupStageTeams,
} from "./lib/worldCup2026GroupStage";

export const seedGroupStage = mutation({
  args: {
    confirmReset: v.boolean(),
  },
  returns: v.object({
    deleted: v.object({
      predictions: v.number(),
      matches: v.number(),
      teams: v.number(),
    }),
    inserted: v.object({
      teams: v.number(),
      matches: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    if (!args.confirmReset) {
      throw new ConvexError("confirmReset must be true");
    }

    const predictions = await ctx.db.query("predictions").collect();
    const matches = await ctx.db.query("matches").collect();
    const teams = await ctx.db.query("teams").collect();

    for (const prediction of predictions) {
      await ctx.db.delete(prediction._id);
    }
    for (const match of matches) {
      await ctx.db.delete(match._id);
    }
    for (const team of teams) {
      await ctx.db.delete(team._id);
    }

    const teamIdByCode = new Map<string, Id<"teams">>();

    for (const team of seededGroupStageTeams) {
      const teamId = await ctx.db.insert("teams", team);
      teamIdByCode.set(team.code, teamId);
    }

    const seededMatches = buildSeededGroupStageMatches();
    for (const match of seededMatches) {
      const homeTeamId = teamIdByCode.get(match.homeTeamCode);
      const awayTeamId = teamIdByCode.get(match.awayTeamCode);

      if (!homeTeamId || !awayTeamId) {
        throw new ConvexError(`Missing team for match ${match.matchNumber}`);
      }

      await ctx.db.insert("matches", {
        kickoffAt: match.kickoffAt,
        homeTeamId,
        awayTeamId,
        stageLabel: match.stageLabel,
        matchNumber: match.matchNumber,
        venue: match.venue,
        status: match.status,
      });
    }

    return {
      deleted: {
        predictions: predictions.length,
        matches: matches.length,
        teams: teams.length,
      },
      inserted: {
        teams: seededGroupStageTeams.length,
        matches: seededMatches.length,
      },
    };
  },
});

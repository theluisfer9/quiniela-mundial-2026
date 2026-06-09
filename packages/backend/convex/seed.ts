import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { getPinPepper, hashPin, normalizePin } from "./lib/pinAccess";
import { SEEDED_PROFILE_TIMESTAMP, seededPlayers } from "./lib/seedPlayers";
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
      playerSessions: v.number(),
      pinLoginAttempts: v.number(),
      matches: v.number(),
      teams: v.number(),
      profiles: v.number(),
    }),
    inserted: v.object({
      teams: v.number(),
      matches: v.number(),
      players: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    if (!args.confirmReset) {
      throw new ConvexError("confirmReset must be true");
    }
    if (process.env.ENABLE_SEED_RESET !== "true") {
      throw new ConvexError("Seed reset is not enabled");
    }

    const pinPepper = getPinPepper();
    const predictions = await ctx.db.query("predictions").collect();
    const playerSessions = await ctx.db.query("playerSessions").collect();
    const pinLoginAttempts = await ctx.db.query("pinLoginAttempts").collect();
    const matches = await ctx.db.query("matches").collect();
    const teams = await ctx.db.query("teams").collect();
    const profiles = await ctx.db.query("profiles").collect();

    for (const prediction of predictions) {
      await ctx.db.delete(prediction._id);
    }
    for (const playerSession of playerSessions) {
      await ctx.db.delete(playerSession._id);
    }
    for (const pinLoginAttempt of pinLoginAttempts) {
      await ctx.db.delete(pinLoginAttempt._id);
    }
    for (const match of matches) {
      await ctx.db.delete(match._id);
    }
    for (const team of teams) {
      await ctx.db.delete(team._id);
    }
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
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

    for (const player of seededPlayers) {
      await ctx.db.insert("profiles", {
        displayName: player.displayName,
        pinHash: await hashPin(normalizePin(player.pin), pinPepper),
        active: true,
        createdAt: SEEDED_PROFILE_TIMESTAMP,
        updatedAt: SEEDED_PROFILE_TIMESTAMP,
      });
    }

    return {
      deleted: {
        predictions: predictions.length,
        playerSessions: playerSessions.length,
        pinLoginAttempts: pinLoginAttempts.length,
        matches: matches.length,
        teams: teams.length,
        profiles: profiles.length,
      },
      inserted: {
        teams: seededGroupStageTeams.length,
        matches: seededMatches.length,
        players: seededPlayers.length,
      },
    };
  },
});

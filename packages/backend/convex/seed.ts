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

export const rotatePlayerPins = mutation({
  args: {
    confirmRotation: v.boolean(),
    players: v.array(
      v.object({
        displayName: v.string(),
        pin: v.string(),
      }),
    ),
  },
  returns: v.object({
    updatedPlayers: v.number(),
    revokedSessions: v.number(),
    clearedPinLoginAttempts: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!args.confirmRotation) {
      throw new ConvexError("confirmRotation must be true");
    }
    if (process.env.ENABLE_PIN_ROTATION !== "true") {
      throw new ConvexError("PIN rotation is not enabled");
    }

    const now = Date.now();
    const pinPepper = getPinPepper();
    const pins = new Set<string>();

    for (const player of args.players) {
      const normalizedPin = normalizePin(player.pin);
      if (pins.has(normalizedPin)) {
        throw new ConvexError(`Duplicate PIN for ${player.displayName}`);
      }
      pins.add(normalizedPin);
    }

    for (const player of args.players) {
      const profiles = await ctx.db
        .query("profiles")
        .filter((q) => q.eq(q.field("displayName"), player.displayName))
        .collect();
      const activeProfiles = profiles.filter((profile) => profile.active === true);

      if (activeProfiles.length !== 1) {
        throw new ConvexError(`Expected exactly one active player named ${player.displayName}`);
      }

      await ctx.db.patch(activeProfiles[0]._id, {
        pinHash: await hashPin(normalizePin(player.pin), pinPepper),
        updatedAt: now,
      });
    }

    const sessions = await ctx.db.query("playerSessions").collect();
    const pinLoginAttempts = await ctx.db.query("pinLoginAttempts").collect();

    for (const session of sessions) {
      if (session.revokedAt === undefined) {
        await ctx.db.patch(session._id, { revokedAt: now });
      }
    }

    for (const attempt of pinLoginAttempts) {
      await ctx.db.delete(attempt._id);
    }

    return {
      updatedPlayers: args.players.length,
      revokedSessions: sessions.filter((session) => session.revokedAt === undefined).length,
      clearedPinLoginAttempts: pinLoginAttempts.length,
    };
  },
});

export const updateTeamWorldRankings = mutation({
  args: {
    confirmUpdate: v.boolean(),
  },
  returns: v.object({
    updatedTeams: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!args.confirmUpdate) {
      throw new ConvexError("confirmUpdate must be true");
    }
    if (process.env.ENABLE_TEAM_RANKING_UPDATE !== "true") {
      throw new ConvexError("Team ranking update is not enabled");
    }

    let updatedTeams = 0;
    for (const seededTeam of seededGroupStageTeams) {
      const team = await ctx.db
        .query("teams")
        .withIndex("by_code", (q) => q.eq("code", seededTeam.code))
        .unique();
      if (!team || (team.worldRanking === seededTeam.worldRanking && team.flagEmoji === seededTeam.flagEmoji)) {
        continue;
      }

      await ctx.db.patch(team._id, { worldRanking: seededTeam.worldRanking, flagEmoji: seededTeam.flagEmoji });
      updatedTeams += 1;
    }

    return { updatedTeams };
  },
});

export const syncMatchResultsByNumber = mutation({
  args: {
    confirmSync: v.boolean(),
    results: v.array(v.object({
      matchNumber: v.number(),
      status: v.union(v.literal("live"), v.literal("finished")),
      homeScore: v.number(),
      awayScore: v.number(),
    })),
  },
  returns: v.object({
    updatedMatches: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!args.confirmSync) {
      throw new ConvexError("confirmSync must be true");
    }
    if (process.env.ENABLE_MATCH_RESULT_SYNC !== "true") {
      throw new ConvexError("Match result sync is not enabled");
    }

    let updatedMatches = 0;
    for (const result of args.results) {
      const matches = await ctx.db
        .query("matches")
        .filter((q) => q.eq(q.field("matchNumber"), result.matchNumber))
        .collect();
      if (matches.length !== 1) {
        throw new ConvexError(`Expected exactly one match with number ${result.matchNumber}`);
      }

      await ctx.db.patch(matches[0]._id, {
        status: result.status,
        homeScore: BigInt(result.homeScore),
        awayScore: BigInt(result.awayScore),
      });
      updatedMatches += 1;
    }

    return { updatedMatches };
  },
});

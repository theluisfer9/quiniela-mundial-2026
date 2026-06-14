import { ConvexError, v } from "convex/values";

import { query, mutation } from "./_generated/server";
import { normalizeSoccerScore } from "./lib/scores";
import { getSpanishStageLabel, getSpanishTeamName } from "./lib/teamDisplay";
import { isMatchLocked } from "./lib/visibility";
import { requirePlayerBySessionToken } from "./players";
import { requireScoreOperatorBySessionToken } from "./scoreOperators";

const predictionSummary = v.object({
  matchId: v.id("matches"),
  homeScore: v.int64(),
  awayScore: v.int64(),
  updatedAt: v.number(),
});

const publicPredictionSummary = v.object({
  playerName: v.string(),
  homeScore: v.int64(),
  awayScore: v.int64(),
});

const operatorMatchVote = v.object({
  playerName: v.string(),
  hasPrediction: v.boolean(),
  homeScore: v.optional(v.int64()),
  awayScore: v.optional(v.int64()),
  updatedAt: v.optional(v.number()),
});

const operatorMatchVoteSummary = v.object({
  matchId: v.id("matches"),
  kickoffAt: v.number(),
  stageLabel: v.string(),
  status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("finished")),
  homeTeamName: v.string(),
  awayTeamName: v.string(),
  totalPlayers: v.number(),
  votedCount: v.number(),
  votes: v.array(operatorMatchVote),
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

export const listPublicMatchPredictions = query({
  args: { matchId: v.id("matches") },
  returns: v.array(publicPredictionSummary),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new ConvexError("Match not found");
    }

    if (match.status === "scheduled") {
      throw new ConvexError("Match predictions are private until kickoff");
    }

    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_match_id", (q) => q.eq("matchId", args.matchId))
      .collect();
    const rows = await Promise.all(
      predictions.map(async (prediction) => {
        if (!prediction.playerId) {
          return null;
        }

        const profile = await ctx.db.get(prediction.playerId);
        if (!profile || profile.active !== true || !profile.pinHash) {
          return null;
        }

        return {
          playerName: profile.displayName,
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
        };
      }),
    );

    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((left, right) => left.playerName.localeCompare(right.playerName));
  },
});

export const listOperatorMatchVotes = query({
  args: { sessionToken: v.string() },
  returns: v.object({ matches: v.array(operatorMatchVoteSummary) }),
  handler: async (ctx, args) => {
    await requireScoreOperatorBySessionToken(ctx, args.sessionToken);

    const [matches, activeProfiles] = await Promise.all([
      ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect(),
      ctx.db.query("profiles").withIndex("by_active", (q) => q.eq("active", true)).collect(),
    ]);
    const players = activeProfiles
      .filter((profile) => profile.pinHash !== undefined)
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
    const teamIds = new Set(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId]));
    const teams = await Promise.all([...teamIds].map((teamId) => ctx.db.get(teamId)));
    const teamById = new Map(teams.filter((team): team is NonNullable<typeof team> => team !== null).map((team) => [team._id, team]));

    const rows = await Promise.all(matches.map(async (match) => {
      const homeTeam = teamById.get(match.homeTeamId);
      const awayTeam = teamById.get(match.awayTeamId);
      if (!homeTeam || !awayTeam) {
        return null;
      }

      const predictions = await ctx.db.query("predictions").withIndex("by_match_id", (q) => q.eq("matchId", match._id)).collect();
      const predictionByPlayerId = new Map(predictions.flatMap((prediction) => {
        if (!prediction.playerId) {
          return [];
        }

        return [[prediction.playerId, prediction]];
      }));
      const votes = players.map((player) => {
        const prediction = predictionByPlayerId.get(player._id);
        if (!prediction) {
          return {
            playerName: player.displayName,
            hasPrediction: false,
          };
        }

        return {
          playerName: player.displayName,
          hasPrediction: true,
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
          updatedAt: prediction.updatedAt,
        };
      });

      return {
        matchId: match._id,
        kickoffAt: match.kickoffAt,
        stageLabel: getSpanishStageLabel(match.stageLabel),
        status: match.status,
        homeTeamName: getSpanishTeamName(homeTeam.code, homeTeam.name),
        awayTeamName: getSpanishTeamName(awayTeam.code, awayTeam.name),
        totalPlayers: players.length,
        votedCount: votes.filter((vote) => vote.hasPrediction).length,
        votes,
      };
    }));

    return { matches: rows.filter((row): row is NonNullable<typeof row> => row !== null) };
  },
});

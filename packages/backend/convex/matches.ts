import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { calculatePredictionPoints, buildStandingsRows } from "./lib/scoring";
import { normalizeSoccerScore } from "./lib/scores";
import { requirePlayerBySessionToken } from "./players";

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

const publicMatchSummary = v.object({
  matchId: v.id("matches"),
  kickoffAt: v.number(),
  stageLabel: v.string(),
  status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("finished")),
  homeTeam: teamSummary,
  awayTeam: teamSummary,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
});

const publicDashboardResult = v.object({
  todayMatches: v.array(publicMatchSummary),
  upcomingMatches: v.array(publicMatchSummary),
  finishedMatches: v.array(publicMatchSummary),
  stats: v.object({
    leaderName: v.union(v.string(), v.null()),
    finishedMatchCount: v.number(),
    totalPredictionCountForFinishedMatches: v.number(),
    bestExactScoreCount: v.number(),
  }),
});

type FinishedMatch = Doc<"matches"> & {
  status: "finished";
  homeScore: bigint;
  awayScore: bigint;
};

async function getTeamMap(ctx: QueryCtx, matches: Doc<"matches">[]) {
  const teamIds = new Set<Id<"teams">>();
  for (const match of matches) {
    teamIds.add(match.homeTeamId);
    teamIds.add(match.awayTeamId);
  }

  const teams = await Promise.all([...teamIds].map((teamId) => ctx.db.get(teamId)));
  return new Map(teams.filter((team): team is NonNullable<typeof team> => team !== null).map((team) => [team._id, team]));
}

function getUtcDayRange(now: number) {
  const date = new Date(now);
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return { start, end: start + 86_400_000 };
}

function isFinishedMatch(match: Doc<"matches">): match is FinishedMatch {
  return match.status === "finished" && match.homeScore !== undefined && match.awayScore !== undefined;
}

function summarizePublicMatch(match: Doc<"matches">, teamById: Map<Id<"teams">, Doc<"teams">>) {
  const homeTeam = teamById.get(match.homeTeamId);
  const awayTeam = teamById.get(match.awayTeamId);
  if (!homeTeam || !awayTeam) {
    return null;
  }

  const summary: {
    matchId: Id<"matches">;
    kickoffAt: number;
    stageLabel: string;
    status: "scheduled" | "live" | "finished";
    homeTeam: { id: Id<"teams">; code: string; name: string; flagEmoji?: string };
    awayTeam: { id: Id<"teams">; code: string; name: string; flagEmoji?: string };
    homeScore?: number;
    awayScore?: number;
  } = {
    matchId: match._id,
    kickoffAt: match.kickoffAt,
    stageLabel: match.stageLabel,
    status: match.status,
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
  };

  if (isFinishedMatch(match)) {
    summary.homeScore = normalizeSoccerScore(match.homeScore);
    summary.awayScore = normalizeSoccerScore(match.awayScore);
  }

  return summary;
}

export const getPublicDashboardMatches = query({
  args: {},
  returns: publicDashboardResult,
  handler: async (ctx) => {
    const now = Date.now();
    const { start, end } = getUtcDayRange(now);
    const allMatches = await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect();
    const teamById = await getTeamMap(ctx, allMatches);
    const publicMatches = allMatches.flatMap((match) => {
      const summary = summarizePublicMatch(match, teamById);
      return summary ? [summary] : [];
    });
    const finishedMatches = allMatches.filter(isFinishedMatch);
    const predictionGroups = await Promise.all(
      finishedMatches.map((match) =>
        ctx.db.query("predictions").withIndex("by_match_id", (q) => q.eq("matchId", match._id)).collect(),
      ),
    );
    const activeProfiles = (await ctx.db.query("profiles").collect()).filter(
      (profile) => profile.pinHash !== undefined && profile.active === true,
    );
    const activePlayerIds = new Set(activeProfiles.map((profile) => profile._id));
    const standingsMatches = finishedMatches.map((match) => ({
      id: match._id,
      homeScore: normalizeSoccerScore(match.homeScore),
      awayScore: normalizeSoccerScore(match.awayScore),
    }));
    const finishedPredictions = predictionGroups.flat().flatMap((prediction) => {
      if (!prediction.playerId || !activePlayerIds.has(prediction.playerId)) {
        return [];
      }

      return [{
        playerId: prediction.playerId,
        matchId: prediction.matchId,
        homeScore: normalizeSoccerScore(prediction.homeScore),
        awayScore: normalizeSoccerScore(prediction.awayScore),
      }];
    });
    const standings = buildStandingsRows({
      currentPlayerId: null,
      profiles: activeProfiles.map((profile) => ({ playerId: profile._id, name: profile.displayName })),
      matches: standingsMatches,
      predictions: finishedPredictions,
    });
    const matchById = new Map(standingsMatches.map((match) => [match.id, match]));
    const exactScoreCounts = new Map<Id<"profiles">, number>();
    for (const prediction of finishedPredictions) {
      const match = matchById.get(prediction.matchId);
      if (
        match &&
        calculatePredictionPoints({
          predictedHome: prediction.homeScore,
          predictedAway: prediction.awayScore,
          actualHome: match.homeScore,
          actualAway: match.awayScore,
        }) === 3
      ) {
        exactScoreCounts.set(prediction.playerId, (exactScoreCounts.get(prediction.playerId) ?? 0) + 1);
      }
    }

    return {
      todayMatches: publicMatches.filter(
        (match) => match.status !== "finished" && match.kickoffAt >= start && match.kickoffAt < end,
      ),
      upcomingMatches: publicMatches.filter((match) => match.status !== "finished" && match.kickoffAt >= end),
      finishedMatches: publicMatches.filter((match) => match.status === "finished"),
      stats: {
        leaderName: standings[0]?.name ?? null,
        finishedMatchCount: finishedMatches.length,
        totalPredictionCountForFinishedMatches: finishedPredictions.length,
        bestExactScoreCount: Math.max(0, ...exactScoreCounts.values()),
      },
    };
  },
});

export const listHomeMatches = query({
  args: { sessionToken: v.string() },
  returns: homeMatchesResult,
  handler: async (ctx, args) => {
    const player = await requirePlayerBySessionToken(ctx, args.sessionToken);
    const now = Date.now();
    const allMatches = await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect();
    const upcomingMatches = allMatches.filter((match) => match.kickoffAt > now);
    const predictionDocs = await ctx.db
      .query("predictions")
      .withIndex("by_player_id_match_id", (q) => q.eq("playerId", player.playerId))
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

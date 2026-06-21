import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type QueryCtx } from "./_generated/server";
import { normalizeSoccerScore } from "./lib/scores";
import { getSpanishStageLabel, getSpanishTeamName } from "./lib/teamDisplay";
import { requirePlayerBySessionToken } from "./players";
import { requireScoreOperatorBySessionToken } from "./scoreOperators";

const teamSummary = v.object({
  id: v.id("teams"),
  code: v.string(),
  name: v.string(),
  flagEmoji: v.optional(v.string()),
});

const calendarTeamSummary = v.object({
  id: v.id("teams"),
  code: v.string(),
  name: v.string(),
  flagEmoji: v.optional(v.string()),
  groupCode: v.optional(v.string()),
  worldRanking: v.optional(v.number()),
});

const homeMatchSummary = v.object({
  matchId: v.id("matches"),
  kickoffAt: v.number(),
  stageLabel: v.string(),
  status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("finished")),
  homeTeam: teamSummary,
  awayTeam: teamSummary,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
  hasPrediction: v.boolean(),
});

const homeMatchesResult = v.object({
  upcomingMatches: v.array(homeMatchSummary),
  historicalMatches: v.array(homeMatchSummary),
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
  liveMatches: v.array(publicMatchSummary),
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

const publicCalendarMatch = v.object({
  matchId: v.id("matches"),
  kickoffAt: v.number(),
  stageLabel: v.string(),
  groupCode: v.union(v.string(), v.null()),
  matchNumber: v.optional(v.number()),
  venue: v.optional(v.string()),
  status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("finished")),
  homeTeam: calendarTeamSummary,
  awayTeam: calendarTeamSummary,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
});

const publicCalendarResult = v.object({
  matches: v.array(publicCalendarMatch),
});

const manageableMatchesResult = v.object({
  matches: v.array(publicMatchSummary),
});

const markStartedMatchesLiveResult = v.object({
  updatedMatches: v.number(),
});

type FinishedMatch = Doc<"matches"> & {
  status: "finished";
  homeScore: bigint;
  awayScore: bigint;
};

type ScoredMatch = Doc<"matches"> & {
  status: "live" | "finished";
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

function getGuatemalaDayKey(timestamp: number) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Guatemala",
    year: "numeric",
  }).format(new Date(timestamp));
}

function isFinishedMatch(match: Doc<"matches">): match is FinishedMatch {
  return match.status === "finished" && match.homeScore !== undefined && match.awayScore !== undefined;
}

function isScoredMatch(match: Doc<"matches">): match is ScoredMatch {
  return (match.status === "live" || match.status === "finished") &&
    match.homeScore !== undefined &&
    match.awayScore !== undefined;
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
    stageLabel: getSpanishStageLabel(match.stageLabel),
    status: match.status,
    homeTeam: {
      id: homeTeam._id,
      code: homeTeam.code,
      name: getSpanishTeamName(homeTeam.code, homeTeam.name),
      flagEmoji: homeTeam.flagEmoji,
    },
    awayTeam: {
      id: awayTeam._id,
      code: awayTeam.code,
      name: getSpanishTeamName(awayTeam.code, awayTeam.name),
      flagEmoji: awayTeam.flagEmoji,
    },
  };

  if (isScoredMatch(match)) {
    summary.homeScore = normalizeSoccerScore(match.homeScore);
    summary.awayScore = normalizeSoccerScore(match.awayScore);
  }

  return summary;
}

function summarizeCalendarMatch(match: Doc<"matches">, teamById: Map<Id<"teams">, Doc<"teams">>) {
  const homeTeam = teamById.get(match.homeTeamId);
  const awayTeam = teamById.get(match.awayTeamId);
  if (!homeTeam || !awayTeam) {
    return null;
  }

  const summary: {
    matchId: Id<"matches">;
    kickoffAt: number;
    stageLabel: string;
    groupCode: string | null;
    matchNumber?: number;
    venue?: string;
    status: "scheduled" | "live" | "finished";
    homeTeam: { id: Id<"teams">; code: string; name: string; flagEmoji?: string; groupCode?: string; worldRanking?: number };
    awayTeam: { id: Id<"teams">; code: string; name: string; flagEmoji?: string; groupCode?: string; worldRanking?: number };
    homeScore?: number;
    awayScore?: number;
  } = {
    matchId: match._id,
    kickoffAt: match.kickoffAt,
    stageLabel: getSpanishStageLabel(match.stageLabel),
    groupCode: homeTeam.groupCode ?? awayTeam.groupCode ?? null,
    matchNumber: match.matchNumber,
    venue: match.venue,
    status: match.status,
    homeTeam: {
      id: homeTeam._id,
      code: homeTeam.code,
      name: getSpanishTeamName(homeTeam.code, homeTeam.name),
      flagEmoji: homeTeam.flagEmoji,
      groupCode: homeTeam.groupCode,
      worldRanking: homeTeam.worldRanking,
    },
    awayTeam: {
      id: awayTeam._id,
      code: awayTeam.code,
      name: getSpanishTeamName(awayTeam.code, awayTeam.name),
      flagEmoji: awayTeam.flagEmoji,
      groupCode: awayTeam.groupCode,
      worldRanking: awayTeam.worldRanking,
    },
  };

  if (isScoredMatch(match)) {
    summary.homeScore = normalizeSoccerScore(match.homeScore);
    summary.awayScore = normalizeSoccerScore(match.awayScore);
  }

  return summary;
}

function summarizeHomeMatch(
  match: Doc<"matches">,
  teamById: Map<Id<"teams">, Doc<"teams">>,
  predictedMatchIds: Set<Id<"matches">>,
) {
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
    hasPrediction: boolean;
  } = {
    matchId: match._id,
    kickoffAt: match.kickoffAt,
    stageLabel: getSpanishStageLabel(match.stageLabel),
    status: match.status,
    homeTeam: {
      id: homeTeam._id,
      code: homeTeam.code,
      name: getSpanishTeamName(homeTeam.code, homeTeam.name),
      flagEmoji: homeTeam.flagEmoji,
    },
    awayTeam: {
      id: awayTeam._id,
      code: awayTeam.code,
      name: getSpanishTeamName(awayTeam.code, awayTeam.name),
      flagEmoji: awayTeam.flagEmoji,
    },
    hasPrediction: predictedMatchIds.has(match._id),
  };

  if (isScoredMatch(match)) {
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
    const todayKey = getGuatemalaDayKey(now);
    const allMatches = await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect();
    const teamById = await getTeamMap(ctx, allMatches);
    const publicMatches = allMatches.flatMap((match) => {
      const summary = summarizePublicMatch(match, teamById);
      return summary ? [summary] : [];
    });
    const scoredMatches = allMatches.filter(isScoredMatch);

    return {
      liveMatches: publicMatches.filter((match) => match.status === "live"),
      todayMatches: publicMatches.filter(
        (match) => match.status !== "finished" && getGuatemalaDayKey(match.kickoffAt) === todayKey,
      ),
      upcomingMatches: publicMatches.filter(
        (match) => match.status !== "finished" && getGuatemalaDayKey(match.kickoffAt) > todayKey,
      ),
      finishedMatches: publicMatches.filter((match) => match.status === "finished"),
      stats: {
        leaderName: null,
        finishedMatchCount: scoredMatches.length,
        totalPredictionCountForFinishedMatches: 0,
        bestExactScoreCount: 0,
      },
    };
  },
});

export const getPublicCalendar = query({
  args: {},
  returns: publicCalendarResult,
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect();
    const teamById = await getTeamMap(ctx, matches);

    return {
      matches: matches.flatMap((match) => {
        const summary = summarizeCalendarMatch(match, teamById);
        return summary ? [summary] : [];
      }),
    };
  },
});

export const updateMatchScore = mutation({
  args: {
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
    status: v.union(v.literal("live"), v.literal("finished")),
  },
  returns: v.object({
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
    status: v.union(v.literal("live"), v.literal("finished")),
  }),
  handler: async (ctx, args) => {
    if (process.env.ENABLE_MATCH_MANAGEMENT !== "true") {
      throw new Error("Match management is not enabled");
    }

    if (!Number.isInteger(args.homeScore) || !Number.isInteger(args.awayScore)) {
      throw new Error("Score must be an integer");
    }

    const homeScore = normalizeSoccerScore(BigInt(args.homeScore));
    const awayScore = normalizeSoccerScore(BigInt(args.awayScore));
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await ctx.db.patch(args.matchId, {
      homeScore: BigInt(homeScore),
      awayScore: BigInt(awayScore),
      status: args.status,
    });

    return {
      matchId: args.matchId,
      homeScore,
      awayScore,
      status: args.status,
    };
  },
});

export const listManageableMatches = query({
  args: { sessionToken: v.string() },
  returns: manageableMatchesResult,
  handler: async (ctx, args) => {
    await requireScoreOperatorBySessionToken(ctx, args.sessionToken);

    const allMatches = await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect();
    const teamById = await getTeamMap(ctx, allMatches);
    const matches = allMatches
      .filter((match) => match.status === "live")
      .flatMap((match) => {
        const summary = summarizePublicMatch(match, teamById);
        return summary ? [summary] : [];
      });

    return { matches };
  },
});

export const updateMatchScoreWithOperatorSession = mutation({
  args: {
    sessionToken: v.string(),
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
    status: v.union(v.literal("live"), v.literal("finished")),
  },
  returns: v.object({
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
    status: v.union(v.literal("live"), v.literal("finished")),
  }),
  handler: async (ctx, args) => {
    await requireScoreOperatorBySessionToken(ctx, args.sessionToken);

    if (!Number.isInteger(args.homeScore) || !Number.isInteger(args.awayScore)) {
      throw new Error("Score must be an integer");
    }

    const homeScore = normalizeSoccerScore(BigInt(args.homeScore));
    const awayScore = normalizeSoccerScore(BigInt(args.awayScore));
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "live") {
      throw new Error("Only live matches can be updated");
    }

    await ctx.db.patch(args.matchId, {
      homeScore: BigInt(homeScore),
      awayScore: BigInt(awayScore),
      status: args.status,
    });

    return {
      matchId: args.matchId,
      homeScore,
      awayScore,
      status: args.status,
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
    const historicalMatches = allMatches.filter((match) => match.kickoffAt <= now).reverse();
    const predictionDocs = await ctx.db
      .query("predictions")
      .withIndex("by_player_id_match_id", (q) => q.eq("playerId", player.playerId))
      .collect();
    const predictedMatchIds = new Set(predictionDocs.map((prediction) => prediction.matchId));
    const teamById = await getTeamMap(ctx, [...upcomingMatches, ...historicalMatches]);

    const summarizeForHome = (match: Doc<"matches">) => {
      const summary = summarizeHomeMatch(match, teamById, predictedMatchIds);
      return summary ? [summary] : [];
    };
    const upcomingMatchSummaries = upcomingMatches.flatMap(summarizeForHome);
    const historicalMatchSummaries = historicalMatches.flatMap(summarizeForHome);

    const nextKickoffAt = upcomingMatchSummaries[0]?.kickoffAt;

    return {
      upcomingMatches: upcomingMatchSummaries,
      historicalMatches: historicalMatchSummaries,
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

export const markStartedMatchesLive = internalMutation({
  args: {},
  returns: markStartedMatchesLiveResult,
  handler: async (ctx) => {
    const now = Date.now();
    const startedMatches = await ctx.db
      .query("matches")
      .withIndex("by_status_kickoff_at", (q) => q.eq("status", "scheduled").lte("kickoffAt", now))
      .collect();

    for (const match of startedMatches) {
      await ctx.db.patch(match._id, {
        awayScore: 0n,
        homeScore: 0n,
        status: "live",
      });
    }

    return { updatedMatches: startedMatches.length };
  },
});

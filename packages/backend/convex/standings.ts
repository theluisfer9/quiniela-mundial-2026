import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/currentUser";
import { buildStandingsRows } from "./lib/scoring";
import { normalizeSoccerScore } from "./lib/scores";
import { getSpanishStageLabel, getSpanishTeamName } from "./lib/teamDisplay";

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

const dashboardAnalyticsRow = v.object({
  rank: v.number(),
  name: v.string(),
  points: v.number(),
  exactScoreCount: v.number(),
  outcomeHitCount: v.number(),
  predictionCount: v.number(),
  precision: v.number(),
  leaderGap: v.number(),
  rankDelta: v.union(v.literal(-1), v.literal(0), v.literal(1)),
  currentStreak: v.number(),
  longestStreak: v.number(),
  nearMissCount: v.number(),
  drawPredictionCount: v.number(),
  contrarianHitCount: v.number(),
  mostCommonScore: v.union(v.string(), v.null()),
});

const awardCard = v.object({
  label: v.string(),
  name: v.string(),
  value: v.string(),
  description: v.string(),
});

const consensusMatch = v.object({
  matchId: v.id("matches"),
  kickoffAt: v.number(),
  stageLabel: v.string(),
  homeTeamName: v.string(),
  awayTeamName: v.string(),
  homeCount: v.number(),
  drawCount: v.number(),
  awayCount: v.number(),
  totalCount: v.number(),
});

const dashboardAnalytics = v.object({
  rows: v.array(dashboardAnalyticsRow),
  awardCards: v.array(awardCard),
  consensusMatches: v.array(consensusMatch),
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

const getOutcome = (homeScore: number, awayScore: number) => {
  if (homeScore > awayScore) {
    return "home";
  }

  if (homeScore < awayScore) {
    return "away";
  }

  return "draw";
};

function isNearMiss({
  actualAway,
  actualHome,
  predictedAway,
  predictedHome,
}: {
  actualAway: number;
  actualHome: number;
  predictedAway: number;
  predictedHome: number;
}) {
  return predictedHome !== actualHome || predictedAway !== actualAway
    ? Math.abs(predictedHome - actualHome) + Math.abs(predictedAway - actualAway) === 1
    : false;
}

function getCurrentStreak(results: boolean[]) {
  const latest = results[results.length - 1];
  if (latest === undefined) {
    return 0;
  }

  let count = 0;
  for (let index = results.length - 1; index >= 0; index -= 1) {
    if (results[index] !== latest) {
      break;
    }
    count += 1;
  }

  return latest ? count : -count;
}

function getLongestHitStreak(results: boolean[]) {
  let longest = 0;
  let current = 0;

  for (const result of results) {
    if (result) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 0;
  }

  return longest;
}

function getMostCommonScore(scoreCounts: Map<string, number>) {
  let topScore: string | null = null;
  let topCount = 0;

  for (const [score, count] of scoreCounts) {
    if (count > topCount) {
      topScore = score;
      topCount = count;
    }
  }

  return topScore;
}

function pickAward(
  label: string,
  rows: Array<{ name: string } & Record<string, number | string | null>>,
  key: string,
  formatValue: (value: number | string | null) => string,
  description: string,
) {
  const winner = rows.reduce<typeof rows[number] | null>((current, row) => {
    if (!current) {
      return row;
    }

    const currentValue = Number(current[key] ?? 0);
    const rowValue = Number(row[key] ?? 0);
    if (rowValue !== currentValue) {
      return rowValue > currentValue ? row : current;
    }

    return row.name.localeCompare(current.name) < 0 ? row : current;
  }, null);
  const winningValue = Number(winner?.[key] ?? 0);

  return {
    label,
    name: winningValue > 0 ? winner?.name ?? "Por definir" : "Por definir",
    value: formatValue(winningValue),
    description,
  };
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

export const getPublicDashboardAnalytics = query({
  args: {},
  returns: dashboardAnalytics,
  handler: async (ctx) => {
    const activeProfiles = (await ctx.db.query("profiles").collect()).filter(
      (profile) => profile.pinHash !== undefined && profile.active === true,
    );
    const activePlayerIds = new Set(activeProfiles.map((profile) => profile._id));
    const allMatches = await ctx.db.query("matches").withIndex("by_kickoff_at").order("asc").collect();
    const finishedMatches = allMatches.filter(isFinishedMatch);
    const finishedPredictionGroups = await Promise.all(
      finishedMatches.map((match) =>
        ctx.db.query("predictions").withIndex("by_match_id", (q) => q.eq("matchId", match._id)).collect(),
      ),
    );
    const matches = finishedMatches.map((match) => ({
      id: match._id,
      homeScore: normalizeSoccerScore(match.homeScore),
      awayScore: normalizeSoccerScore(match.awayScore),
    }));
    const matchById = new Map(matches.map((match) => [match.id, match]));
    const finishedPredictions = finishedPredictionGroups.flat().flatMap((prediction) => {
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
      matches,
      predictions: finishedPredictions,
    });
    const metricsByPlayerId = new Map(
      activeProfiles.map((profile) => [
        profile._id,
        {
          exactScoreCount: 0,
          outcomeHitCount: 0,
          predictionCount: 0,
          nearMissCount: 0,
          drawPredictionCount: 0,
          contrarianHitCount: 0,
          results: [] as boolean[],
          scoreCounts: new Map<string, number>(),
        },
      ]),
    );

    for (const match of matches) {
      const matchPredictions = finishedPredictions.filter((entry) => entry.matchId === match.id);
      const consensusCounts = { away: 0, draw: 0, home: 0 };
      for (const prediction of matchPredictions) {
        consensusCounts[getOutcome(prediction.homeScore, prediction.awayScore)] += 1;
      }
      const consensusOutcome = Object.entries(consensusCounts).sort((left, right) => right[1] - left[1])[0]?.[0];

      for (const prediction of matchPredictions) {
        const metrics = metricsByPlayerId.get(prediction.playerId);
        if (!metrics) {
          continue;
        }

        const isExact = prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore;
        const predictedOutcome = getOutcome(prediction.homeScore, prediction.awayScore);
        const actualOutcome = getOutcome(match.homeScore, match.awayScore);
        const isOutcomeHit = predictedOutcome === actualOutcome;
        const scoreLabel = `${prediction.homeScore}-${prediction.awayScore}`;
        metrics.exactScoreCount += isExact ? 1 : 0;
        metrics.outcomeHitCount += isOutcomeHit ? 1 : 0;
        metrics.predictionCount += 1;
        metrics.nearMissCount += isNearMiss({
          actualAway: match.awayScore,
          actualHome: match.homeScore,
          predictedAway: prediction.awayScore,
          predictedHome: prediction.homeScore,
        }) ? 1 : 0;
        metrics.drawPredictionCount += prediction.homeScore === prediction.awayScore ? 1 : 0;
        metrics.contrarianHitCount += isOutcomeHit && consensusOutcome !== undefined && predictedOutcome !== consensusOutcome ? 1 : 0;
        metrics.results.push(isOutcomeHit);
        metrics.scoreCounts.set(scoreLabel, (metrics.scoreCounts.get(scoreLabel) ?? 0) + 1);
      }
    }

    const leaderPoints = standings[0]?.points ?? 0;
    const rows = standings.map((standing) => {
      const profile = activeProfiles.find((entry) => entry.displayName === standing.name);
      const metrics = profile ? metricsByPlayerId.get(profile._id) : undefined;
      const predictionCount = metrics?.predictionCount ?? 0;

      return {
        rank: standing.rank,
        name: standing.name,
        points: standing.points,
        exactScoreCount: metrics?.exactScoreCount ?? 0,
        outcomeHitCount: metrics?.outcomeHitCount ?? 0,
        predictionCount,
        precision: predictionCount === 0 ? 0 : Math.round(((metrics?.outcomeHitCount ?? 0) / predictionCount) * 100),
        leaderGap: Math.max(0, leaderPoints - standing.points),
        rankDelta: standing.rankDelta,
        currentStreak: getCurrentStreak(metrics?.results ?? []),
        longestStreak: getLongestHitStreak(metrics?.results ?? []),
        nearMissCount: metrics?.nearMissCount ?? 0,
        drawPredictionCount: metrics?.drawPredictionCount ?? 0,
        contrarianHitCount: metrics?.contrarianHitCount ?? 0,
        mostCommonScore: getMostCommonScore(metrics?.scoreCounts ?? new Map()),
      };
    });
    const awardCards = [
      pickAward("Nostradamus", rows, "points", (value) => `${value} pts`, "Mas puntos acumulados."),
      pickAward("Mas exactos", rows, "exactScoreCount", (value) => `${value} exactos`, "Marcadores clavados."),
      pickAward("Rey de las tragedias", rows, "nearMissCount", (value) => `${value} por un gol`, "Mas marcadores rozados."),
      pickAward("Senor empate", rows, "drawPredictionCount", (value) => `${value} empates`, "Mas empates pronosticados."),
      {
        label: "Rey del 1-0",
        name: rows.find((row) => row.mostCommonScore === "1-0")?.name ?? "Por definir",
        value: "1-0",
        description: "El marcador favorito del torneo.",
      },
      pickAward("Contra la corriente", rows, "contrarianHitCount", (value) => `${value} aciertos`, "Acerto cuando la familia iba para otro lado."),
    ];

    const startedMatches = allMatches.filter((match) => match.status !== "scheduled");
    const teamIds = new Set(startedMatches.flatMap((match) => [match.homeTeamId, match.awayTeamId]));
    const teams = await Promise.all([...teamIds].map((teamId) => ctx.db.get(teamId)));
    const teamById = new Map(teams.filter((team): team is NonNullable<typeof team> => team !== null).map((team) => [team._id, team]));
    const consensusMatches = await Promise.all(
      startedMatches.map(async (match) => {
        const predictions = await ctx.db
          .query("predictions")
          .withIndex("by_match_id", (q) => q.eq("matchId", match._id))
          .collect();
        let homeCount = 0;
        let drawCount = 0;
        let awayCount = 0;

        for (const prediction of predictions) {
          if (!prediction.playerId || !activePlayerIds.has(prediction.playerId)) {
            continue;
          }

          const outcome = getOutcome(normalizeSoccerScore(prediction.homeScore), normalizeSoccerScore(prediction.awayScore));
          if (outcome === "home") {
            homeCount += 1;
          } else if (outcome === "away") {
            awayCount += 1;
          } else {
            drawCount += 1;
          }
        }

        const homeTeam = teamById.get(match.homeTeamId);
        const awayTeam = teamById.get(match.awayTeamId);
        if (!homeTeam || !awayTeam) {
          return null;
        }

        return {
          matchId: match._id,
          kickoffAt: match.kickoffAt,
          stageLabel: getSpanishStageLabel(match.stageLabel),
          homeTeamName: getSpanishTeamName(homeTeam.code, homeTeam.name),
          awayTeamName: getSpanishTeamName(awayTeam.code, awayTeam.name),
          homeCount,
          drawCount,
          awayCount,
          totalCount: homeCount + drawCount + awayCount,
        };
      }),
    );

    return {
      rows,
      awardCards,
      consensusMatches: consensusMatches.filter((match): match is NonNullable<typeof match> => match !== null),
    };
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

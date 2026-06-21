import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { getPreviousGuatemalaDate, parseFotMobMatchesXml } from "./lib/fotmobDiscipline";

const syncDateResult = v.object({
  failedMatches: v.number(),
  skippedMatches: v.number(),
  summariesUpserted: v.number(),
  syncedMatches: v.number(),
});

type SyncDateResult = {
  failedMatches: number;
  skippedMatches: number;
  summariesUpserted: number;
  syncedMatches: number;
};

type DisciplineMatchList = {
  matches: Array<{
    awayCode: string;
    homeCode: string;
    matchId: Id<"matches">;
    matchNumber?: number;
  }>;
};

function toFotMobDate(date: string) {
  return date.replace(/-/g, "");
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/xml,text/plain,*/*",
      "User-Agent": "quiniela-mundial-2026/1.0",
    },
  });
  const text = await response.text();
  return { ok: response.ok, text };
}

async function syncFotMobDate(ctx: ActionCtx, date: string): Promise<SyncDateResult> {
  const syncedAt = Date.now();
  const localMatches: DisciplineMatchList = await ctx.runQuery(internal.discipline.listMatchesForDisciplineDate, { date });
  const matchListResponse = await fetchText(
    `https://api.fotmob.com/matches?date=${toFotMobDate(date)}&timezone=America%2FGuatemala`,
  );

  if (!matchListResponse.ok) {
    await ctx.runMutation(internal.discipline.logDisciplineSync, {
      date,
      eventsUpserted: 0,
      message: "FotMob match list request failed",
      status: "failed",
      syncedAt,
    });
    return { failedMatches: localMatches.matches.length, skippedMatches: 0, summariesUpserted: 0, syncedMatches: 0 };
  }

  const providerMatches = parseFotMobMatchesXml(matchListResponse.text);
  let failedMatches = 0;
  let skippedMatches = 0;
  let summariesUpserted = 0;
  let syncedMatches = 0;

  for (const match of localMatches.matches) {
    const providerMatch = providerMatches.find(
      (candidate) => candidate.homeCode === match.homeCode && candidate.awayCode === match.awayCode,
    );

    if (!providerMatch) {
      skippedMatches += 1;
      await ctx.runMutation(internal.discipline.logDisciplineSync, {
        date,
        eventsUpserted: 0,
        matchId: match.matchId,
        message: `No FotMob match found for M${match.matchNumber ?? "?"}`,
        status: "skipped",
        syncedAt,
      });
      continue;
    }

    const summary = await ctx.runMutation(internal.discipline.upsertMatchDisciplineSummary, {
      awayRedCards: providerMatch.awayRedCards,
      awayYellowCards: providerMatch.awayYellowCards,
      homeRedCards: providerMatch.homeRedCards,
      homeYellowCards: providerMatch.homeYellowCards,
      matchId: match.matchId,
      providerMatchId: providerMatch.providerMatchId,
      syncedAt,
    });
    summariesUpserted += summary.inserted || summary.updated ? 1 : 0;
    syncedMatches += 1;

    await ctx.runMutation(internal.discipline.logDisciplineSync, {
      date,
      eventsUpserted: 0,
      matchId: match.matchId,
      providerMatchId: providerMatch.providerMatchId,
      status: "success",
      syncedAt,
    });
  }

  return { failedMatches, skippedMatches, summariesUpserted, syncedMatches };
}

export const syncDate = action({
  args: { date: v.string() },
  returns: syncDateResult,
  handler: async (ctx, args): Promise<SyncDateResult> => {
    if (process.env.ENABLE_DISCIPLINE_SYNC !== "true") {
      throw new Error("Discipline sync is not enabled");
    }

    return await syncFotMobDate(ctx, args.date);
  },
});

export const syncPreviousGuatemalaDate = internalAction({
  args: {},
  returns: syncDateResult,
  handler: async (ctx): Promise<SyncDateResult> => {
    return await syncFotMobDate(ctx, getPreviousGuatemalaDate(Date.now()));
  },
});

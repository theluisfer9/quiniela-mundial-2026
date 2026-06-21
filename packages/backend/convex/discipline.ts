import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, type QueryCtx } from "./_generated/server";
import { getGuatemalaDateRangeUtc } from "./lib/fotmobDiscipline";

const disciplineEventArg = v.object({
  cardType: v.union(v.literal("yellow"), v.literal("red"), v.literal("secondYellow")),
  minute: v.union(v.number(), v.null()),
  minuteAdded: v.union(v.number(), v.null()),
  playerName: v.union(v.string(), v.null()),
  providerEventId: v.string(),
  providerPlayerId: v.union(v.string(), v.null()),
  teamSide: v.union(v.literal("home"), v.literal("away"), v.literal("unknown")),
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

export const listMatchesForDisciplineDate = internalQuery({
  args: { date: v.string() },
  returns: v.object({
    matches: v.array(v.object({
      awayCode: v.string(),
      homeCode: v.string(),
      kickoffAt: v.number(),
      matchId: v.id("matches"),
      matchNumber: v.optional(v.number()),
    })),
  }),
  handler: async (ctx, args) => {
    const { endUtc, startUtc } = getGuatemalaDateRangeUtc(args.date);
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_kickoff_at", (q) => q.gte("kickoffAt", startUtc).lt("kickoffAt", endUtc))
      .collect();
    const teamById = await getTeamMap(ctx, matches);

    return {
      matches: matches.flatMap((match) => {
        const homeTeam = teamById.get(match.homeTeamId);
        const awayTeam = teamById.get(match.awayTeamId);
        if (!homeTeam || !awayTeam) {
          return [];
        }

        return [{
          awayCode: awayTeam.code,
          homeCode: homeTeam.code,
          kickoffAt: match.kickoffAt,
          matchId: match._id,
          matchNumber: match.matchNumber,
        }];
      }),
    };
  },
});

export const upsertMatchDisciplineEvents = internalMutation({
  args: {
    events: v.array(disciplineEventArg),
    matchId: v.id("matches"),
    providerMatchId: v.string(),
    syncedAt: v.number(),
  },
  returns: v.object({
    insertedEvents: v.number(),
    updatedEvents: v.number(),
  }),
  handler: async (ctx, args) => {
    let insertedEvents = 0;
    let updatedEvents = 0;

    for (const event of args.events) {
      const existing = await ctx.db
        .query("matchDisciplineEvents")
        .withIndex("by_provider_and_provider_match_id_and_provider_event_id", (q) =>
          q.eq("provider", "fotmob").eq("providerMatchId", args.providerMatchId).eq("providerEventId", event.providerEventId),
        )
        .unique();

      const storedEvent = {
        ...event,
        matchId: args.matchId,
        provider: "fotmob" as const,
        providerMatchId: args.providerMatchId,
        syncedAt: args.syncedAt,
      };

      if (existing) {
        await ctx.db.patch(existing._id, storedEvent);
        updatedEvents += 1;
      } else {
        await ctx.db.insert("matchDisciplineEvents", storedEvent);
        insertedEvents += 1;
      }
    }

    return { insertedEvents, updatedEvents };
  },
});

export const upsertMatchDisciplineSummary = internalMutation({
  args: {
    awayRedCards: v.number(),
    awayYellowCards: v.union(v.number(), v.null()),
    homeRedCards: v.number(),
    homeYellowCards: v.union(v.number(), v.null()),
    matchId: v.id("matches"),
    providerMatchId: v.string(),
    syncedAt: v.number(),
  },
  returns: v.object({
    inserted: v.boolean(),
    updated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("matchDisciplineSummaries")
      .withIndex("by_provider_and_provider_match_id", (q) =>
        q.eq("provider", "fotmob").eq("providerMatchId", args.providerMatchId),
      )
      .unique();
    const summary = {
      awayRedCards: args.awayRedCards,
      awayYellowCards: args.awayYellowCards,
      homeRedCards: args.homeRedCards,
      homeYellowCards: args.homeYellowCards,
      matchId: args.matchId,
      provider: "fotmob" as const,
      providerMatchId: args.providerMatchId,
      syncedAt: args.syncedAt,
    };

    if (existing) {
      await ctx.db.patch(existing._id, summary);
      return { inserted: false, updated: true };
    }

    await ctx.db.insert("matchDisciplineSummaries", summary);
    return { inserted: true, updated: false };
  },
});

export const logDisciplineSync = internalMutation({
  args: {
    date: v.string(),
    eventsUpserted: v.number(),
    matchId: v.optional(v.id("matches")),
    message: v.optional(v.string()),
    providerMatchId: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("skipped")),
    syncedAt: v.number(),
  },
  returns: v.object({ logged: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.insert("disciplineSyncLogs", {
      ...args,
      provider: "fotmob" as const,
    });

    return { logged: true };
  },
});

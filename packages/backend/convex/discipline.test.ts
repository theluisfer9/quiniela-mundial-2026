import { describe, expect, it } from "bun:test";
import { convexTest } from "convex-test";

import { internal } from "./_generated/api";
import schema from "./schema";

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./discipline.ts": async () => await import("./discipline"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

async function insertMatch(t: ReturnType<typeof createTest>) {
  return await t.run(async (ctx) => {
    const homeTeamId = await ctx.db.insert("teams", { code: "MEX", name: "Mexico" });
    const awayTeamId = await ctx.db.insert("teams", { code: "RSA", name: "South Africa" });
    return await ctx.db.insert("matches", {
      awayTeamId,
      homeTeamId,
      kickoffAt: Date.UTC(2026, 5, 11, 21),
      matchNumber: 1,
      stageLabel: "Grupo A",
      status: "finished",
    });
  });
}

describe("upsertMatchDisciplineEvents", () => {
  it("upserts FotMob card events idempotently without deleting older provider events", async () => {
    const t = createTest();
    const matchId = await insertMatch(t);

    const first = await t.mutation(internal.discipline.upsertMatchDisciplineEvents, {
      events: [
        {
          cardType: "yellow",
          minute: 27,
          minuteAdded: null,
          playerName: "Home Midfielder",
          providerEventId: "101",
          providerPlayerId: "9001",
          teamSide: "home",
        },
      ],
      matchId,
      providerMatchId: "4667751",
      syncedAt: Date.UTC(2026, 5, 12, 9),
    });
    const second = await t.mutation(internal.discipline.upsertMatchDisciplineEvents, {
      events: [
        {
          cardType: "yellow",
          minute: 28,
          minuteAdded: null,
          playerName: "Home Midfielder",
          providerEventId: "101",
          providerPlayerId: "9001",
          teamSide: "home",
        },
        {
          cardType: "red",
          minute: 80,
          minuteAdded: 3,
          playerName: "Away Defender",
          providerEventId: "102",
          providerPlayerId: "9002",
          teamSide: "away",
        },
      ],
      matchId,
      providerMatchId: "4667751",
      syncedAt: Date.UTC(2026, 5, 12, 10),
    });

    const events = await t.run(async (ctx) => await ctx.db.query("matchDisciplineEvents").collect());

    expect(first).toEqual({ insertedEvents: 1, updatedEvents: 0 });
    expect(second).toEqual({ insertedEvents: 1, updatedEvents: 1 });
    expect(events).toHaveLength(2);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        cardType: "yellow",
        minute: 28,
        providerEventId: "101",
        providerMatchId: "4667751",
        providerPlayerId: "9001",
        provider: "fotmob",
        teamSide: "home",
      }),
      expect.objectContaining({
        cardType: "red",
        minute: 80,
        minuteAdded: 3,
        providerEventId: "102",
        teamSide: "away",
      }),
    ]));
  });
});

describe("upsertMatchDisciplineSummary", () => {
  it("upserts home and away card counts from FotMob match-list summaries", async () => {
    const t = createTest();
    const matchId = await insertMatch(t);

    const first = await t.mutation(internal.discipline.upsertMatchDisciplineSummary, {
      awayRedCards: 0,
      awayYellowCards: 3,
      homeRedCards: 1,
      homeYellowCards: 2,
      matchId,
      providerMatchId: "4667751",
      syncedAt: Date.UTC(2026, 5, 12, 9),
    });
    const second = await t.mutation(internal.discipline.upsertMatchDisciplineSummary, {
      awayRedCards: 1,
      awayYellowCards: null,
      homeRedCards: 0,
      homeYellowCards: null,
      matchId,
      providerMatchId: "4667751",
      syncedAt: Date.UTC(2026, 5, 12, 10),
    });

    const summaries = await t.run(async (ctx) => await ctx.db.query("matchDisciplineSummaries").collect());

    expect(first).toEqual({ inserted: true, updated: false });
    expect(second).toEqual({ inserted: false, updated: true });
    expect(summaries).toEqual([
      expect.objectContaining({
        awayRedCards: 1,
        awayYellowCards: null,
        homeRedCards: 0,
        homeYellowCards: null,
        matchId,
        provider: "fotmob",
        providerMatchId: "4667751",
      }),
    ]);
  });
});

describe("logDisciplineSync", () => {
  it("records failed provider sync attempts without requiring card events", async () => {
    const t = createTest();
    const matchId = await insertMatch(t);

    const result = await t.mutation(internal.discipline.logDisciplineSync, {
      date: "2026-06-11",
      eventsUpserted: 0,
      matchId,
      message: "FotMob returned HTML instead of JSON",
      providerMatchId: "4667751",
      status: "failed",
      syncedAt: Date.UTC(2026, 5, 12, 10),
    });

    const logs = await t.run(async (ctx) => await ctx.db.query("disciplineSyncLogs").collect());

    expect(result).toEqual({ logged: true });
    expect(logs).toEqual([
      expect.objectContaining({
        date: "2026-06-11",
        eventsUpserted: 0,
        message: "FotMob returned HTML instead of JSON",
        provider: "fotmob",
        providerMatchId: "4667751",
        status: "failed",
      }),
    ]);
  });
});

describe("listMatchesForDisciplineDate", () => {
  it("returns matches for a Guatemala date with team codes needed for provider matching", async () => {
    const t = createTest();
    const includedMatchId = await insertMatch(t);
    await t.run(async (ctx) => {
      const homeTeamId = await ctx.db.insert("teams", { code: "KOR", name: "South Korea" });
      const awayTeamId = await ctx.db.insert("teams", { code: "TBD", name: "European Play-Off D" });
      await ctx.db.insert("matches", {
        awayTeamId,
        homeTeamId,
        kickoffAt: Date.UTC(2026, 5, 12, 7),
        matchNumber: 2,
        stageLabel: "Grupo A",
        status: "scheduled",
      });
    });

    const result = await t.query(internal.discipline.listMatchesForDisciplineDate, { date: "2026-06-11" });

    expect(result).toEqual({
      matches: [{
        awayCode: "RSA",
        homeCode: "MEX",
        kickoffAt: Date.UTC(2026, 5, 11, 21),
        matchId: includedMatchId,
        matchNumber: 1,
      }],
    });
  });
});

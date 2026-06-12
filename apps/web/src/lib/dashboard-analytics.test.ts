import { describe, expect, it } from "bun:test";

import { getDashboardSummaryCards, type DashboardAnalyticsData } from "./dashboard-analytics";

const zeroRow = {
  contrarianHitCount: 0,
  currentStreak: 0,
  drawPredictionCount: 0,
  exactScoreCount: 0,
  leaderGap: 0,
  longestStreak: 0,
  mostCommonScore: null,
  nearMissCount: 0,
  outcomeHitCount: 0,
  points: 0,
  precision: 0,
  predictionCount: 0,
  rank: 1,
  rankDelta: 0,
} satisfies Omit<DashboardAnalyticsData["rows"][number], "name">;

describe("getDashboardSummaryCards", () => {
  it("does not assign summary winners when all metrics are zero", () => {
    const cards = getDashboardSummaryCards(
      {
        awardCards: [],
        consensusMatches: [],
        rows: [
          { ...zeroRow, name: "Ale" },
          { ...zeroRow, name: "Boris", rank: 2 },
        ],
      },
      {
        liveMatches: [],
        todayMatches: [],
        upcomingMatches: [
          {
            awayTeam: { name: "Sudáfrica" },
            homeTeam: { name: "México" },
            kickoffAt: Date.UTC(2026, 5, 11, 19),
          },
        ],
      },
    );

    expect(cards).toEqual([
      { label: "Lider", value: "Por definir", detail: "Sin partidos cerrados" },
      { label: "Mas exactos", value: "Por definir", detail: "0 marcadores" },
      { label: "Mejor racha", value: "Por definir", detail: "0 aciertos seguidos" },
      { label: "Proximo cierre", value: "11 jun, 1:00 p.m.", detail: "México vs Sudáfrica" },
    ]);
  });

  it("uses the next scheduled match from today before later upcoming matches", () => {
    const cards = getDashboardSummaryCards(
      {
        awardCards: [],
        consensusMatches: [],
        rows: [],
      },
      {
        liveMatches: [],
        todayMatches: [
          {
            awayTeam: { name: "Paraguay" },
            homeTeam: { name: "Estados Unidos" },
            kickoffAt: Date.UTC(2026, 5, 13, 1),
          },
        ],
        upcomingMatches: [
          {
            awayTeam: { name: "Suiza" },
            homeTeam: { name: "Catar" },
            kickoffAt: Date.UTC(2026, 5, 13, 19),
          },
        ],
      },
      { locale: "es-GT" },
    );

    expect(cards[3]).toEqual({
      label: "Proximo cierre",
      value: "12 jun, 7:00 p. m.",
      detail: "Estados Unidos vs Paraguay",
    });
  });
});

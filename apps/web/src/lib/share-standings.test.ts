import { describe, expect, it } from "bun:test";

import { buildShareStandingsModel } from "./share-standings";

const generatedAt = new Date("2026-06-11T19:45:00.000Z").getTime();

describe("buildShareStandingsModel", () => {
  it("builds a complete share table with Guatemala timestamp and live match summary", () => {
    const model = buildShareStandingsModel({
      generatedAt,
      locale: "es",
      liveMatches: [
        {
          matchId: "match-1",
          kickoffAt: generatedAt,
          stageLabel: "Group A",
          status: "live",
          homeTeam: { id: "mex", code: "MEX", name: "Mexico", flagEmoji: "🇲🇽" },
          awayTeam: { id: "rsa", code: "RSA", name: "South Africa", flagEmoji: "🇿🇦" },
          homeScore: 1,
          awayScore: 0,
        },
      ],
      rows: [
        { rank: 1, name: "Q", points: 3, rankDelta: 0, isCurrentUser: false },
        { rank: 2, name: "Teto", points: 3, rankDelta: 0, isCurrentUser: false },
      ],
    });

    expect(model.title).toBe("Quiniela Mundial 2026");
    expect(model.subtitle).toBe("Tabla completa");
    expect(model.generatedLabel).toContain("Guatemala");
    expect(model.generatedLabel).toContain("11 jun");
    expect(model.liveSummary).toBe("En vivo: Mexico 1-0 South Africa");
    expect(model.rows).toHaveLength(2);
  });

  it("omits live summary when there is no live match", () => {
    const model = buildShareStandingsModel({
      generatedAt,
      locale: "es",
      liveMatches: [],
      rows: [],
    });

    expect(model.liveSummary).toBeNull();
  });
});

import { describe, expect, it } from "bun:test";

import { buildPredictionEntry, deriveHomeViewModel } from "./home-data";

const CURRENT_USER = {
  name: "Ana",
  email: "ana@example.com",
};

describe("deriveHomeViewModel", () => {
  it("returns an empty state when there are no standings and no matches", () => {
    expect(
      deriveHomeViewModel({
        currentUser: CURRENT_USER,
        standings: [],
        matches: {
          upcomingMatches: [],
          pendingCount: 0,
          nextKickoff: null,
        },
      }),
    ).toMatchObject({
      state: "empty",
      currentUserName: "Ana",
      currentUserStanding: null,
      pendingCount: 0,
      upcomingMatches: [],
    });
  });

  it("returns a pending state when there are matches left to predict", () => {
    expect(
      deriveHomeViewModel({
        currentUser: CURRENT_USER,
        standings: [
          { rank: 1, name: "Ana", points: 12, rankDelta: 1, isCurrentUser: true },
          { rank: 2, name: "Beto", points: 10, rankDelta: -1, isCurrentUser: false },
        ],
        matches: {
          upcomingMatches: [
            {
              matchId: "match-1",
              kickoffAt: Date.UTC(2026, 5, 15, 18),
              stageLabel: "Grupo A",
              homeTeam: { id: "arg", code: "ARG", name: "Argentina", flagEmoji: "🇦🇷" },
              awayTeam: { id: "mex", code: "MEX", name: "Mexico", flagEmoji: "🇲🇽" },
              hasPrediction: false,
            },
          ],
          pendingCount: 1,
          nextKickoff: {
            kickoffAt: Date.UTC(2026, 5, 15, 18),
            matchCount: 1,
          },
        },
      }),
    ).toMatchObject({
      state: "pending",
      currentUserName: "Ana",
      currentUserStanding: { rank: 1, points: 12 },
      pendingCount: 1,
      predictedCount: 0,
      ctaTone: "urgent",
    });
  });

  it("returns an up-to-date state when all upcoming matches are already predicted", () => {
    expect(
      deriveHomeViewModel({
        currentUser: CURRENT_USER,
        standings: [
          { rank: 3, name: "Ana", points: 7, rankDelta: 0, isCurrentUser: true },
          { rank: 1, name: "Beto", points: 12, rankDelta: 1, isCurrentUser: false },
        ],
        matches: {
          upcomingMatches: [
            {
              matchId: "match-2",
              kickoffAt: Date.UTC(2026, 5, 18, 21),
              stageLabel: "Grupo B",
              homeTeam: { id: "bra", code: "BRA", name: "Brazil", flagEmoji: "🇧🇷" },
              awayTeam: { id: "esp", code: "ESP", name: "Espana", flagEmoji: "🇪🇸" },
              hasPrediction: true,
            },
          ],
          pendingCount: 0,
          nextKickoff: {
            kickoffAt: Date.UTC(2026, 5, 18, 21),
            matchCount: 1,
          },
        },
      }),
    ).toMatchObject({
      state: "upToDate",
      currentUserStanding: { rank: 3, points: 7 },
      pendingCount: 0,
      predictedCount: 1,
      ctaTone: "calm",
    });
  });
});

describe("buildPredictionEntry", () => {
  it("points hero and urgency actions to the prediction route", () => {
    expect(buildPredictionEntry()).toEqual({
      href: "/pronosticos",
      label: "Ir a pronosticos",
    });
  });

  it("builds a start label for matches without a prediction", () => {
    expect(
      buildPredictionEntry({
        matchId: "match-1",
        kickoffAt: Date.UTC(2026, 5, 15, 18),
        stageLabel: "Grupo A",
        homeTeam: { id: "arg", code: "ARG", name: "Argentina", flagEmoji: "🇦🇷" },
        awayTeam: { id: "mex", code: "MEX", name: "Mexico", flagEmoji: "🇲🇽" },
        hasPrediction: false,
      }),
    ).toEqual({
      href: "/pronosticos?match=match-1",
      label: "Empezar pronostico",
    });
  });

  it("builds a continue label for matches with an existing prediction", () => {
    expect(
      buildPredictionEntry({
        matchId: "match-2",
        kickoffAt: Date.UTC(2026, 5, 18, 21),
        stageLabel: "Grupo B",
        homeTeam: { id: "bra", code: "BRA", name: "Brazil", flagEmoji: "🇧🇷" },
        awayTeam: { id: "esp", code: "ESP", name: "Espana", flagEmoji: "🇪🇸" },
        hasPrediction: true,
      }),
    ).toEqual({
      href: "/pronosticos?match=match-2",
      label: "Continuar pronostico",
    });
  });
});

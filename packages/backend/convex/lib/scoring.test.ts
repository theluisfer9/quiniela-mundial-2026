import { describe, expect, it } from "bun:test";

import { buildStandingsRows, calculatePredictionPoints } from "./scoring";

describe("calculatePredictionPoints", () => {
  it("gives 3 points for an exact score", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 1,
      }),
    ).toBe(3);
  });

  it("gives 1 point for the correct outcome only", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 3,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 0,
      }),
    ).toBe(1);
  });

  it("gives 0 points for the wrong outcome", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 0,
        actualAway: 1,
      }),
    ).toBe(0);
  });

  it("gives 1 point for the correct away-win outcome", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 0,
        predictedAway: 2,
        actualHome: 1,
        actualAway: 3,
      }),
    ).toBe(1);
  });

  it("gives 1 point for the correct draw outcome", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 2,
        actualHome: 0,
        actualAway: 0,
      }),
    ).toBe(1);
  });
});

describe("buildStandingsRows", () => {
  it("aggregates finished-match points into ranked home standings rows", () => {
    expect(
      buildStandingsRows({
        currentPlayerId: "player-2",
        profiles: [
          { playerId: "player-1", name: "Ana" },
          { playerId: "player-2", name: "Beto" },
          { playerId: "player-3", name: "Carla" },
        ],
        matches: [
          { id: "match-1", homeScore: 2, awayScore: 1 },
          { id: "match-2", homeScore: 0, awayScore: 1 },
        ],
        predictions: [
          { playerId: "player-1", matchId: "match-1", homeScore: 2, awayScore: 1 },
          { playerId: "player-1", matchId: "match-2", homeScore: 1, awayScore: 1 },
          { playerId: "player-2", matchId: "match-1", homeScore: 3, awayScore: 1 },
          { playerId: "player-2", matchId: "match-2", homeScore: 0, awayScore: 1 },
          { playerId: "player-3", matchId: "match-1", homeScore: 1, awayScore: 0 },
          { playerId: "player-3", matchId: "match-2", homeScore: 2, awayScore: 1 },
        ],
      }),
    ).toEqual([
      {
        rank: 1,
        name: "Beto",
        points: 4,
        rankDelta: 1,
        isCurrentUser: true,
      },
      {
        rank: 2,
        name: "Ana",
        points: 3,
        rankDelta: -1,
        isCurrentUser: false,
      },
      {
        rank: 3,
        name: "Carla",
        points: 1,
        rankDelta: 0,
        isCurrentUser: false,
      },
    ]);
  });

  it("breaks ties deterministically by name", () => {
    expect(
      buildStandingsRows({
        currentPlayerId: "player-3",
        profiles: [
          { playerId: "player-2", name: "Beto" },
          { playerId: "player-1", name: "Ana" },
          { playerId: "player-3", name: "Carla" },
        ],
        matches: [{ id: "match-1", homeScore: 1, awayScore: 0 }],
        predictions: [
          { playerId: "player-1", matchId: "match-1", homeScore: 2, awayScore: 0 },
          { playerId: "player-2", matchId: "match-1", homeScore: 3, awayScore: 1 },
        ],
      }),
    ).toEqual([
      {
        rank: 1,
        name: "Ana",
        points: 1,
        rankDelta: 0,
        isCurrentUser: false,
      },
      {
        rank: 2,
        name: "Beto",
        points: 1,
        rankDelta: 0,
        isCurrentUser: false,
      },
      {
        rank: 3,
        name: "Carla",
        points: 0,
        rankDelta: 0,
        isCurrentUser: true,
      },
    ]);
  });

  it("breaks same-name ties deterministically by player id", () => {
    expect(
      buildStandingsRows({
        currentPlayerId: "player-2",
        profiles: [
          { playerId: "player-2", name: "Alex" },
          { playerId: "player-1", name: "Alex" },
        ],
        matches: [],
        predictions: [],
      }),
    ).toEqual([
      {
        rank: 1,
        name: "Alex",
        points: 0,
        rankDelta: 0,
        isCurrentUser: false,
      },
      {
        rank: 2,
        name: "Alex",
        points: 0,
        rankDelta: 0,
        isCurrentUser: true,
      },
    ]);
  });

  it("marks no current row when current player is null for public standings", () => {
    expect(
      buildStandingsRows({
        currentPlayerId: null,
        profiles: [
          { playerId: "player-1", name: "Ana" },
          { playerId: "player-2", name: "Beto" },
        ],
        matches: [{ id: "match-1", homeScore: 2, awayScore: 1 }],
        predictions: [
          { playerId: "player-1", matchId: "match-1", homeScore: 2, awayScore: 1 },
          { playerId: "player-2", matchId: "match-1", homeScore: 1, awayScore: 0 },
        ],
      }).map((row) => row.isCurrentUser),
    ).toEqual([false, false]);
  });
});

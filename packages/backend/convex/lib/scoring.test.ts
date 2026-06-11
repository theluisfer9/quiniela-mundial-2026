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

  it("gives 2 points for the correct winner plus one exact team score", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 4,
        predictedAway: 0,
        actualHome: 2,
        actualAway: 0,
      }),
    ).toBe(2);
  });

  it("gives 1 point for one exact team score without the correct winner", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 4,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 0,
      }),
    ).toBe(1);
  });

  it("gives 1 point for the correct winner only", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 3,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 0,
      }),
    ).toBe(1);
  });

  it.each([
    {
      label: "keeps 2 points when Mexico wins 4-0 and prediction was 2-0",
      predictedHome: 2,
      predictedAway: 0,
      actualHome: 4,
      actualAway: 0,
      expected: 2,
    },
    {
      label: "keeps 1 point when Mexico wins 4-1 and prediction was 2-0",
      predictedHome: 2,
      predictedAway: 0,
      actualHome: 4,
      actualAway: 1,
      expected: 1,
    },
    {
      label: "gives 1 point for one exact team score even with wrong winner",
      predictedHome: 1,
      predictedAway: 2,
      actualHome: 0,
      actualAway: 1,
      expected: 1,
    },
    {
      label: "gives 1 point when South Africa is predicted to win 1-0 but loses 1-2",
      predictedHome: 0,
      predictedAway: 1,
      actualHome: 2,
      actualAway: 1,
      expected: 1,
    },
    {
      label: "gives 1 point for one exact team score even with wrong draw prediction",
      predictedHome: 1,
      predictedAway: 1,
      actualHome: 2,
      actualAway: 1,
      expected: 1,
    },
    {
      label: "gives 1 point for correct winner without exact team scores",
      predictedHome: 3,
      predictedAway: 1,
      actualHome: 2,
      actualAway: 0,
      expected: 1,
    },
    {
      label: "gives 0 points for wrong winner and no exact team scores",
      predictedHome: 3,
      predictedAway: 2,
      actualHome: 0,
      actualAway: 1,
      expected: 0,
    },
    {
      label: "gives 3 points for exact 0-0 draw",
      predictedHome: 0,
      predictedAway: 0,
      actualHome: 0,
      actualAway: 0,
      expected: 3,
    },
    {
      label: "gives 1 point for non-exact draw outcome only",
      predictedHome: 2,
      predictedAway: 2,
      actualHome: 1,
      actualAway: 1,
      expected: 1,
    },
    {
      label: "gives 1 point when prediction is 2-2 and result is 3-3",
      predictedHome: 2,
      predictedAway: 2,
      actualHome: 3,
      actualAway: 3,
      expected: 1,
    },
  ])("$label", ({ predictedHome, predictedAway, actualHome, actualAway, expected }) => {
    expect(
      calculatePredictionPoints({
        predictedHome,
        predictedAway,
        actualHome,
        actualAway,
      }),
    ).toBe(expected);
  });

  it("gives 1 point for the wrong outcome with one exact team score", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 0,
        actualAway: 1,
      }),
    ).toBe(1);
  });

  it("gives 2 points for a correct away win plus one exact team score", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 1,
        predictedAway: 2,
        actualHome: 1,
        actualAway: 3,
      }),
    ).toBe(2);
  });

  it("gives 1 point for the correct draw outcome only", () => {
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
        points: 5,
        rankDelta: 1,
        isCurrentUser: true,
      },
      {
        rank: 2,
        name: "Ana",
        points: 4,
        rankDelta: -1,
        isCurrentUser: false,
      },
      {
        rank: 3,
        name: "Carla",
        points: 2,
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
        points: 2,
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

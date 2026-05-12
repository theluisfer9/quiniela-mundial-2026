import { describe, expect, it } from "bun:test";

import { getStandingsRowUi } from "./standings-ui";

describe("getStandingsRowUi", () => {
  it("returns podium metadata for the top three ranks", () => {
    expect(
      getStandingsRowUi({
        rank: 1,
        name: "Beto",
        points: 12,
        rankDelta: 1,
        isCurrentUser: false,
      }),
    ).toMatchObject({
      topRank: {
        isTopThree: true,
        tier: 1,
        label: "1er lugar",
      },
    });

    expect(
      getStandingsRowUi({
        rank: 3,
        name: "Carla",
        points: 10,
        rankDelta: -1,
        isCurrentUser: false,
      }),
    ).toMatchObject({
      topRank: {
        isTopThree: true,
        tier: 3,
        label: "3er lugar",
      },
    });
  });

  it("keeps non-podium rows compact", () => {
    expect(
      getStandingsRowUi({
        rank: 4,
        name: "Dani",
        points: 8,
        rankDelta: 0,
        isCurrentUser: false,
      }),
    ).toMatchObject({
      topRank: {
        isTopThree: false,
        tier: null,
        label: null,
      },
    });
  });

  it("marks the current user row as emphasized", () => {
    expect(
      getStandingsRowUi({
        rank: 2,
        name: "Ana",
        points: 9,
        rankDelta: 0,
        isCurrentUser: true,
      }),
    ).toMatchObject({
      isCurrentUser: true,
      currentUserLabel: "Tu posicion",
      topRank: {
        isTopThree: true,
        tier: 2,
        label: "2do lugar",
      },
      movement: {
        direction: "steady",
        shortLabel: "Sin cambio",
      },
    });
  });

  it("keeps current-user emphasis even outside the top three", () => {
    expect(
      getStandingsRowUi({
        rank: 7,
        name: "Eli",
        points: 4,
        rankDelta: 1,
        isCurrentUser: true,
      }),
    ).toMatchObject({
      isCurrentUser: true,
      currentUserLabel: "Tu posicion",
      topRank: {
        isTopThree: false,
        tier: null,
        label: null,
      },
      movement: {
        direction: "up",
        shortLabel: "Sube 1",
      },
    });
  });

  it("shows lightweight upward movement messaging", () => {
    expect(
      getStandingsRowUi({
        rank: 1,
        name: "Beto",
        points: 12,
        rankDelta: 1,
        isCurrentUser: false,
      }),
    ).toMatchObject({
      movement: {
        direction: "up",
        icon: "↑",
        shortLabel: "Sube 1",
        longLabel: "Subio 1 puesto",
      },
    });
  });

  it("shows lightweight downward movement messaging", () => {
    expect(
      getStandingsRowUi({
        rank: 4,
        name: "Carla",
        points: 6,
        rankDelta: -1,
        isCurrentUser: false,
      }),
    ).toMatchObject({
      movement: {
        direction: "down",
        icon: "↓",
        shortLabel: "Baja 1",
        longLabel: "Bajo 1 puesto",
      },
    });
  });
});

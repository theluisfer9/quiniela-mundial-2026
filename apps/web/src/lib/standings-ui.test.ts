import { describe, expect, it } from "bun:test";

import { getStandingsRowUi } from "./standings-ui";

describe("getStandingsRowUi", () => {
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
      movement: {
        direction: "steady",
        shortLabel: "Sin cambio",
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

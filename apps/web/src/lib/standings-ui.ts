import type { HomeStandingsRow } from "./home-data";

export type StandingsRowUi = {
  isCurrentUser: boolean;
  currentUserLabel: string | null;
  topRank: {
    isTopThree: boolean;
    tier: 1 | 2 | 3 | null;
    label: string | null;
  };
  movement: {
    direction: "up" | "steady" | "down";
    icon: "↑" | "•" | "↓";
    shortLabel: string;
    longLabel: string;
  };
};

export function getStandingsRowUi(row: HomeStandingsRow): StandingsRowUi {
  const topRank =
    row.rank === 1
      ? {
          isTopThree: true,
          tier: 1 as const,
          label: "1er lugar",
        }
      : row.rank === 2
        ? {
            isTopThree: true,
            tier: 2 as const,
            label: "2do lugar",
          }
        : row.rank === 3
          ? {
              isTopThree: true,
              tier: 3 as const,
              label: "3er lugar",
            }
          : {
              isTopThree: false,
              tier: null,
              label: null,
            };

  const movement =
    row.rankDelta > 0
      ? {
          direction: "up" as const,
          icon: "↑" as const,
          shortLabel: "Sube 1",
          longLabel: "Subio 1 puesto",
        }
      : row.rankDelta < 0
        ? {
            direction: "down" as const,
            icon: "↓" as const,
            shortLabel: "Baja 1",
            longLabel: "Bajo 1 puesto",
          }
        : {
            direction: "steady" as const,
            icon: "•" as const,
            shortLabel: "Sin cambio",
            longLabel: "Sin cambio",
          };

  return {
    isCurrentUser: row.isCurrentUser,
    currentUserLabel: row.isCurrentUser ? "Tu posicion" : null,
    topRank,
    movement,
  };
}

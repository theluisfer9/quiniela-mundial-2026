import type { HomeStandingsRow } from "./home-data";

export type StandingsRowUi = {
  isCurrentUser: boolean;
  currentUserLabel: string | null;
  movement: {
    direction: "up" | "steady" | "down";
    icon: "↑" | "•" | "↓";
    shortLabel: string;
    longLabel: string;
  };
};

export function getStandingsRowUi(row: HomeStandingsRow): StandingsRowUi {
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
    movement,
  };
}

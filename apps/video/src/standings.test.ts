import { describe, expect, test } from "bun:test";

import { getBiggestMover, getCurrentDay, getFinalTopNames, getPlayerRankSeries, getPlayerSeries, getPreviousDay } from "./standings";

const days = [
  {
    date: "2026-06-11",
    label: "Dia 1",
    rows: [
      { name: "Ana", points: 3, rank: 1 },
      { name: "Beto", points: 1, rank: 2 },
    ],
  },
  {
    date: "2026-06-12",
    label: "Dia 2",
    rows: [
      { name: "Beto", points: 6, rank: 1 },
      { name: "Ana", points: 4, rank: 2 },
    ],
  },
];

describe("standings timeline helpers", () => {
  test("clamps the active day to the available timeline", () => {
    expect(getCurrentDay(days, -4)).toBe(days[0]!);
    expect(getCurrentDay(days, 99)).toBe(days[1]!);
  });

  test("returns the previous day when one exists", () => {
    expect(getPreviousDay(days, 0)).toBeNull();
    expect(getPreviousDay(days, 1)).toBe(days[0]!);
  });

  test("finds the player with the largest rank jump", () => {
    expect(getBiggestMover(days[1]!, days[0]!)).toEqual({ name: "Beto", delta: 1 });
  });

  test("gets final top names for line chart focus", () => {
    expect(getFinalTopNames(days, 1)).toEqual(["Beto"]);
  });

  test("builds a point series for a player", () => {
    expect(getPlayerSeries(days, "Ana")).toEqual([3, 4]);
  });

  test("builds a rank series for a player", () => {
    expect(getPlayerRankSeries(days, "Ana")).toEqual([1, 2]);
  });
});

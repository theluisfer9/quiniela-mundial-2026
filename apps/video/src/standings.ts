export type StandingRow = {
  name: string;
  points: number;
  rank: number;
};

export type StandingDay = {
  date: string;
  label: string;
  rows: StandingRow[];
};

export function getCurrentDay(days: StandingDay[], index: number) {
  return days[Math.min(Math.max(Math.floor(index), 0), days.length - 1)] ?? null;
}

export function getPreviousDay(days: StandingDay[], index: number) {
  return index > 0 ? getCurrentDay(days, index - 1) : null;
}

export function getBiggestMover(current: StandingDay, previous: StandingDay | null) {
  if (!previous) {
    return null;
  }

  const previousRanks = new Map(previous.rows.map((row) => [row.name, row.rank]));
  let biggest: { name: string; delta: number } | null = null;

  for (const row of current.rows) {
    const oldRank = previousRanks.get(row.name);
    const delta = oldRank === undefined ? 0 : oldRank - row.rank;
    if (!biggest || delta > biggest.delta) {
      biggest = { name: row.name, delta };
    }
  }

  return biggest && biggest.delta > 0 ? biggest : null;
}

export function getFinalTopNames(days: StandingDay[], count: number) {
  return (days.at(-1)?.rows ?? []).slice(0, count).map((row) => row.name);
}

export function getPlayerSeries(days: StandingDay[], name: string) {
  return days.map((day) => day.rows.find((row) => row.name === name)?.points ?? 0);
}

export function getPlayerRankSeries(days: StandingDay[], name: string) {
  return days.map((day) => day.rows.find((row) => row.name === name)?.rank ?? day.rows.length);
}

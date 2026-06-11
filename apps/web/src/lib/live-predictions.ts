export type LivePredictionRow = {
  playerName: string;
  homeScore: bigint;
  awayScore: bigint;
};

export function paginateLivePredictions(
  rows: LivePredictionRow[],
  { page, pageSize }: { page: number; pageSize: number },
) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(rows.length / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const startIndex = (safePage - 1) * safePageSize;

  return {
    rows: rows.slice(startIndex, startIndex + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    pageCount,
    totalCount: rows.length,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < pageCount,
  };
}

export type ConsensusMatchPageItem = {
  matchId: string;
  kickoffAt: number;
  stageLabel: string;
  homeTeamName: string;
  awayTeamName: string;
  homeCount: number;
  drawCount: number;
  awayCount: number;
  totalCount: number;
};

export function paginateConsensusMatches(
  matches: ConsensusMatchPageItem[],
  { page, pageSize }: { page: number; pageSize: number },
) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const orderedRows = [...matches].sort((left, right) => right.kickoffAt - left.kickoffAt);
  const pageCount = Math.max(1, Math.ceil(orderedRows.length / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const startIndex = (safePage - 1) * safePageSize;

  return {
    rows: orderedRows.slice(startIndex, startIndex + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    pageCount,
    totalCount: orderedRows.length,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < pageCount,
  };
}

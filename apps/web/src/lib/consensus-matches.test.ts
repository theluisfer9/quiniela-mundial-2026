import { describe, expect, it } from "bun:test";

import { paginateConsensusMatches, type ConsensusMatchPageItem } from "./consensus-matches";

function match(index: number): ConsensusMatchPageItem {
  return {
    awayCount: 0,
    awayTeamName: `Away ${index}`,
    drawCount: 0,
    homeCount: 1,
    homeTeamName: `Home ${index}`,
    kickoffAt: index,
    matchId: `match-${index}`,
    stageLabel: "Group A",
    totalCount: 1,
  };
}

describe("paginateConsensusMatches", () => {
  it("shows newest consensus matches first in pages of three", () => {
    const matches = [1, 2, 3, 4, 5].map(match);

    expect(paginateConsensusMatches(matches, { page: 1, pageSize: 3 })).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
      page: 1,
      pageCount: 2,
      rows: [match(5), match(4), match(3)],
    });

    expect(paginateConsensusMatches(matches, { page: 2, pageSize: 3 })).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
      page: 2,
      pageCount: 2,
      rows: [match(2), match(1)],
    });
  });
});

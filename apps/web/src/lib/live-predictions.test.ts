import { describe, expect, it } from "bun:test";

import { paginateLivePredictions } from "./live-predictions";

describe("paginateLivePredictions", () => {
  it("returns bounded pages and metadata", () => {
    const rows = Array.from({ length: 17 }, (_, index) => ({
      playerName: `Player ${index + 1}`,
      homeScore: BigInt(index),
      awayScore: 0n,
    }));

    expect(paginateLivePredictions(rows, { page: 1, pageSize: 8 })).toMatchObject({
      page: 1,
      pageCount: 3,
      totalCount: 17,
      hasPreviousPage: false,
      hasNextPage: true,
      rows: rows.slice(0, 8),
    });
    expect(paginateLivePredictions(rows, { page: 99, pageSize: 8 })).toMatchObject({
      page: 3,
      pageCount: 3,
      hasPreviousPage: true,
      hasNextPage: false,
      rows: rows.slice(16),
    });
  });
});

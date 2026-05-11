import { describe, expect, it } from "bun:test";

import {
  buildSeededGroupStageMatches,
  seededGroupStageTeams,
  toKickoffEpochMs,
} from "./worldCup2026GroupStage";

describe("worldCup2026GroupStage", () => {
  it("converts a local kickoff plus source offset into the correct instant", () => {
    expect(
      toKickoffEpochMs({
        localDate: "2026-06-11",
        localTime: "13:00",
        utcOffsetHours: -6,
      }),
    ).toBe(Date.parse("2026-06-11T19:00:00.000Z"));
  });

  it("builds the expected number of seeded teams and group-stage matches", () => {
    expect(seededGroupStageTeams).toHaveLength(48);
    expect(buildSeededGroupStageMatches()).toHaveLength(72);
  });
});

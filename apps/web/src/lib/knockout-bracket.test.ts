import { describe, expect, it } from "bun:test";

import type { GroupStanding, GroupStandingRow } from "./calendar-groups";
import { buildBestThirdPlaceRows, getOfficialThirdPlaceAssignments, getQualifyingThirdPlaceRows, KNOCKOUT_MATCHES, resolveKnockoutRound, resolveKnockoutSlot } from "./knockout-bracket";

function row(overrides: Partial<GroupStandingRow> & { teamCode: string; groupCode: string }): GroupStandingRow {
  const { groupCode, teamCode, ...rest } = overrides;
  return {
    teamCode,
    teamName: teamCode,
    groupCode,
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    ...rest,
  };
}

function group(groupCode: string, rows: GroupStandingRow[]): GroupStanding {
  return { groupCode, rows };
}

describe("knockout bracket", () => {
  it("resolves direct group rank slots from current standings", () => {
    const groups = [
      group("A", [
        row({ teamCode: "MEX", groupCode: "A", points: 6 }),
        row({ teamCode: "KOR", groupCode: "A", points: 4 }),
        row({ teamCode: "CZE", groupCode: "A", points: 1 }),
      ]),
    ];

    expect(resolveKnockoutSlot({ kind: "group-rank", groupCode: "A", rank: 1 }, groups)).toMatchObject({
      label: "1A",
      team: { teamCode: "MEX" },
    });
    expect(resolveKnockoutSlot({ kind: "group-rank", groupCode: "A", rank: 2 }, groups)).toMatchObject({
      label: "2A",
      team: { teamCode: "KOR" },
    });
  });

  it("orders third-place teams by points, goal difference, goals for, then FIFA ranking", () => {
    const groups = [
      group("A", [row({ teamCode: "A1", groupCode: "A" }), row({ teamCode: "A2", groupCode: "A" }), row({ teamCode: "A3", groupCode: "A", points: 3, goalDifference: 0, goalsFor: 2, worldRanking: 50 })]),
      group("B", [row({ teamCode: "B1", groupCode: "B" }), row({ teamCode: "B2", groupCode: "B" }), row({ teamCode: "B3", groupCode: "B", points: 4, goalDifference: -1, goalsFor: 1, worldRanking: 80 })]),
      group("C", [row({ teamCode: "C1", groupCode: "C" }), row({ teamCode: "C2", groupCode: "C" }), row({ teamCode: "C3", groupCode: "C", points: 3, goalDifference: 1, goalsFor: 1, worldRanking: 90 })]),
      group("D", [row({ teamCode: "D1", groupCode: "D" }), row({ teamCode: "D2", groupCode: "D" }), row({ teamCode: "D3", groupCode: "D", points: 3, goalDifference: 0, goalsFor: 3, worldRanking: 60 })]),
      group("E", [row({ teamCode: "E1", groupCode: "E" }), row({ teamCode: "E2", groupCode: "E" }), row({ teamCode: "E3", groupCode: "E", points: 3, goalDifference: 0, goalsFor: 2, worldRanking: 40 })]),
    ];

    expect(buildBestThirdPlaceRows(groups).map((team) => team.teamCode)).toEqual(["B3", "C3", "D3", "E3", "A3"]);
  });

  it("resolves third-place pools to the best qualifying third from allowed groups", () => {
    const groups = "ABCDEFGHIJKL".split("").map((groupCode, index) =>
      group(groupCode, [
        row({ teamCode: `${groupCode}1`, groupCode }),
        row({ teamCode: `${groupCode}2`, groupCode }),
        row({ teamCode: `${groupCode}3`, groupCode, points: 12 - index, worldRanking: 20 + index }),
      ])
    );

    expect(getQualifyingThirdPlaceRows(groups).map((team) => team.groupCode)).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
    expect(resolveKnockoutSlot({ kind: "third-place", groupCodes: ["E", "F", "G", "I", "J"] }, groups)).toMatchObject({
      label: "3 EFGIJ",
      team: { groupCode: "E", teamCode: "E3" },
    });
    expect(resolveKnockoutSlot({ kind: "third-place", groupCodes: ["I", "J", "K", "L"] }, groups)).toMatchObject({
      label: "3 IJKL",
      team: undefined,
    });
  });

  it("uses the official FIFA round-of-32 match pools", () => {
    const roundOf32 = KNOCKOUT_MATCHES.filter((match) => match.round === "round-of-32");

    expect(roundOf32.map((match) => match.id)).toEqual([
      "M73", "M74", "M75", "M76", "M77", "M78", "M79", "M80", "M81", "M82", "M83", "M84", "M85", "M86", "M87", "M88",
    ]);
    expect(
      roundOf32
        .flatMap((match) => [match.homeSlot, match.awaySlot])
        .filter((slot) => slot.kind === "third-place")
        .map((slot) => slot.groupCodes.join("")),
    ).toEqual(["ABCDF", "CDFGH", "CEFHI", "EHIJK", "BEFIJ", "AEHIJ", "EFGIJ", "DEIJL"]);
  });

  it("uses the official round-of-16 bracket pairings for the final two matches", () => {
    const roundOf16 = KNOCKOUT_MATCHES.filter((match) => match.round === "round-of-16");
    const m95 = roundOf16.find((match) => match.id === "M95");
    const m96 = roundOf16.find((match) => match.id === "M96");

    expect(m95?.homeSlot).toEqual({ kind: "winner", sourceId: "M86" });
    expect(m95?.awaySlot).toEqual({ kind: "winner", sourceId: "M88" });
    expect(m96?.homeSlot).toEqual({ kind: "winner", sourceId: "M85" });
    expect(m96?.awaySlot).toEqual({ kind: "winner", sourceId: "M87" });
  });

  it("maps qualifying third-place groups through FIFA Annexe C", () => {
    expect(getOfficialThirdPlaceAssignments(["E", "J", "I", "F", "H", "G", "L", "K"])).toEqual(["E", "J", "I", "F", "H", "G", "L", "K"]);
    expect(getOfficialThirdPlaceAssignments(["H", "G", "B", "C", "A", "F", "D", "E"])).toEqual(["H", "G", "B", "C", "A", "F", "D", "E"]);
  });

  it("does not reuse the same third-place team across multiple round-of-32 slots", () => {
    const groups = "ABCDEFGHIJKL".split("").map((groupCode, index) =>
      group(groupCode, [
        row({ teamCode: `${groupCode}1`, groupCode, points: 9 }),
        row({ teamCode: `${groupCode}2`, groupCode, points: 6 }),
        row({ teamCode: `${groupCode}3`, groupCode, points: 12 - index, worldRanking: 20 + index }),
      ])
    );
    const [first, second] = resolveKnockoutRound(
      [
        {
          id: "first",
          round: "round-of-32",
          dateLabel: "06/30",
          city: "CDMX",
          homeSlot: { kind: "group-rank", groupCode: "A", rank: 1 },
          awaySlot: { kind: "third-place", groupCodes: ["C", "E", "F", "H", "I"] },
        },
        {
          id: "second",
          round: "round-of-32",
          dateLabel: "07/01",
          city: "Atlanta",
          homeSlot: { kind: "group-rank", groupCode: "L", rank: 1 },
          awaySlot: { kind: "third-place", groupCodes: ["E", "H", "I", "J", "K"] },
        },
      ],
      groups,
    );

    const assignedGroups = [first.away.team?.groupCode, second.away.team?.groupCode];
    expect(new Set(assignedGroups).size).toBe(2);
    expect(assignedGroups.every((groupCode) => groupCode !== undefined)).toBe(true);
  });

  it("resolves official round-of-32 third-place slots from Annexe C", () => {
    const groups = "ABCDEFGHIJKL".split("").map((groupCode) =>
      group(groupCode, [
        row({ teamCode: `${groupCode}1`, groupCode, points: 9 }),
        row({ teamCode: `${groupCode}2`, groupCode, points: 6 }),
        row({ teamCode: `${groupCode}3`, groupCode, points: groupCode < "E" ? 1 : 12, worldRanking: groupCode.charCodeAt(0) }),
      ])
    );
    const roundOf32 = KNOCKOUT_MATCHES.filter((match) => match.round === "round-of-32");
    const resolved = resolveKnockoutRound(roundOf32, groups);

    expect(resolved.filter((match) => match.awaySlot.kind === "third-place").map((match) => match.away.team?.groupCode)).toEqual(["F", "G", "E", "K", "I", "H", "J", "L"]);
  });

  it("uses a fixed M73 match instead of the calculated round-of-32 slot", () => {
    const groups = [
      group("A", [row({ teamCode: "A1", groupCode: "A" }), row({ teamCode: "A2", groupCode: "A" })]),
      group("B", [row({ teamCode: "B1", groupCode: "B" }), row({ teamCode: "B2", groupCode: "B" })]),
    ];
    const [match] = resolveKnockoutRound(
      KNOCKOUT_MATCHES.filter((match) => match.id === "M73"),
      groups,
      [
        {
          id: "M73",
          home: { label: "FIXH", team: row({ teamCode: "FIXH", groupCode: "Z" }) },
          away: { label: "FIXA", team: row({ teamCode: "FIXA", groupCode: "Z" }) },
        },
      ],
    );

    expect(match.source).toBe("fixed");
    expect(match.home.team?.teamCode).toBe("FIXH");
    expect(match.away.team?.teamCode).toBe("FIXA");
  });

  it("keeps calculating a round-of-32 match without a fixed replacement", () => {
    const groups = [
      group("A", [row({ teamCode: "A1", groupCode: "A" }), row({ teamCode: "A2", groupCode: "A" })]),
      group("B", [row({ teamCode: "B1", groupCode: "B" }), row({ teamCode: "B2", groupCode: "B" })]),
    ];
    const [match] = resolveKnockoutRound(KNOCKOUT_MATCHES.filter((match) => match.id === "M73"), groups);

    expect(match.source).toBe("calculated");
    expect(match.home.team?.teamCode).toBe("A2");
    expect(match.away.team?.teamCode).toBe("B2");
  });
});

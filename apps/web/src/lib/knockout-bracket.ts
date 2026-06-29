import type { GroupStanding, GroupStandingRow } from "./calendar-groups";

export type KnockoutRound = "round-of-32" | "round-of-16" | "quarterfinal" | "semifinal" | "final";

export type DirectGroupSlot = {
  kind: "group-rank";
  groupCode: string;
  rank: 1 | 2;
};

export type ThirdPlaceSlot = {
  kind: "third-place";
  groupCodes: string[];
};

export type WinnerSlot = {
  kind: "winner";
  sourceId: string;
};

export type KnockoutSlot = DirectGroupSlot | ThirdPlaceSlot | WinnerSlot | { kind: "placeholder"; label: string };

export type ResolvedKnockoutSlot = {
  label: string;
  team?: GroupStandingRow;
};

export type KnockoutMatch = {
  id: string;
  round: KnockoutRound;
  dateLabel: string;
  city: string;
  homeSlot: KnockoutSlot;
  awaySlot: KnockoutSlot;
};

export type ResolvedKnockoutMatch = KnockoutMatch & {
  home: ResolvedKnockoutSlot;
  away: ResolvedKnockoutSlot;
  source?: "calculated" | "fixed";
};

export type FixedKnockoutMatch = {
  id: string;
  home: ResolvedKnockoutSlot;
  away: ResolvedKnockoutSlot;
};

export const KNOCKOUT_ROUND_LABELS: Record<KnockoutRound, string> = {
  "round-of-32": "16avos",
  "round-of-16": "Octavos",
  quarterfinal: "Cuartos",
  semifinal: "Semis",
  final: "Final",
};

export const KNOCKOUT_ROUNDS: KnockoutRound[] = ["round-of-32", "round-of-16", "quarterfinal", "semifinal", "final"];

const groupRank = (rank: 1 | 2, groupCode: string): DirectGroupSlot => ({ kind: "group-rank", groupCode, rank });
const thirdPlace = (groups: string): ThirdPlaceSlot => ({ kind: "third-place", groupCodes: [...groups] });
const winner = (sourceId: string): WinnerSlot => ({ kind: "winner", sourceId });

const ANNEX_C_COLUMNS = ["A", "B", "D", "E", "G", "I", "K", "L"] as const;
const ANNEX_C_ASSIGNMENTS = `
EJIFHGLK HGIDJFLK EJIDHGLK EJIDHFLK EGIDJFLK EGJDHFLK EGIDHFLK EGJDHFLI EGJDHFIK HGICJFLK EJICHGLK EJICHFLK EGICJFLK EGJCHFLK EGICHFLK EGJCHFLI EGJCHFIK HGICJDLK CJIDHFLK CGIDJFLK CGJDHFLK CGIDHFLK CGJDHFLI CGJDHFIK EJICHDLK EGICJDLK EGJCHDLK EGICHDLK EGJCHDLI EGJCHDIK CJEDIFLK CJEDHFLK CEIDHFLK CJEDHFLI CJEDHFIK CGEDJFLK CGEDIFLK CGEDJFLI CGEDJFIK CGEDHFLK CGJDHFLE CGJDHFEK CGEDHFLI CGEDHFIK CGJDHFEI HJBFIGLK EJIBHGLK EJBFIHLK EJBFIGLK EJBFHGLK EGBFIHLK EJBFHGLI EJBFHGIK HJBDIGLK HJBDIFLK IGBDJFLK HGBDJFLK HGBDIFLK HGBDJFLI HGBDJFIK EJBDIHLK EJBDIGLK EJBDHGLK EGBDIHLK EJBDHGLI EJBDHGIK EJBDIFLK EJBDHFLK EIBDHFLK EJBDHFLI EJBDHFIK EGBDJFLK EGBDIFLK EGBDJFLI EGBDJFIK EGBDHFLK HGBDJFLE HGBDJFEK EGBDHFLI EGBDHFIK HGBDJFEI HJBCIGLK HJBCIFLK IGBCJFLK HGBCJFLK HGBCIFLK HGBCJFLI HGBCJFIK EJBCIHLK EJBCIGLK EJBCHGLK EGBCIHLK EJBCHGLI EJBCHGIK EJBCIFLK EJBCHFLK EIBCHFLK EJBCHFLI EJBCHFIK EGBCJFLK EGBCIFLK EGBCJFLI EGBCJFIK EGBCHFLK HGBCJFLE HGBCJFEK EGBCHFLI EGBCHFIK HGBCJFEI HJBCIDLK IGBCJDLK HGBCJDLK HGBCIDLK HGBCJDLI HGBCJDIK CJBDIFLK CJBDHFLK CIBDHFLK CJBDHFLI CJBDHFIK CGBDJFLK CGBDIFLK CGBDJFLI CGBDJFIK CGBDHFLK CGBDHFLJ HGBCJFDK CGBDHFLI CGBDHFIK HGBCJFDI EJBCIDLK EJBCHDLK EIBCHDLK EJBCHDLI EJBCHDIK EGBCJDLK EGBCIDLK EGBCJDLI EGBCJDIK EGBCHDLK HGBCJDLE HGBCJDEK EGBCHDLI EGBCHDIK HGBCJDEI CJBDEFLK CEBDIFLK CJBDEFLI CJBDEFIK CEBDHFLK CJBDHFLE CJBDHFEK CEBDHFLI CEBDHFIK CJBDHFEI CGBDEFLK CGBDJFLE CGBDJFEK CGBDEFLI CGBDEFIK CGBDJFEI CGBDHFLE CGBDHFEK HGBCJFDE CGBDHFEI HJIFAGLK EJIAHGLK EJIFAHLK EJIFAGLK EGJFAHLK EGIFAHLK EGJFAHLI EGJFAHIK HJIDAGLK HJIDAFLK IGJDAFLK HGJDAFLK HGIDAFLK HGJDAFLI HGJDAFIK EJIDAHLK EJIDAGLK EGJDAHLK EGIDAHLK EGJDAHLI EGJDAHIK EJIDAFLK HJEDAFLK HEIDAFLK HJEDAFLI HJEDAFIK EGJDAFLK EGIDAFLK EGJDAFLI EGJDAFIK HGEDAFLK HGJDAFLE HGJDAFEK HGEDAFLI HGEDAFIK HGJDAFEI HJICAGLK HJICAFLK IGJCAFLK HGJCAFLK HGICAFLK HGJCAFLI HGJCAFIK EJICAHLK EJICAGLK EGJCAHLK EGICAHLK EGJCAHLI EGJCAHIK EJICAFLK HJECAFLK HEICAFLK HJECAFLI HJECAFIK EGJCAFLK EGICAFLK EGJCAFLI EGJCAFIK HGECAFLK HGJCAFLE HGJCAFEK HGECAFLI HGECAFIK HGJCAFEI HJICADLK IGJCADLK HGJCADLK HGICADLK HGJCADLI HGJCADIK CJIDAFLK HJFCADLK HFICADLK HJFCADLI HJFCADIK CGJDAFLK CGIDAFLK CGJDAFLI CGJDAFIK HGFCADLK CGJDAFLH HGJCAFDK HGFCADLI HGFCADIK HGJCAFDI EJICADLK HJECADLK HEICADLK HJECADLI HJECADIK EGJCADLK EGICADLK EGJCADLI EGJCADIK HGECADLK HGJCADLE HGJCADEK HGECADLI HGECADIK HGJCADEI CJEDAFLK CEIDAFLK CJEDAFLI CJEDAFIK HEFCADLK HJFCADLE HJECAFDK HEFCADLI HEFCADIK HJECAFDI CGEDAFLK CGJDAFLE CGJDAFEK CGEDAFLI CGEDAFIK CGJDAFEI HGFCADLE HGECAFDK HGJCAFDE HGECAFDI HJBAIGLK HJBAIFLK IJBFAGLK HJBFAGLK HGBAIFLK HJBFAGLI HJBFAGIK EJBAIHLK EJBAIGLK EJBAHGLK EGBAIHLK EJBAHGLI EJBAHGIK EJBAIFLK EJBFAHLK EIBFAHLK EJBFAHLI EJBFAHIK EJBFAGLK EGBAIFLK EJBFAGLI EJBFAGIK EGBFAHLK HJBFAGLE HJBFAGEK EGBFAHLI EGBFAHIK HJBFAGEI IJBDAHLK IJBDAGLK HJBDAGLK IGBDAHLK HJBDAGLI HJBDAGIK IJBDAFLK HJBDAFLK HIBDAFLK HJBDAFLI HJBDAFIK FJBDAGLK IGBDAFLK FJBDAGLI FJBDAGIK HGBDAFLK HGBDAFLJ HGBDAFJK HGBDAFLI HGBDAFIK HGBDAFIJ EJBAIDLK EJBDAHLK EIBDAHLK EJBDAHLI EJBDAHIK EJBDAGLK EGBAIDLK EJBDAGLI EJBDAGIK EGBDAHLK HJBDAGLE HJBDAGEK EGBDAHLI EGBDAHIK HJBDAGEI EJBDAFLK EIBDAFLK EJBDAFLI EJBDAFIK HEBDAFLK HJBDAFLE HJBDAFEK HEBDAFLI HEBDAFIK HJBDAFEI EGBDAFLK EGBDAFLJ EGBDAFJK EGBDAFLI EGBDAFIK EGBDAFIJ HGBDAFLE HGBDAFEK HGBDAFEJ HGBDAFEI IJBCAHLK IJBCAGLK HJBCAGLK IGBCAHLK HJBCAGLI HJBCAGIK IJBCAFLK HJBCAFLK HIBCAFLK HJBCAFLI HJBCAFIK CJBFAGLK IGBCAFLK CJBFAGLI CJBFAGIK HGBCAFLK HGBCAFLJ HGBCAFJK HGBCAFLI HGBCAFIK HGBCAFIJ EJBAICLK EJBCAHLK EIBCAHLK EJBCAHLI EJBCAHIK EJBCAGLK EGBAICLK EJBCAGLI EJBCAGIK EGBCAHLK HJBCAGLE HJBCAGEK EGBCAHLI EGBCAHIK HJBCAGEI EJBCAFLK EIBCAFLK EJBCAFLI EJBCAFIK HEBCAFLK HJBCAFLE HJBCAFEK HEBCAFLI HEBCAFIK HJBCAFEI EGBCAFLK EGBCAFLJ EGBCAFJK EGBCAFLI EGBCAFIK EGBCAFIJ HGBCAFLE HGBCAFEK HGBCAFEJ HGBCAFEI IJBCADLK HJBCADLK HIBCADLK HJBCADLI HJBCADIK CJBDAGLK IGBCADLK CJBDAGLI CJBDAGIK HGBCADLK HGBCADLJ HGBCADJK HGBCADLI HGBCADIK HGBCADIJ CJBDAFLK CIBDAFLK CJBDAFLI CJBDAFIK HFBCADLK CJBDAFLH HJBCAFDK HFBCADLI HFBCADIK HJBCAFDI CGBDAFLK CGBDAFLJ CGBDAFJK CGBDAFLI CGBDAFIK CGBDAFIJ CGBDAFLH HGBCAFDK HGBCAFDJ HGBCAFDI EJBCADLK EIBCADLK EJBCADLI EJBCADIK HEBCADLK HJBCADLE HJBCADEK HEBCADLI HEBCADIK HJBCADEI EGBCADLK EGBCADLJ EGBCADJK EGBCADLI EGBCADIK EGBCADIJ HGBCADLE HGBCADEK HGBCADEJ HGBCADEI CEBDAFLK CJBDAFLE CJBDAFEK CEBDAFLI CEBDAFIK CJBDAFEI HFBCADLE HEBCAFDK HJBCAFDE HEBCAFDI CGBDAFLE CGBDAFEK CGBDAFEJ CGBDAFEI HGBCAFDE
`.trim().split(/\s+/);

const ANNEX_C_BY_QUALIFYING_GROUPS = new Map(ANNEX_C_ASSIGNMENTS.map((assignment) => [[...assignment].sort().join(""), [...assignment]]));

export function getOfficialThirdPlaceAssignments(groupCodes: string[]) {
  return ANNEX_C_BY_QUALIFYING_GROUPS.get([...groupCodes].sort().join(""));
}

export const KNOCKOUT_MATCHES: KnockoutMatch[] = [
  { id: "M73", round: "round-of-32", dateLabel: "06/28", city: "LA", homeSlot: groupRank(2, "A"), awaySlot: groupRank(2, "B") },
  { id: "M74", round: "round-of-32", dateLabel: "06/29", city: "Boston", homeSlot: groupRank(1, "E"), awaySlot: thirdPlace("ABCDF") },
  { id: "M75", round: "round-of-32", dateLabel: "06/29", city: "Mty", homeSlot: groupRank(1, "F"), awaySlot: groupRank(2, "C") },
  { id: "M76", round: "round-of-32", dateLabel: "06/29", city: "Houston", homeSlot: groupRank(1, "C"), awaySlot: groupRank(2, "F") },
  { id: "M77", round: "round-of-32", dateLabel: "06/30", city: "NY", homeSlot: groupRank(1, "I"), awaySlot: thirdPlace("CDFGH") },
  { id: "M78", round: "round-of-32", dateLabel: "06/30", city: "Dallas", homeSlot: groupRank(2, "E"), awaySlot: groupRank(2, "I") },
  { id: "M79", round: "round-of-32", dateLabel: "06/30", city: "CDMX", homeSlot: groupRank(1, "A"), awaySlot: thirdPlace("CEFHI") },
  { id: "M80", round: "round-of-32", dateLabel: "07/01", city: "Atlanta", homeSlot: groupRank(1, "L"), awaySlot: thirdPlace("EHIJK") },
  { id: "M81", round: "round-of-32", dateLabel: "07/01", city: "SF Bay", homeSlot: groupRank(1, "D"), awaySlot: thirdPlace("BEFIJ") },
  { id: "M82", round: "round-of-32", dateLabel: "07/01", city: "Seattle", homeSlot: groupRank(1, "G"), awaySlot: thirdPlace("AEHIJ") },
  { id: "M83", round: "round-of-32", dateLabel: "07/02", city: "Toronto", homeSlot: groupRank(2, "K"), awaySlot: groupRank(2, "L") },
  { id: "M84", round: "round-of-32", dateLabel: "07/02", city: "LA", homeSlot: groupRank(1, "H"), awaySlot: groupRank(2, "J") },
  { id: "M85", round: "round-of-32", dateLabel: "07/02", city: "Vancouver", homeSlot: groupRank(1, "B"), awaySlot: thirdPlace("EFGIJ") },
  { id: "M86", round: "round-of-32", dateLabel: "07/03", city: "Miami", homeSlot: groupRank(1, "J"), awaySlot: groupRank(2, "H") },
  { id: "M87", round: "round-of-32", dateLabel: "07/03", city: "Kansas", homeSlot: groupRank(1, "K"), awaySlot: thirdPlace("DEIJL") },
  { id: "M88", round: "round-of-32", dateLabel: "07/03", city: "Dallas", homeSlot: groupRank(2, "D"), awaySlot: groupRank(2, "G") },
  { id: "M89", round: "round-of-16", dateLabel: "07/04", city: "Philadelphia", homeSlot: winner("M74"), awaySlot: winner("M77") },
  { id: "M90", round: "round-of-16", dateLabel: "07/04", city: "Houston", homeSlot: winner("M73"), awaySlot: winner("M75") },
  { id: "M91", round: "round-of-16", dateLabel: "07/05", city: "NY", homeSlot: winner("M76"), awaySlot: winner("M78") },
  { id: "M92", round: "round-of-16", dateLabel: "07/05", city: "CDMX", homeSlot: winner("M79"), awaySlot: winner("M80") },
  { id: "M93", round: "round-of-16", dateLabel: "07/06", city: "Dallas", homeSlot: winner("M83"), awaySlot: winner("M84") },
  { id: "M94", round: "round-of-16", dateLabel: "07/06", city: "Seattle", homeSlot: winner("M81"), awaySlot: winner("M82") },
  { id: "M95", round: "round-of-16", dateLabel: "07/07", city: "Atlanta", homeSlot: winner("M85"), awaySlot: winner("M86") },
  { id: "M96", round: "round-of-16", dateLabel: "07/07", city: "Vancouver", homeSlot: winner("M87"), awaySlot: winner("M88") },
  { id: "M97", round: "quarterfinal", dateLabel: "07/09", city: "Boston", homeSlot: winner("M89"), awaySlot: winner("M90") },
  { id: "M98", round: "quarterfinal", dateLabel: "07/10", city: "LA", homeSlot: winner("M93"), awaySlot: winner("M94") },
  { id: "M99", round: "quarterfinal", dateLabel: "07/11", city: "Miami", homeSlot: winner("M91"), awaySlot: winner("M92") },
  { id: "M100", round: "quarterfinal", dateLabel: "07/11", city: "Kansas", homeSlot: winner("M95"), awaySlot: winner("M96") },
  { id: "M101", round: "semifinal", dateLabel: "07/14", city: "Dallas", homeSlot: winner("M97"), awaySlot: winner("M98") },
  { id: "M102", round: "semifinal", dateLabel: "07/15", city: "Atlanta", homeSlot: winner("M99"), awaySlot: winner("M100") },
  { id: "M104", round: "final", dateLabel: "07/19", city: "NY", homeSlot: winner("M101"), awaySlot: winner("M102") },
];

export function buildBestThirdPlaceRows(groups: GroupStanding[]) {
  return groups
    .map((group) => group.rows[2])
    .filter((row): row is GroupStandingRow => row !== undefined)
    .sort(compareThirdPlaceRows);
}

export function getQualifyingThirdPlaceRows(groups: GroupStanding[]) {
  return buildBestThirdPlaceRows(groups).slice(0, 8);
}

export function resolveKnockoutSlot(slot: KnockoutSlot, groups: GroupStanding[]): ResolvedKnockoutSlot {
  return resolveKnockoutSlotWithUsedThirdPlaces(slot, groups, new Set<string>());
}

export function resolveKnockoutMatch(match: KnockoutMatch, groups: GroupStanding[], usedThirdPlaceGroups: Set<string>): ResolvedKnockoutMatch {
  return {
    ...match,
    home: resolveKnockoutSlotWithUsedThirdPlaces(match.homeSlot, groups, usedThirdPlaceGroups),
    away: resolveKnockoutSlotWithUsedThirdPlaces(match.awaySlot, groups, usedThirdPlaceGroups),
  };
}

export function resolveKnockoutRound(matches: KnockoutMatch[], groups: GroupStanding[], fixedMatches: FixedKnockoutMatch[] = []) {
  const usedThirdPlaceGroups = new Set<string>();
  const officialThirdPlaceAssignments = getOfficialThirdPlaceAssignments(getQualifyingThirdPlaceRows(groups).map((row) => row.groupCode));
  const fixedMatchById = new Map(fixedMatches.map((match) => [match.id, match]));

  return matches.map((match) => {
    const fixedMatch = fixedMatchById.get(match.id);
    if (fixedMatch) {
      return {
        ...match,
        home: fixedMatch.home,
        away: fixedMatch.away,
        source: "fixed" as const,
      };
    }

    return resolveKnockoutMatchWithOfficialThirdPlaces(match, groups, usedThirdPlaceGroups, officialThirdPlaceAssignments);
  });
}

function resolveKnockoutMatchWithOfficialThirdPlaces(
  match: KnockoutMatch,
  groups: GroupStanding[],
  usedThirdPlaceGroups: Set<string>,
  officialThirdPlaceAssignments?: string[],
): ResolvedKnockoutMatch {
  return {
    ...match,
    home: resolveKnockoutSlotWithOfficialThirdPlaces(match.homeSlot, groups, usedThirdPlaceGroups, match, officialThirdPlaceAssignments),
    away: resolveKnockoutSlotWithOfficialThirdPlaces(match.awaySlot, groups, usedThirdPlaceGroups, match, officialThirdPlaceAssignments),
    source: "calculated",
  };
}

function resolveKnockoutSlotWithOfficialThirdPlaces(
  slot: KnockoutSlot,
  groups: GroupStanding[],
  usedThirdPlaceGroups: Set<string>,
  match: KnockoutMatch,
  officialThirdPlaceAssignments?: string[],
) {
  if (slot.kind === "third-place") {
    const officialGroupCode = getOfficialThirdPlaceGroupForMatch(match, officialThirdPlaceAssignments);
    const team = officialGroupCode ? groups.find((group) => group.groupCode === officialGroupCode)?.rows[2] : undefined;
    if (team) {
      usedThirdPlaceGroups.add(team.groupCode);
      return { label: `3 ${slot.groupCodes.join("")}`, team };
    }
  }

  return resolveKnockoutSlotWithUsedThirdPlaces(slot, groups, usedThirdPlaceGroups);
}

function getOfficialThirdPlaceGroupForMatch(match: KnockoutMatch, officialThirdPlaceAssignments?: string[]) {
  if (!officialThirdPlaceAssignments || match.homeSlot.kind !== "group-rank" || match.homeSlot.rank !== 1) {
    return undefined;
  }

  const assignmentIndex = ANNEX_C_COLUMNS.indexOf(match.homeSlot.groupCode as (typeof ANNEX_C_COLUMNS)[number]);
  return assignmentIndex === -1 ? undefined : officialThirdPlaceAssignments[assignmentIndex];
}

function resolveKnockoutSlotWithUsedThirdPlaces(slot: KnockoutSlot, groups: GroupStanding[], usedThirdPlaceGroups: Set<string>): ResolvedKnockoutSlot {
  if (slot.kind === "group-rank") {
    const team = groups.find((group) => group.groupCode === slot.groupCode)?.rows[slot.rank - 1];
    return { label: `${slot.rank}${slot.groupCode}`, team };
  }

  if (slot.kind === "third-place") {
    const team = getQualifyingThirdPlaceRows(groups).find((row) => slot.groupCodes.includes(row.groupCode) && !usedThirdPlaceGroups.has(row.groupCode));
    if (team) {
      usedThirdPlaceGroups.add(team.groupCode);
    }
    return { label: `3 ${slot.groupCodes.join("")}`, team };
  }

  if (slot.kind === "winner") {
    return { label: `Ganador ${slot.sourceId}` };
  }

  return { label: slot.label };
}

function compareThirdPlaceRows(left: GroupStandingRow, right: GroupStandingRow) {
  return right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    (left.worldRanking ?? Number.POSITIVE_INFINITY) - (right.worldRanking ?? Number.POSITIVE_INFINITY) ||
    left.teamName.localeCompare(right.teamName);
}

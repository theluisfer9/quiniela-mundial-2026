import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent } from "react";

import type { GroupStandingRow } from "@/lib/calendar-groups";
import { KNOCKOUT_MATCHES, type KnockoutMatch, type KnockoutRound, type KnockoutSlot } from "@/lib/knockout-bracket";
import { useI18n, type AppCopy } from "@/lib/i18n";

type TeamLike = Pick<GroupStandingRow, "flagEmoji" | "teamCode" | "teamName">;

export type KnockoutBracketMatch = {
  matchId: string;
  kickoffAt: number;
  stageLabel: string;
  matchNumber?: number;
  venue?: string;
  status: "scheduled" | "live" | "finished";
  homeTeam: {
    id?: string;
    code: string;
    name: string;
    flagEmoji?: string;
  };
  awayTeam: {
    id?: string;
    code: string;
    name: string;
    flagEmoji?: string;
  };
  homeScore?: number;
  awayScore?: number;
};

type BracketSlot = {
  label: string;
  team?: TeamLike;
};

type BracketMatch = KnockoutMatch & {
  home: BracketSlot;
  away: BracketSlot;
  status?: KnockoutBracketMatch["status"];
  homeScore?: number;
  awayScore?: number;
  sourceMatch?: KnockoutBracketMatch;
  winner?: TeamLike;
};

type LayoutMatch = BracketMatch & {
  angle: number;
  radius: number;
  x: number;
  y: number;
};

type Point = {
  x: number;
  y: number;
};

const CENTER = 600;
const OUTER_FLAG_RADIUS = 548;
const SLOT_BRANCH_RADIUS = 504;
const FIRST_ROUND_PAIR_SPREAD = 5.8;
const FIRST_ROUND_RADIUS = 448;

const FLAG_RADIUS = 30;
const FLAG_HIT_RADIUS = 46;
const NODE_HIT_RADIUS = 18;
const ADVANCED_FLAG_OFFSET = 31;

const ROUND_RADIUS: Record<KnockoutRound, number> = {
  "round-of-32": FIRST_ROUND_RADIUS,
  "round-of-16": 342,
  quarterfinal: 248,
  semifinal: 164,
  final: 84,
};

const ROUND_INDEX: Record<KnockoutRound, number> = {
  "round-of-32": 0,
  "round-of-16": 1,
  quarterfinal: 2,
  semifinal: 3,
  final: 4,
};

const LEAF_START_ANGLE = 180;
const BRACKET_LEAF_ORDER = [
  "M73", "M75", "M74", "M77",
  "M83", "M84", "M81", "M82",
  "M76", "M78", "M79", "M80",
  "M85", "M86", "M87", "M88",
];
const BRACKET_LEAF_INDEX = new Map(BRACKET_LEAF_ORDER.map((id, index) => [id, index]));

const ROUND_MID_RADIUS: Record<KnockoutRound, number> = {
  "round-of-32": 392,
  "round-of-16": 294,
  quarterfinal: 206,
  semifinal: 124,
  final: 62,
};

const FLAG_CODES: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRO: "hr",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  JPN: "jp",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  PAR: "py",
  POR: "pt",
  RSA: "za",
  SEN: "sn",
  SUI: "ch",
  SWE: "se",
  USA: "us",
};

function teamFromCalendar(team: KnockoutBracketMatch["homeTeam"]): TeamLike {
  return {
    flagEmoji: team.flagEmoji,
    teamCode: team.code,
    teamName: team.name,
  };
}

function getMatchWinner(match: KnockoutBracketMatch): TeamLike | undefined {
  if (match.status !== "finished" || match.homeScore === undefined || match.awayScore === undefined || match.homeScore === match.awayScore) {
    return undefined;
  }

  return teamFromCalendar(match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam);
}

function slotFromTeam(team: KnockoutBracketMatch["homeTeam"]): BracketSlot {
  return { label: team.code, team: teamFromCalendar(team) };
}

function shortName(team: TeamLike | undefined, fallback: string) {
  return team?.teamCode ?? fallback;
}

function buildBracketMatches(matches: KnockoutBracketMatch[]) {
  const calendarById = new Map<string, KnockoutBracketMatch>(matches.flatMap((match) => match.matchNumber ? [[`M${match.matchNumber}`, match] as const] : []));
  const resolvedById = new Map<string, BracketMatch>();

  const resolveSlot = (slot: KnockoutSlot): BracketSlot => {
    if (slot.kind === "winner") {
      const source = resolvedById.get(slot.sourceId);
      return {
        label: `Ganador ${slot.sourceId}`,
        team: source?.winner,
      };
    }

    if (slot.kind === "group-rank") {
      return { label: `${slot.rank}${slot.groupCode}` };
    }

    if (slot.kind === "third-place") {
      return { label: `3 ${slot.groupCodes.join("")}` };
    }

    return { label: slot.label };
  };

  for (const match of KNOCKOUT_MATCHES) {
    const calendarMatch = calendarById.get(match.id);
    const winner = calendarMatch ? getMatchWinner(calendarMatch) : undefined;
    const resolved: BracketMatch = calendarMatch
      ? {
          ...match,
          home: slotFromTeam(calendarMatch.homeTeam),
          away: slotFromTeam(calendarMatch.awayTeam),
          homeScore: calendarMatch.homeScore,
          awayScore: calendarMatch.awayScore,
          sourceMatch: calendarMatch,
          status: calendarMatch.status,
          winner,
        }
      : {
          ...match,
          home: resolveSlot(match.homeSlot),
          away: resolveSlot(match.awaySlot),
        };

    resolvedById.set(match.id, resolved);
  }

  return [...resolvedById.values()];
}

function polar(angle: number, radius: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(radians) * radius,
    y: CENTER + Math.sin(radians) * radius,
  };
}

function shortestDelta(fromAngle: number, toAngle: number) {
  return ((toAngle - fromAngle + 540) % 360) - 180;
}

function circularMean(angles: number[]) {
  const sum = angles.reduce((acc, angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: acc.x + Math.cos(radians),
      y: acc.y + Math.sin(radians),
    };
  }, { x: 0, y: 0 });

  if (Math.abs(sum.x) < 0.001 && Math.abs(sum.y) < 0.001) {
    return angles[0] ?? -90;
  }

  return (Math.atan2(sum.y, sum.x) * 180) / Math.PI;
}

function arcPath(fromAngle: number, toAngle: number, radius: number) {
  const from = polar(fromAngle, radius);
  const to = polar(toAngle, radius);
  const delta = shortestDelta(fromAngle, toAngle);
  const largeArc = Math.abs(delta) > 180 ? 1 : 0;
  const sweep = delta >= 0 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${to.x} ${to.y}`;
}

function connectorPath(source: LayoutMatch, target: LayoutMatch) {
  const midRadius = ROUND_MID_RADIUS[source.round];
  const sourceStart = polar(source.angle, source.radius);
  const sourceMid = polar(source.angle, midRadius);
  const targetMid = polar(target.angle, midRadius);
  const targetEnd = polar(target.angle, target.radius);
  const arc = arcPath(source.angle, target.angle, midRadius).replace(/^M [\d.\-]+ [\d.\-]+ /, "");
  return `M ${sourceStart.x} ${sourceStart.y} L ${sourceMid.x} ${sourceMid.y} ${arc} L ${targetEnd.x} ${targetEnd.y}`;
}

function layoutBracket(matches: BracketMatch[]): LayoutMatch[] {
  const byRound = new Map<KnockoutRound, BracketMatch[]>();
  for (const match of matches) {
    byRound.set(match.round, [...(byRound.get(match.round) ?? []), match]);
  }

  const laidOut = new Map<string, LayoutMatch>();

  for (const round of ["round-of-32", "round-of-16", "quarterfinal", "semifinal", "final"] satisfies KnockoutRound[]) {
    const siblings = byRound.get(round) ?? [];
    siblings.forEach((match, index) => {
      const sourceIds = getSourceIds(match);
      const sourceAngles = sourceIds.flatMap((id) => {
        const source = laidOut.get(id);
        return source ? [source.angle] : [];
      });
      const leafIndex = BRACKET_LEAF_INDEX.get(match.id);
      const fallbackAngle = leafIndex !== undefined
        ? LEAF_START_ANGLE + (360 / BRACKET_LEAF_ORDER.length) * leafIndex
        : -90 + ROUND_INDEX[match.round] * 4 + (360 / siblings.length) * index;
      const angle = sourceAngles.length > 0 ? circularMean(sourceAngles) : fallbackAngle;
      const radius = ROUND_RADIUS[match.round];
      const point = polar(angle, radius);

      laidOut.set(match.id, {
        ...match,
        angle,
        radius,
        x: point.x,
        y: point.y,
      });
    });
  }

  return matches.flatMap((match) => {
    const laidOutMatch = laidOut.get(match.id);
    return laidOutMatch ? [laidOutMatch] : [];
  });
}

function getSourceIds(match: BracketMatch) {
  return [match.homeSlot, match.awaySlot].flatMap((slot) => slot.kind === "winner" ? [slot.sourceId] : []);
}

function formatScore(match: BracketMatch) {
  if (match.homeScore === undefined || match.awayScore === undefined) {
    return "vs";
  }

  return `${match.homeScore}-${match.awayScore}`;
}

function roundLabel(t: AppCopy["calendar"], round: KnockoutRound) {
  return t.knockoutRounds[round];
}

function statusLabel(match: BracketMatch, t: AppCopy["calendar"], statusCopy: AppCopy["home"]) {
  if (match.status === "finished") {
    return statusCopy.statusFinished;
  }
  if (match.status === "live") {
    return statusCopy.statusLive;
  }
  if (match.status === "scheduled") {
    return statusCopy.statusScheduled;
  }
  return roundLabel(t, match.round);
}

function matchHoverLabel(match: BracketMatch, t: AppCopy["calendar"]) {
  return `${roundLabel(t, match.round)} · ${shortName(match.home.team, t.pending)} vs ${shortName(match.away.team, t.pending)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function flagUrl(team?: TeamLike) {
  if (!team) {
    return undefined;
  }

  const code = FLAG_CODES[team.teamCode];
  return code ? `https://flagcdn.com/w80/${code}.png` : undefined;
}

function FlagBadge({ dimmed, point, selected, team, winner }: { dimmed?: boolean; point: Point; selected?: boolean; team?: TeamLike; winner?: boolean }) {
  const radius = selected ? FLAG_RADIUS + 5 : FLAG_RADIUS;
  const url = flagUrl(team);
  const clipId = `flag-${team?.teamCode ?? "empty"}-${Math.round(point.x)}-${Math.round(point.y)}`;

  return (
    <g opacity={dimmed ? 0.34 : 1}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={point.x} cy={point.y} r={radius} />
        </clipPath>
      </defs>
      <circle
        cx={point.x}
        cy={point.y}
        fill="transparent"
        r={radius}
        stroke={selected ? "#f7d66a" : "#0b0b0b"}
        strokeOpacity={selected ? 0.95 : 0.75}
        strokeWidth={selected ? 3 : 1}
      />
      {url ? (
        <image
          clipPath={`url(#${clipId})`}
          filter={dimmed ? "grayscale(1)" : undefined}
          height={radius * 2}
          href={url}
          preserveAspectRatio="xMidYMid slice"
          width={radius * 2}
          x={point.x - radius}
          y={point.y - radius}
        />
      ) : (
        <text dominantBaseline="middle" fontSize={selected ? 30 : 26} textAnchor="middle" x={point.x} y={point.y + 1}>
          {team?.flagEmoji ?? "•"}
        </text>
      )}
    </g>
  );
}

function SmallDot({ active, point }: { active?: boolean; point: Point }) {
  return <circle cx={point.x} cy={point.y} fill={active ? "#f7d66a" : "#6a675f"} r={active ? 5 : 4} />;
}

function slotConnectorPath(angle: number, match: LayoutMatch) {
  const hub = polar(match.angle, match.radius);
  const stem = polar(match.angle, SLOT_BRANCH_RADIUS);
  const flagEdge = polar(angle, OUTER_FLAG_RADIUS - FLAG_RADIUS - 4);
  const arc = arcPath(match.angle, angle, SLOT_BRANCH_RADIUS).replace(/^M [\d.\-]+ [\d.\-]+ /, "");
  return `M ${hub.x} ${hub.y} L ${stem.x} ${stem.y} ${arc} L ${flagEdge.x} ${flagEdge.y}`;
}

function advancedFlagPoint(source: LayoutMatch) {
  return polar(source.angle, source.radius - ADVANCED_FLAG_OFFSET);
}

function SlotMarker({ angle, match, onSelect, selected, slot, t }: { angle: number; match: LayoutMatch; onSelect: () => void; selected?: boolean; slot: BracketSlot; t: AppCopy["calendar"] }) {
  const point = polar(angle, OUTER_FLAG_RADIUS);
  const isLoser = match.status === "finished" && Boolean(match.winner && slot.team && match.winner.teamCode !== slot.team.teamCode);
  return (
    <g className="cursor-pointer" onClick={onSelect}>
      <title>{matchHoverLabel(match, t)}</title>
      <circle cx={point.x} cy={point.y} fill="#000" opacity="0.001" pointerEvents="all" r={FLAG_HIT_RADIUS} />
      <path d={slotConnectorPath(angle, match)} fill="none" stroke={selected ? "#f7d66a" : "#56534c"} strokeLinecap="round" strokeLinejoin="round" strokeWidth={selected ? 3 : 2} />
      <FlagBadge dimmed={isLoser} point={point} selected={selected} team={slot.team} />
    </g>
  );
}

function pointerPoint(event: PointerEvent<HTMLElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function pointerDistance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function toSvgPoint(point: Point, element: HTMLElement): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: (point.x / rect.width) * 1200,
    y: (point.y / rect.height) * 1200,
  };
}

function focalPan(previousPan: Point, previousZoom: number, nextZoom: number, focal: Point): Point {
  const focalFromCenter = {
    x: focal.x - CENTER,
    y: focal.y - CENTER,
  };
  const ratio = nextZoom / previousZoom;
  return {
    x: focalFromCenter.x - ratio * (focalFromCenter.x - previousPan.x),
    y: focalFromCenter.y - ratio * (focalFromCenter.y - previousPan.y),
  };
}

export function KnockoutRadialBracket({ matches }: { matches: KnockoutBracketMatch[] }) {
  const { t } = useI18n();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [selectedMatchId, setSelectedMatchId] = useState("M73");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const pointersRef = useRef(new Map<number, Point>());
  const pinchRef = useRef<{ distance: number; pan: Point; zoom: number } | null>(null);
  const panRef = useRef<{ pan: Point; pointerId: number; start: Point } | null>(null);
  const layout = useMemo(() => layoutBracket(buildBracketMatches(matches)), [matches]);
  const matchById = useMemo(() => new Map(layout.map((match) => [match.id, match])), [layout]);
  const selectedMatch = matchById.get(selectedMatchId) ?? layout[0];

  const zoomAt = (nextZoom: number, focal: Point) => {
    setPan((currentPan) => focalPan(currentPan, zoom, nextZoom, focal));
    setZoom(nextZoom);
  };

  const selectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setMobileDetailOpen(true);
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-background/85 p-3">
        <p className="text-sm font-semibold text-muted-foreground">{t.calendar.bracketHint}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button aria-label={t.calendar.zoomOut} className="h-10 rounded-full px-3" type="button" variant="outline" onClick={() => zoomAt(clamp(zoom - 0.15, 0.72, 1.9), { x: CENTER, y: CENTER })}>
            <ZoomOut className="size-4" />
          </Button>
          <Button aria-label={t.calendar.zoomIn} className="h-10 rounded-full px-3" type="button" variant="outline" onClick={() => zoomAt(clamp(zoom + 0.15, 0.72, 1.9), { x: CENTER, y: CENTER })}>
            <ZoomIn className="size-4" />
          </Button>
          <Button className="h-10 rounded-full px-4 text-xs font-black" type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
            {t.calendar.resetView}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="relative min-w-0">
          <div
          className="touch-none overflow-hidden rounded-[1.5rem] border border-[#37332d] bg-[#090909] shadow-[0_24px_80px_-50px_rgba(0,0,0,0.95)]"
          onPointerDown={(event) => {
            const point = pointerPoint(event);
            pointersRef.current.set(event.pointerId, point);
            if (pointersRef.current.size === 2) {
              const [first, second] = [...pointersRef.current.values()];
              pinchRef.current = { distance: pointerDistance(first, second), pan, zoom };
              panRef.current = null;
              event.currentTarget.setPointerCapture(event.pointerId);
            } else if (zoom > 1) {
              panRef.current = { pan, pointerId: event.pointerId, start: point };
              event.currentTarget.setPointerCapture(event.pointerId);
            }
          }}
          onPointerMove={(event) => {
            if (!pointersRef.current.has(event.pointerId)) {
              return;
            }
            const point = pointerPoint(event);
            pointersRef.current.set(event.pointerId, point);
            if (pointersRef.current.size === 2 && pinchRef.current) {
              const [first, second] = [...pointersRef.current.values()];
              const nextDistance = pointerDistance(first, second);
              const nextZoom = clamp(pinchRef.current.zoom * (nextDistance / pinchRef.current.distance), 0.72, 1.9);
              const focal = toSvgPoint(midpoint(first, second), event.currentTarget);
              setPan(focalPan(pinchRef.current.pan, pinchRef.current.zoom, nextZoom, focal));
              setZoom(nextZoom);
            } else if (panRef.current?.pointerId === event.pointerId && zoom > 1) {
              const rect = event.currentTarget.getBoundingClientRect();
              setPan({
                x: panRef.current.pan.x + ((point.x - panRef.current.start.x) / rect.width) * 1200,
                y: panRef.current.pan.y + ((point.y - panRef.current.start.y) / rect.height) * 1200,
              });
            }
          }}
          onPointerUp={(event) => {
            pointersRef.current.delete(event.pointerId);
            pinchRef.current = null;
            panRef.current = null;
          }}
          onPointerCancel={(event) => {
            pointersRef.current.delete(event.pointerId);
            pinchRef.current = null;
            panRef.current = null;
          }}
          onWheel={(event) => {
            event.preventDefault();
            const nextZoom = clamp(zoom + (event.deltaY > 0 ? -0.08 : 0.08), 0.72, 1.9);
            const rect = event.currentTarget.getBoundingClientRect();
            zoomAt(nextZoom, toSvgPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top }, event.currentTarget));
          }}
        >
          <svg aria-label={t.calendar.bracketAria} className="h-[56vh] min-h-[340px] w-full max-h-[540px] select-none" role="img" viewBox="0 0 1200 1200">
            <defs>
              <radialGradient id="cup-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f7d66a" stopOpacity="0.76" />
                <stop offset="36%" stopColor="#f7d66a" stopOpacity="0.34" />
                <stop offset="74%" stopColor="#d89a1f" stopOpacity="0.13" />
                <stop offset="100%" stopColor="#f7d66a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g transform={`translate(${CENTER + pan.x} ${CENTER + pan.y}) scale(${zoom}) translate(${-CENTER} ${-CENTER})`}>
              {[FIRST_ROUND_RADIUS, ROUND_RADIUS["round-of-16"], ROUND_RADIUS.quarterfinal, ROUND_RADIUS.semifinal, ROUND_RADIUS.final].map((radius) => (
                <circle key={radius} cx={CENTER} cy={CENTER} fill="none" r={radius} stroke="#8b806b" strokeOpacity="0.18" strokeWidth="2" />
              ))}

              {layout.map((match) => {
                const isSelected = selectedMatch?.id === match.id;
                const active = Boolean(match.winner) || isSelected;
                return (
                  <g key={`${match.id}-incoming`} className="cursor-pointer" onClick={() => selectMatch(match.id)}>
                    <title>{matchHoverLabel(match, t.calendar)}</title>
                    <circle cx={match.x} cy={match.y} fill="#000" opacity="0.001" pointerEvents="all" r={NODE_HIT_RADIUS} />
                    {match.round === "round-of-32" ? (
                      <>
                        <SlotMarker angle={match.angle - FIRST_ROUND_PAIR_SPREAD} match={match} onSelect={() => selectMatch(match.id)} selected={isSelected} slot={match.home} t={t.calendar} />
                        <SlotMarker angle={match.angle + FIRST_ROUND_PAIR_SPREAD} match={match} onSelect={() => selectMatch(match.id)} selected={isSelected} slot={match.away} t={t.calendar} />
                      </>
                    ) : null}
                    {getSourceIds(match).map((sourceId) => {
                      const source = matchById.get(sourceId);
                      if (!source) {
                        return null;
                      }

                      return (
                        <path
                          key={`${sourceId}-${match.id}`}
                          d={connectorPath(source, match)}
                          fill="none"
                          stroke="#5f5a50"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeOpacity="0.48"
                          strokeWidth="2"
                        />
                      );
                    })}
                    <SmallDot active={active} point={match} />
                  </g>
                );
              })}

              <g>
                <circle cx={CENTER} cy={CENTER} fill="url(#cup-glow)" r="150" />
                <image height="158" href="/world-cup-trophy.png" preserveAspectRatio="xMidYMid meet" width="66" x={CENTER - 33} y={CENTER - 86} />
              </g>

              {layout.map((match) => {
                const isSelected = selectedMatch?.id === match.id;
                const nodePoint = polar(match.angle, match.radius);
                const hasNodeTarget = match.round !== "round-of-32";

                return (
                  <g key={`${match.id}-node`} className="cursor-pointer" onClick={() => selectMatch(match.id)}>
                    <title>{matchHoverLabel(match, t.calendar)}</title>
                    {hasNodeTarget ? <circle cx={nodePoint.x} cy={nodePoint.y} fill="#000" opacity="0.001" pointerEvents="all" r={NODE_HIT_RADIUS} /> : null}
                    {isSelected ? (
                      <text dominantBaseline="middle" fill="#f7d66a" fontSize="12" fontWeight="900" letterSpacing="1.5" textAnchor="middle" x={nodePoint.x} y={nodePoint.y + 32}>{roundLabel(t.calendar, match.round)}</text>
                    ) : null}
                  </g>
                );
              })}

              {layout.flatMap((match) => {
                if (match.round === "round-of-32") {
                  return [];
                }

                return ([
                  { key: "home", slot: match.homeSlot, team: match.home.team },
                  { key: "away", slot: match.awaySlot, team: match.away.team },
                ] as const).flatMap(({ key, slot, team }) => {
                  if (!team || slot.kind !== "winner") {
                    return [];
                  }

                  const source = matchById.get(slot.sourceId);
                  if (!source) {
                    return [];
                  }

                  const point = advancedFlagPoint(source);
                  const isSelected = selectedMatch?.id === match.id;

                  return [
                    <g key={`${match.id}-${key}-advanced`} className="cursor-pointer" onClick={() => selectMatch(match.id)}>
                      <title>{matchHoverLabel(match, t.calendar)}</title>
                      <circle cx={point.x} cy={point.y} fill="#000" opacity="0.001" pointerEvents="all" r={FLAG_HIT_RADIUS} />
                      <FlagBadge point={point} selected={isSelected} team={team} />
                    </g>,
                  ];
                });
              })}
            </g>
          </svg>
          </div>

          {selectedMatch && mobileDetailOpen ? (
            <div className="absolute inset-x-3 bottom-3 z-10 xl:hidden" onPointerDown={(event) => event.stopPropagation()}>
              <MatchDetailCard match={selectedMatch} onClose={() => setMobileDetailOpen(false)} />
            </div>
          ) : null}
        </div>

        {selectedMatch ? (
          <aside className="hidden xl:block">
            <MatchDetailCard match={selectedMatch} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function MatchDetailCard({ match, onClose }: { match: LayoutMatch; onClose?: () => void }) {
  const { t } = useI18n();

  return (
    <article className="rounded-[1.35rem] border border-border/70 bg-card/95 p-4 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.35)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black tracking-[0.18em] text-primary uppercase">{roundLabel(t.calendar, match.round)}</p>
          <h3 className="mt-2 font-display text-xl font-extrabold tracking-[-0.04em] text-foreground xl:text-2xl">
            {match.home.team?.flagEmoji ?? "◦"} {shortName(match.home.team, t.calendar.pending)} <span className="text-muted-foreground">vs</span> {match.away.team?.flagEmoji ?? "◦"} {shortName(match.away.team, t.calendar.pending)}
          </h3>
        </div>
        {onClose ? (
          <button aria-label={t.calendar.closeDetail} className="rounded-full border border-border/70 bg-background/80 p-2 text-muted-foreground transition hover:text-foreground" type="button" onClick={onClose}>
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2 rounded-[1rem] border border-border/70 bg-background/80 p-3 text-sm font-semibold">
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.calendar.status}</span><span>{statusLabel(match, t.calendar, t.home)}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.calendar.score90}</span><span>{formatScore(match)}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.calendar.advances}</span><span>{match.winner ? `${match.winner.flagEmoji ?? ""} ${match.winner.teamName}` : t.calendar.pending}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.calendar.venue}</span><span>{match.city}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.calendar.date}</span><span>{match.dateLabel}</span></div>
      </div>
    </article>
  );
}

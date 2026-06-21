export type FotMobDisciplineEvent = {
  cardType: "yellow" | "red" | "secondYellow";
  minute: number | null;
  minuteAdded: number | null;
  playerName: string | null;
  providerEventId: string;
  providerPlayerId: string | null;
  teamSide: "home" | "away" | "unknown";
};

export type FotMobMatchListEntry = {
  awayCode: string | null;
  awayName: string | null;
  awayRedCards: number;
  awayYellowCards: number | null;
  homeCode: string | null;
  homeName: string | null;
  homeRedCards: number;
  homeYellowCards: number | null;
  kickoffAt: number | null;
  providerMatchId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return isRecord(field) ? field : null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.replace("+", "").trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }
  return Number(normalized);
}

function normalizeCardType(card: unknown): FotMobDisciplineEvent["cardType"] | null {
  const normalized = getString(card)?.replace(/[\s_-]/g, "").toLowerCase();
  if (normalized === "yellow" || normalized === "yellowcard") {
    return "yellow";
  }
  if (normalized === "red" || normalized === "redcard") {
    return "red";
  }
  if (
    normalized === "yellowred" ||
    normalized === "secondyellow" ||
    normalized === "secondyellowcard" ||
    normalized === "yellowredcard"
  ) {
    return "secondYellow";
  }
  return null;
}

function getTeamSide(event: Record<string, unknown>): FotMobDisciplineEvent["teamSide"] {
  if (event.isHome === true) {
    return "home";
  }
  if (event.isHome === false) {
    return "away";
  }
  return "unknown";
}

function buildProviderEventId(event: Record<string, unknown>, parsed: Omit<FotMobDisciplineEvent, "providerEventId">) {
  const eventId = event.eventId;
  if (typeof eventId === "string" || typeof eventId === "number") {
    return String(eventId);
  }

  return [
    parsed.teamSide,
    parsed.minute ?? "unknown",
    parsed.minuteAdded ?? 0,
    parsed.playerName ?? "unknown",
    parsed.cardType,
  ].join("-");
}

export function parseFotMobDisciplineEvents(details: unknown): FotMobDisciplineEvent[] {
  if (!isRecord(details)) {
    return [];
  }

  const content = getRecord(details, "content");
  const matchFacts = content ? getRecord(content, "matchFacts") : null;
  const eventsWrapper = matchFacts ? getRecord(matchFacts, "events") : null;
  const events = eventsWrapper?.events;
  if (!Array.isArray(events)) {
    return [];
  }

  return events.flatMap((candidate) => {
    if (!isRecord(candidate) || candidate.type !== "Card") {
      return [];
    }

    const cardType = normalizeCardType(candidate.card);
    if (!cardType) {
      return [];
    }

    const player = getRecord(candidate, "player");
    const parsedWithoutProviderId = {
      cardType,
      minute: parseNumber(candidate.time ?? candidate.timeStr),
      minuteAdded: parseNumber(candidate.overloadTime ?? candidate.overloadTimeStr),
      playerName: (player && getString(player.name)) ?? getString(candidate.nameStr),
      providerPlayerId: player ? getNumber(player.id)?.toString() ?? getString(player.id) : null,
      teamSide: getTeamSide(candidate),
    } satisfies Omit<FotMobDisciplineEvent, "providerEventId">;

    return [{ ...parsedWithoutProviderId, providerEventId: buildProviderEventId(candidate, parsedWithoutProviderId) }];
  });
}

export function getPreviousGuatemalaDate(nowMs: number) {
  const guatemalaDate = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Guatemala",
    year: "numeric",
  }).format(new Date(nowMs));
  const previousNoonUtc = Date.parse(`${guatemalaDate}T12:00:00.000Z`) - 24 * 60 * 60 * 1000;

  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(previousNoonUtc));
}

export function getGuatemalaDateRangeUtc(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date must be YYYY-MM-DD");
  }

  const startUtc = Date.parse(`${date}T06:00:00.000Z`);
  return {
    endUtc: startUtc + 24 * 60 * 60 * 1000,
    startUtc,
  };
}

function decodeXmlAttribute(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getXmlAttribute(tag: string, attribute: string) {
  const match = tag.match(new RegExp(`${attribute}="([^"]*)"`));
  return match ? decodeXmlAttribute(match[1]) : null;
}

function getXmlNumberAttribute(tag: string, attribute: string) {
  const value = getXmlAttribute(tag, attribute);
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }
  return Number(value);
}

function parseFotMobUtcTime(value: string | null) {
  const match = value?.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const [, day, month, year, hour, minute] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

export function parseFotMobMatchesXml(xml: string): FotMobMatchListEntry[] {
  return [...xml.matchAll(/<match\s+[^>]*\/>/g)].flatMap(([tag]) => {
    const providerMatchId = getXmlAttribute(tag, "id");
    if (!providerMatchId) {
      return [];
    }

    return [{
      awayCode: getXmlAttribute(tag, "ats"),
      awayName: getXmlAttribute(tag, "aTeam"),
      awayRedCards: getXmlNumberAttribute(tag, "rca") ?? 0,
      awayYellowCards: getXmlNumberAttribute(tag, "yca") ?? getXmlNumberAttribute(tag, "yca1"),
      homeCode: getXmlAttribute(tag, "hts"),
      homeName: getXmlAttribute(tag, "hTeam"),
      homeRedCards: getXmlNumberAttribute(tag, "rch") ?? 0,
      homeYellowCards: getXmlNumberAttribute(tag, "ych") ?? getXmlNumberAttribute(tag, "ych1"),
      kickoffAt: parseFotMobUtcTime(getXmlAttribute(tag, "time")),
      providerMatchId,
    }];
  });
}

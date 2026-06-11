import type { AppLocale } from "./i18n";
import type { PublicDashboardMatch } from "./public-dashboard";

export type ShareStandingsRow = {
  rank: number;
  name: string;
  points: number;
  isCurrentUser?: boolean;
  rankDelta?: -1 | 0 | 1;
};

export type ShareStandingsModel = {
  title: string;
  subtitle: string;
  generatedLabel: string;
  liveSummary: string | null;
  rows: ShareStandingsRow[];
};

export function buildShareStandingsModel({
  generatedAt,
  liveMatches,
  locale,
  rows,
}: {
  generatedAt: number;
  liveMatches: PublicDashboardMatch[];
  locale: AppLocale;
  rows: ShareStandingsRow[];
}): ShareStandingsModel {
  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-GT" : "en-GT", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "America/Guatemala",
  });
  const liveMatch = liveMatches[0];

  return {
    title: "Quiniela Mundial 2026",
    subtitle: locale === "es" ? "Tabla completa" : "Full standings",
    generatedLabel: `${locale === "es" ? "Actualizado" : "Updated"} ${dateFormatter.format(generatedAt)} Guatemala`,
    liveSummary: liveMatch
      ? `${locale === "es" ? "En vivo" : "Live"}: ${liveMatch.homeTeam.name} ${liveMatch.homeScore ?? "-"}-${liveMatch.awayScore ?? "-"} ${liveMatch.awayTeam.name}`
      : null,
    rows,
  };
}

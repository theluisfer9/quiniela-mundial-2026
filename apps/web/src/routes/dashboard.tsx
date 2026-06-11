import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Award, BarChart3, Flame, Target, Trophy, UsersRound } from "lucide-react";
import { useRef, useState } from "react";

import { ShareStandingsExport } from "@/components/share-standings-export";
import {
  formatRankDelta,
  formatStreak,
  getDashboardSummaryCards,
  type DashboardAnalyticsData,
  type DashboardAnalyticsRow,
  type DashboardSummaryMatchData,
  type DashboardConsensusMatch,
} from "@/lib/dashboard-analytics";
import { useI18n } from "@/lib/i18n";
import { localizeStageLabel, localizeTeamName } from "@/lib/team-i18n";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { dateLocale, locale, t } = useI18n();
  const analytics = useQuery(api.standings.getPublicDashboardAnalytics, {}) as DashboardAnalyticsData | undefined;
  const matches = useQuery(api.matches.getPublicDashboardMatches, {}) as DashboardSummaryMatchData | undefined;
  const summaryMatches = matches
    ? {
        ...matches,
        liveMatches: matches.liveMatches.map((match) => ({
          ...match,
          homeTeam: {
            ...match.homeTeam,
            name: localizeTeamName({ code: match.homeTeam.code, locale, name: match.homeTeam.name }),
          },
          awayTeam: {
            ...match.awayTeam,
            name: localizeTeamName({ code: match.awayTeam.code, locale, name: match.awayTeam.name }),
          },
        })),
        upcomingMatches: matches.upcomingMatches.map((match) => ({
          ...match,
          homeTeam: {
            ...match.homeTeam,
            name: localizeTeamName({ code: match.homeTeam.code, locale, name: match.homeTeam.name }),
          },
          awayTeam: {
            ...match.awayTeam,
            name: localizeTeamName({ code: match.awayTeam.code, locale, name: match.awayTeam.name }),
          },
        })),
      }
    : undefined;
  const summaryCards = getDashboardSummaryCards(analytics, summaryMatches, {
    locale: dateLocale,
    labels: {
      leader: t.analytics.leader,
      mostExact: t.analytics.mostExact,
      bestStreak: t.analytics.bestStreak,
      nextDeadline: t.analytics.nextDeadline,
      undefined: t.common.undefined,
      noClosedMatches: t.analytics.noClosedMatches,
      markers: t.analytics.markers,
      points: t.analytics.points,
      consecutiveHits: t.analytics.consecutiveHits,
      noScheduledMatches: t.analytics.noScheduledMatches,
    },
  });
  const hasRows = (analytics?.rows.length ?? 0) > 0;

  return (
    <div className="grid gap-6">
      <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-[#2A398D] px-4 py-6 text-white shadow-[0_30px_80px_-44px_rgba(42,57,141,0.72)] sm:rounded-[2rem] sm:px-7 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(230,29,37,0.28),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(60,172,59,0.2),transparent_22%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <p className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
              {t.dashboard.eyebrow}
            </p>
            <div>
              <h1 className="text-balance font-display text-4xl leading-[0.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {t.dashboard.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:mt-5 sm:text-lg sm:leading-7">
                {t.dashboard.description}
              </p>
            </div>
          </div>
          <Button className="w-full rounded-[1rem] bg-white text-[#2A398D] hover:bg-white/92 sm:w-auto" render={<a href="/pronosticos" />}>
            {t.common.myMatches}
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => {
          const icons = [Trophy, Target, Flame, UsersRound] as const;
          const Icon = icons[index] ?? Trophy;
          return (
            <article key={card.label} className="rounded-[1.5rem] border border-primary/12 bg-card/98 p-5 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">{card.label}</p>
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </div>
              <p className="mt-4 truncate font-display text-3xl font-extrabold tracking-[-0.04em] text-foreground">{card.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
            </article>
          );
        })}
      </div>

      <AppSection
        eyebrow={t.dashboard.standingsEyebrow}
        title={t.dashboard.standingsTitle}
        description={t.dashboard.standingsDescription}
        className="border-primary/15 bg-card/98"
      >
        {hasRows ? (
          <>
            <StandingsTable rows={analytics!.rows} />
            <ShareStandingsExport liveMatches={summaryMatches?.liveMatches ?? []} rows={analytics!.rows} />
          </>
        ) : <EmptyPanel label={t.dashboard.emptyStandings} />}
      </AppSection>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
        <AppSection eyebrow={t.dashboard.awardsEyebrow} title={t.dashboard.awardsTitle} description={t.dashboard.awardsDescription} className="border-primary/15 bg-card/98">
          {analytics ? <AwardsGrid awards={analytics.awardCards} /> : <EmptyPanel label={t.dashboard.loadingAwards} />}
        </AppSection>

        <AppSection eyebrow={t.dashboard.streaksEyebrow} title={t.dashboard.streaksTitle} description={t.dashboard.streaksDescription} className="border-primary/15 bg-card/98">
          {analytics ? <StreakList rows={analytics.rows} /> : <EmptyPanel label={t.dashboard.loadingStreaks} />}
        </AppSection>
      </div>

      <AppSection
        eyebrow={t.dashboard.consensusEyebrow}
        title={t.dashboard.consensusTitle}
        description={t.dashboard.consensusDescription}
        className="border-primary/15 bg-card/98"
      >
        {analytics && analytics.consensusMatches.length > 0 ? (
          <ConsensusGrid matches={analytics.consensusMatches} />
        ) : (
          <EmptyPanel label={t.dashboard.emptyConsensus} />
        )}
      </AppSection>
    </div>
  );
}

function StandingsTable({ rows }: { rows: DashboardAnalyticsRow[] }) {
  const { t } = useI18n();
  const [mobilePage, setMobilePage] = useState(1);
  const mobileTableStartRef = useRef<HTMLDivElement>(null);
  const mobilePageSize = 6;
  const mobilePageCount = Math.max(1, Math.ceil(rows.length / mobilePageSize));
  const currentMobilePage = Math.min(mobilePage, mobilePageCount);
  const mobileRows = rows.slice((currentMobilePage - 1) * mobilePageSize, currentMobilePage * mobilePageSize);

  function moveMobilePage(nextPage: number) {
    setMobilePage(nextPage);
    requestAnimationFrame(() => {
      mobileTableStartRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  return (
    <>
      <div ref={mobileTableStartRef} className="grid scroll-mt-24 gap-3 md:hidden">
        {mobileRows.map((row) => (
          <article key={row.name} className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold tracking-[0.18em] text-primary uppercase">#{row.rank}</p>
                <h3 className="mt-1 truncate font-display text-2xl font-extrabold tracking-[-0.04em] text-foreground">{row.name}</h3>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">{row.points}</p>
                <p className="text-xs font-semibold text-muted-foreground">pts</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <MetricPill label={t.dashboard.exacts} value={String(row.exactScoreCount)} />
              <MetricPill label={t.dashboard.hits} value={`${row.outcomeHitCount}/${row.predictionCount}`} />
              <MetricPill label={t.dashboard.precision} value={`${row.precision}%`} />
              <MetricPill label={t.dashboard.streak} value={formatStreak(row.currentStreak, getStreakLabels(t))} />
            </div>
            <p className={cn("mt-3 text-sm font-semibold", row.rankDelta > 0 && "text-emerald-700", row.rankDelta < 0 && "text-red-600", row.rankDelta === 0 && "text-muted-foreground")}>
              {formatRankDelta(row.rankDelta, getRankDeltaLabels(t))} {row.leaderGap === 0 ? t.dashboard.inLead : t.dashboard.leaderGap(row.leaderGap)}
            </p>
          </article>
        ))}
        {mobilePageCount > 1 ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
            <Button
              className="h-10 rounded-[1rem]"
              disabled={currentMobilePage === 1}
              onClick={() => moveMobilePage(Math.max(1, currentMobilePage - 1))}
              type="button"
              variant="outline"
            >
              {t.common.previous}
            </Button>
            <p className="px-2 text-center text-xs font-semibold text-muted-foreground">
              {currentMobilePage} / {mobilePageCount}
            </p>
            <Button
              className="h-10 rounded-[1rem]"
              disabled={currentMobilePage === mobilePageCount}
              onClick={() => moveMobilePage(Math.min(mobilePageCount, currentMobilePage + 1))}
              type="button"
              variant="outline"
            >
              {t.common.next}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="hidden overflow-x-auto rounded-[1.35rem] border border-border/70 bg-background/80 md:block">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t.dashboard.fullCaption}</caption>
        <thead>
          <tr className="border-b border-border/70 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            <th className="px-4 py-3 text-left font-semibold" scope="col">{t.dashboard.pos}</th>
            <th className="px-4 py-3 text-left font-semibold" scope="col">{t.home.participant}</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{t.common.pointsShort}</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{t.dashboard.leaderDiff}</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{t.dashboard.exacts}</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{t.dashboard.hits}</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{t.dashboard.precision}</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{t.dashboard.streak}</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{t.dashboard.movement}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/60 last:border-b-0">
              <th className="px-4 py-3 text-left font-display text-lg font-bold tracking-[-0.03em] text-foreground" scope="row">#{row.rank}</th>
              <td className="min-w-0 max-w-[14rem] break-words px-4 py-3 font-semibold text-foreground">{row.name}</td>
              <td className="px-4 py-3 text-right font-display text-lg font-bold text-foreground">{row.points}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{row.leaderGap === 0 ? "-" : `-${row.leaderGap}`}</td>
              <td className="px-4 py-3 text-right">{row.exactScoreCount}</td>
              <td className="px-4 py-3 text-right">{row.outcomeHitCount}/{row.predictionCount}</td>
              <td className="px-4 py-3 text-right">{row.precision}%</td>
              <td className="px-4 py-3 text-right">{formatStreak(row.currentStreak, getStreakLabels(t))}</td>
              <td className={cn("px-4 py-3 text-right font-semibold", row.rankDelta > 0 && "text-emerald-700", row.rankDelta < 0 && "text-red-600")}>{formatRankDelta(row.rankDelta, getRankDeltaLabels(t))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.95rem] bg-muted/45 px-3 py-2">
      <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AwardsGrid({ awards }: { awards: DashboardAnalyticsData["awardCards"] }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {awards.map((award) => {
        const translatedAward = translateAward(award, t);

        return (
          <article key={award.label} className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Award aria-hidden="true" className="size-4" />
              <p className="text-[0.7rem] font-bold tracking-[0.18em] uppercase">{translatedAward.label}</p>
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em] text-foreground">{translatedAward.name}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{translatedAward.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{translatedAward.description}</p>
          </article>
        );
      })}
    </div>
  );
}

function StreakList({ rows }: { rows: DashboardAnalyticsRow[] }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3">
      {rows.slice(0, 6).map((row) => (
        <div key={row.name} className="grid gap-2 rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <div>
            <p className="font-semibold text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{t.dashboard.nearMisses(row.nearMissCount)}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-display text-lg font-bold tracking-[-0.03em] text-foreground">{formatStreak(row.currentStreak, getStreakLabels(t))}</p>
            <p className="text-xs text-muted-foreground">{t.dashboard.best(row.longestStreak)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConsensusGrid({ matches }: { matches: DashboardConsensusMatch[] }) {
  const { locale, t } = useI18n();

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {matches.slice(-6).reverse().map((match) => (
        <article key={match.matchId} className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
          <p className="text-[0.7rem] font-bold tracking-[0.18em] text-primary uppercase">{localizeStageLabel(match.stageLabel, locale)}</p>
          <h3 className="mt-2 text-balance font-display text-lg font-bold tracking-[-0.03em] text-foreground sm:text-xl">
            {localizeTeamName({ locale, name: match.homeTeamName })} vs {localizeTeamName({ locale, name: match.awayTeamName })}
          </h3>
          <div className="mt-4 grid gap-2">
            <ConsensusBar label={localizeTeamName({ locale, name: match.homeTeamName })} count={match.homeCount} total={match.totalCount} />
            <ConsensusBar label={t.dashboard.draw} count={match.drawCount} total={match.totalCount} />
            <ConsensusBar label={localizeTeamName({ locale, name: match.awayTeamName })} count={match.awayCount} total={match.totalCount} />
          </div>
        </article>
      ))}
    </div>
  );
}

function ConsensusBar({ count, label, total }: { count: number; label: string; total: number }) {
  const { t } = useI18n();
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">{t.dashboard.votes(count)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <p className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">{label}</p>;
}

function getRankDeltaLabels(t: ReturnType<typeof useI18n>["t"]) {
  return {
    up: t.analytics.rankUp,
    down: t.analytics.rankDown,
    same: t.analytics.rankSame,
  };
}

function getStreakLabels(t: ReturnType<typeof useI18n>["t"]) {
  return {
    hits: t.analytics.streakHits,
    misses: t.analytics.streakMisses,
    none: t.analytics.noStreak,
  };
}

function translateAward(award: DashboardAnalyticsData["awardCards"][number], t: ReturnType<typeof useI18n>["t"]) {
  const awardLabelBySpanish = new Map([
    ["Nostradamus", "Nostradamus"],
    ["Mas exactos", t.analytics.mostExact],
    ["Rey de las tragedias", t.dashboard.awards.heartbreakKing],
    ["Senor empate", t.dashboard.awards.drawMaster],
    ["Rey del 1-0", t.dashboard.awards.oneZeroKing],
    ["Contra la corriente", t.dashboard.awards.contrarian],
  ]);
  const awardDescriptionBySpanish = new Map([
    ["Mas puntos acumulados.", t.dashboard.awards.nostradamusDescription],
    ["Marcadores clavados.", t.dashboard.awards.mostExactDescription],
    ["Mas marcadores rozados.", t.dashboard.awards.heartbreakDescription],
    ["Mas empates pronosticados.", t.dashboard.awards.drawDescription],
    ["El marcador favorito del torneo.", t.dashboard.awards.oneZeroDescription],
    ["Acerto cuando la familia iba para otro lado.", t.dashboard.awards.contrarianDescription],
  ]);

  return {
    ...award,
    label: awardLabelBySpanish.get(award.label) ?? award.label,
    name: award.name === "Por definir" ? t.common.undefined : award.name,
    value: translateAwardValue(award.value, t),
    description: awardDescriptionBySpanish.get(award.description) ?? award.description,
  };
}

function translateAwardValue(value: string, t: ReturnType<typeof useI18n>["t"]) {
  const points = value.match(/^(\d+) pts$/);
  if (points) {
    return t.analytics.points(Number(points[1]));
  }

  const exacts = value.match(/^(\d+) exactos$/);
  if (exacts) {
    return t.dashboard.awards.exacts(Number(exacts[1]));
  }

  const oneGoal = value.match(/^(\d+) por un gol$/);
  if (oneGoal) {
    return t.dashboard.awards.oneGoal(Number(oneGoal[1]));
  }

  const draws = value.match(/^(\d+) empates$/);
  if (draws) {
    return t.dashboard.awards.draws(Number(draws[1]));
  }

  const hits = value.match(/^(\d+) aciertos$/);
  if (hits) {
    return t.dashboard.awards.hits(Number(hits[1]));
  }

  return value;
}

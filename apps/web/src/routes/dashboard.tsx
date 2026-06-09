import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Award, BarChart3, Flame, Target, Trophy, UsersRound } from "lucide-react";
import { useRef, useState } from "react";

import {
  formatRankDelta,
  formatStreak,
  getDashboardSummaryCards,
  type DashboardAnalyticsData,
  type DashboardAnalyticsRow,
  type DashboardSummaryMatchData,
  type DashboardConsensusMatch,
} from "@/lib/dashboard-analytics";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const analytics = useQuery(api.standings.getPublicDashboardAnalytics, {}) as DashboardAnalyticsData | undefined;
  const matches = useQuery(api.matches.getPublicDashboardMatches, {}) as DashboardSummaryMatchData | undefined;
  const summaryCards = getDashboardSummaryCards(analytics, matches);
  const hasRows = (analytics?.rows.length ?? 0) > 0;

  return (
    <div className="grid gap-6">
      <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-[#2A398D] px-4 py-6 text-white shadow-[0_30px_80px_-44px_rgba(42,57,141,0.72)] sm:rounded-[2rem] sm:px-7 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(230,29,37,0.28),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(60,172,59,0.2),transparent_22%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <p className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
              Tablero familiar
            </p>
            <div>
              <h1 className="text-balance font-display text-4xl leading-[0.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                La quiniela completa, sin filtro.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:mt-5 sm:text-lg sm:leading-7">
                Posiciones, exactos, rachas, tragedias y consenso familiar. Las predicciones privadas no se revelan antes de que empiece cada partido.
              </p>
            </div>
          </div>
          <Button className="w-full rounded-[1rem] bg-white text-[#2A398D] hover:bg-white/92 sm:w-auto" render={<a href="/pronosticos" />}>
            Mis partidos
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
        eyebrow="Clasificacion"
        title="General"
        description="Puntos por partidos cerrados: exacto vale 3, ganador/empate correcto vale 1."
        className="border-primary/15 bg-card/98"
      >
        {hasRows ? <StandingsTable rows={analytics!.rows} /> : <EmptyPanel label="La tabla aparecerá cuando haya partidos cerrados." />}
      </AppSection>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
        <AppSection eyebrow="Premios" title="Especiales" description="Reconocimientos que se van moviendo conforme avanzan los partidos." className="border-primary/15 bg-card/98">
          {analytics ? <AwardsGrid awards={analytics.awardCards} /> : <EmptyPanel label="Cargando premios." />}
        </AppSection>

        <AppSection eyebrow="Rachas" title="Quién viene enrachado" description="Aciertos y fallos consecutivos en partidos cerrados." className="border-primary/15 bg-card/98">
          {analytics ? <StreakList rows={analytics.rows} /> : <EmptyPanel label="Cargando rachas." />}
        </AppSection>
      </div>

      <AppSection
        eyebrow="Consenso familiar"
        title="Dónde está votando la familia"
        description="Solo partidos que ya empezaron o terminaron. No se muestran picks individuales antes del inicio."
        className="border-primary/15 bg-card/98"
      >
        {analytics && analytics.consensusMatches.length > 0 ? (
          <ConsensusGrid matches={analytics.consensusMatches} />
        ) : (
          <EmptyPanel label="El consenso aparecerá cuando empiecen partidos con pronósticos." />
        )}
      </AppSection>
    </div>
  );
}

function StandingsTable({ rows }: { rows: DashboardAnalyticsRow[] }) {
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
              <MetricPill label="Exactos" value={String(row.exactScoreCount)} />
              <MetricPill label="Aciertos" value={`${row.outcomeHitCount}/${row.predictionCount}`} />
              <MetricPill label="Precisión" value={`${row.precision}%`} />
              <MetricPill label="Racha" value={formatStreak(row.currentStreak)} />
            </div>
            <p className={cn("mt-3 text-sm font-semibold", row.rankDelta > 0 && "text-emerald-700", row.rankDelta < 0 && "text-red-600", row.rankDelta === 0 && "text-muted-foreground")}>
              {formatRankDelta(row.rankDelta)} {row.leaderGap === 0 ? "en la punta" : `a ${row.leaderGap} del lider`}
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
              Anterior
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
              Siguiente
            </Button>
          </div>
        ) : null}
      </div>
      <div className="hidden overflow-x-auto rounded-[1.35rem] border border-border/70 bg-background/80 md:block">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Clasificacion completa de la quiniela</caption>
        <thead>
          <tr className="border-b border-border/70 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            <th className="px-4 py-3 text-left font-semibold" scope="col">Pos</th>
            <th className="px-4 py-3 text-left font-semibold" scope="col">Participante</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">Pts</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">Dif lider</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">Exactos</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">Aciertos</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">Precision</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">Racha</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">Mov</th>
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
              <td className="px-4 py-3 text-right">{formatStreak(row.currentStreak)}</td>
              <td className={cn("px-4 py-3 text-right font-semibold", row.rankDelta > 0 && "text-emerald-700", row.rankDelta < 0 && "text-red-600")}>{formatRankDelta(row.rankDelta)}</td>
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
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {awards.map((award) => (
        <article key={award.label} className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Award aria-hidden="true" className="size-4" />
            <p className="text-[0.7rem] font-bold tracking-[0.18em] uppercase">{award.label}</p>
          </div>
          <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em] text-foreground">{award.name}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{award.value}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{award.description}</p>
        </article>
      ))}
    </div>
  );
}

function StreakList({ rows }: { rows: DashboardAnalyticsRow[] }) {
  return (
    <div className="grid gap-3">
      {rows.slice(0, 6).map((row) => (
        <div key={row.name} className="grid gap-2 rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <div>
            <p className="font-semibold text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.nearMissCount} tragedias por un gol</p>
          </div>
          <div className="sm:text-right">
            <p className="font-display text-lg font-bold tracking-[-0.03em] text-foreground">{formatStreak(row.currentStreak)}</p>
            <p className="text-xs text-muted-foreground">mejor: {row.longestStreak}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConsensusGrid({ matches }: { matches: DashboardConsensusMatch[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {matches.slice(-6).reverse().map((match) => (
        <article key={match.matchId} className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
          <p className="text-[0.7rem] font-bold tracking-[0.18em] text-primary uppercase">{match.stageLabel}</p>
          <h3 className="mt-2 text-balance font-display text-lg font-bold tracking-[-0.03em] text-foreground sm:text-xl">
            {match.homeTeamName} vs {match.awayTeamName}
          </h3>
          <div className="mt-4 grid gap-2">
            <ConsensusBar label={match.homeTeamName} count={match.homeCount} total={match.totalCount} />
            <ConsensusBar label="Empate" count={match.drawCount} total={match.totalCount} />
            <ConsensusBar label={match.awayTeamName} count={match.awayCount} total={match.totalCount} />
          </div>
        </article>
      ))}
    </div>
  );
}

function ConsensusBar({ count, label, total }: { count: number; label: string; total: number }) {
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">{count} votos</span>
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

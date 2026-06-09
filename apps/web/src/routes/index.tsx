import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, CheckCircle2, Clock, ListOrdered, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { PinEntryForm } from "@/components/pin-entry-form";
import { translatePinResultMessage, useI18n } from "@/lib/i18n";
import { localizeStageLabel, localizeTeamName } from "@/lib/team-i18n";
import {
  getStoredPlayerSession,
  storePlayerSession,
  subscribeToPlayerSessionChanges,
  type StoredPlayerSession,
} from "@/lib/player-session";
import {
  derivePublicDashboardViewModel,
  paginatePublicDashboardMatches,
  type PublicDashboardMatch,
  type PublicDashboardStatCard,
} from "@/lib/public-dashboard";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const UPCOMING_MATCHES_PAGE_SIZE = 6;

function HomeComponent() {
  const { dateLocale, t } = useI18n();
  const navigate = useNavigate({ from: Route.fullPath });
  const publicMatches = useQuery(api.matches.getPublicDashboardMatches, {});
  const standings = useQuery(api.standings.getPublicStandings, {});
  const loginWithPin = useMutation(api.players.loginWithPin);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [storedSession, setStoredSession] = useState<StoredPlayerSession | null>(() => getStoredPlayerSession());
  const dashboard = derivePublicDashboardViewModel({
    labels: {
      leader: t.home.statLeader,
      leaderPoints: t.home.statLeaderPoints,
      today: t.home.today,
      finished: t.home.finished,
      undefined: t.common.undefined,
    },
    matches: publicMatches,
    standings,
  });
  const kickoffFormatter = new Intl.DateTimeFormat(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const upcomingMatchesPage = paginatePublicDashboardMatches(dashboard.upcomingMatches, {
    page: 1,
    pageSize: UPCOMING_MATCHES_PAGE_SIZE,
  });

  useEffect(() => {
    function refreshStoredSession() {
      setStoredSession(getStoredPlayerSession());
    }

    refreshStoredSession();
    const unsubscribeFromPlayerSessionChanges = subscribeToPlayerSessionChanges(refreshStoredSession);
    window.addEventListener("storage", refreshStoredSession);
    window.addEventListener("focus", refreshStoredSession);

    return () => {
      unsubscribeFromPlayerSessionChanges();
      window.removeEventListener("storage", refreshStoredSession);
      window.removeEventListener("focus", refreshStoredSession);
    };
  }, []);

  async function handlePinSubmit(pin: string) {
    setPinError(null);
    setIsSubmittingPin(true);

    try {
      const result = await loginWithPin({ pin });

      if (result.status === "ok") {
        storePlayerSession({
          sessionToken: result.sessionToken,
          displayName: result.player.displayName,
        });
        await navigate({ to: "/pronosticos", search: { match: undefined } });
        return;
      }

      if (result.status === "invalid_pin" || result.status === "locked") {
        setPinError(translatePinResultMessage(result.message, t));
      }
    } catch {
      setPinError(t.errors.validatePin);
    } finally {
      setIsSubmittingPin(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section id="pin-acceso" className="relative isolate overflow-hidden rounded-[1.5rem] bg-[#2A398D] text-white shadow-[0_30px_80px_-44px_rgba(42,57,141,0.72)] sm:rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(230,29,37,0.28),transparent_24%),radial-gradient(circle_at_86%_22%,rgba(60,172,59,0.18),transparent_20%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:30px_30px]" />
        <div className="relative z-10 grid min-w-0 gap-6 px-4 py-6 sm:gap-7 sm:px-7 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5">
            <span className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
              {t.home.heroEyebrow}
            </span>
            <div className="max-w-3xl">
              <h1 className="text-balance font-display text-4xl leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                {storedSession ? t.home.signedTitle : t.home.unsignedTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:mt-5 sm:text-lg sm:leading-7">
                {storedSession
                  ? t.home.signedDescription
                  : t.home.unsignedDescription}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label={t.home.today} value={String(dashboard.todayMatches.length)} />
              <HeroMetric label={t.home.upcoming} value={String(dashboard.upcomingMatches.length)} />
              <HeroMetric label={t.home.finished} value={String(dashboard.finishedMatches.length)} />
            </div>
          </div>

          {storedSession ? (
            <StoredPlayerAccessCard displayName={storedSession.displayName} />
          ) : (
            <PinEntryForm
              title={t.home.playerAccessTitle}
              description={t.home.playerAccessDescription}
              headingLevel="h2"
              isSubmitting={isSubmittingPin}
              error={pinError}
              submitLabel={t.home.enterMyMatches}
              onSubmit={handlePinSubmit}
            />
          )}
        </div>
      </section>

      {dashboard.state === "empty" ? <PublicDashboardEmpty /> : null}
      {dashboard.state === "ready" ? (
        <div className="grid gap-6">
          <PublicStats cards={dashboard.statCards} />
          <PublicStandings rows={dashboard.standings.slice(0, 3)} />
          <MatchGroup
            eyebrow={t.home.nextGroupEyebrow}
            title={t.home.nextGroupTitle}
            description={t.home.nextGroupDescription}
            matches={upcomingMatchesPage.matches.slice(0, 3)}
            emptyLabel={t.home.noUpcomingPublished}
            kickoffFormatter={kickoffFormatter}
            action={
              <Button className="rounded-[1rem]" render={<a href="/dashboard" />}>
                {t.home.fullDashboard}
              </Button>
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function StoredPlayerAccessCard({ displayName }: { displayName: string }) {
  const { t } = useI18n();

  return (
    <div className="min-w-0 rounded-[1.5rem] border border-white/80 bg-white/92 p-4 text-center shadow-[0_24px_58px_-36px_rgba(42,57,141,0.5)] backdrop-blur sm:rounded-[1.75rem] sm:p-6">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_-20px_rgba(230,29,37,0.9)]">
          <Trophy aria-hidden="true" className="size-5" />
        </div>
        <p className="text-[0.7rem] font-bold tracking-[0.22em] text-primary uppercase">{t.home.alreadyIn}</p>
        <h2 className="text-balance break-words font-display text-2xl font-extrabold leading-none tracking-[-0.04em] text-foreground sm:text-3xl">
          {displayName}
        </h2>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          {t.home.storedPlayerDescription}
        </p>
      </div>

      <div className="grid gap-3">
        <Button className="h-11 rounded-[1rem] border border-[#2A398D]/18 bg-[#2A398D]/10 text-[#1f2f78] shadow-[0_12px_24px_-20px_rgba(42,57,141,0.6)] ring-1 ring-[#2A398D]/18 hover:bg-[#2A398D]/14 hover:text-[#1f2f78]" render={<a href="/manual" />} variant="ghost">
          {t.pinEntry.learn}
        </Button>
        <Button
          className="h-12 w-full rounded-[1rem] border-b-4 border-[#93000e] bg-primary text-sm font-bold shadow-[0_10px_22px_rgba(189,0,21,0.24)]"
          render={<a href="/pronosticos" />}
        >
          {t.home.goToMyMatches}
        </Button>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/14 bg-white/10 px-4 py-3">
      <p className="text-[0.68rem] font-bold tracking-[0.2em] text-white/72 uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function PublicDashboardEmpty() {
  const { t } = useI18n();

  return (
    <AppSection
      id="tablero"
      eyebrow={t.home.emptyEyebrow}
      title={t.home.emptyTitle}
      description={t.home.emptyDescription}
      className="border-primary/15 bg-card/98"
    >
      <Button render={<a href="#pin-acceso" />} variant="outline">
        {t.home.goToPin}
      </Button>
    </AppSection>
  );
}

function PublicStats({ cards }: { cards: PublicDashboardStatCard[] }) {
  const icons = [Trophy, CheckCircle2, ListOrdered, CalendarDays] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de la quiniela">
      {cards.map((card, index) => {
        const Icon = icons[index] ?? Trophy;

        return (
          <article
            key={card.label}
            className="rounded-[1.5rem] border border-primary/12 bg-card/98 p-5 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.45)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">{card.label}</p>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
            </div>
            <p className="mt-4 truncate font-display text-3xl font-extrabold tracking-[-0.04em] text-foreground">
              {card.value}
            </p>
          </article>
        );
      })}
    </div>
  );
}

function PublicStandings({ rows }: { rows: ReturnType<typeof derivePublicDashboardViewModel>["standings"] }) {
  const { t } = useI18n();

  return (
    <AppSection
      eyebrow="Top 3"
      title={t.home.top3Title}
      description={t.home.top3Description}
      action={
        <Button className="rounded-[1rem]" render={<a href="/dashboard" />} variant="outline">
          {t.home.openDashboard}
        </Button>
      }
      className="border-primary/15 bg-card/98"
    >
      {rows.length > 0 ? (
        <>
          <div className="grid gap-3 sm:hidden">
            {rows.map((row) => (
              <article key={`${row.rank}-${row.name}`} className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-bold tracking-[0.16em] text-primary uppercase">#{row.rank}</p>
                  <p className="truncate font-semibold text-foreground">{row.name}</p>
                </div>
                <p className="font-display text-2xl font-extrabold tracking-[-0.04em] text-foreground">{row.points}</p>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-[1.35rem] border border-border/70 bg-background/80 sm:block">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t.home.standingsCaption}</caption>
            <thead>
              <tr className="border-b border-border/70 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-3 text-left font-semibold">{t.home.rank}</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">{t.home.participant}</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">{t.home.points}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.rank}-${row.name}`} className="border-b border-border/60 last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-display text-lg font-bold tracking-[-0.03em] text-foreground">
                    #{row.rank}
                  </th>
                  <td className="min-w-0 max-w-[18rem] break-words px-4 py-3 font-semibold text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-right font-display text-lg font-bold tracking-[-0.03em] text-foreground">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : (
        <p className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">
          {t.home.noActiveParticipants}
        </p>
      )}
    </AppSection>
  );
}

function MatchGroup({
  eyebrow,
  title,
  description,
  matches,
  emptyLabel,
  page,
  kickoffFormatter,
  onPreviousPage,
  onNextPage,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  matches: PublicDashboardMatch[];
  emptyLabel: string;
  kickoffFormatter: Intl.DateTimeFormat;
  page?: ReturnType<typeof paginatePublicDashboardMatches>;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  action?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <AppSection eyebrow={eyebrow} title={title} description={description} action={action} className="border-primary/15 bg-card/98">
      {matches.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.matchId} match={match} kickoffFormatter={kickoffFormatter} />
          ))}
        </div>
      ) : (
        <p className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      )}
      {page && page.totalCount > page.pageSize ? (
        <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/60 bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {t.home.showingMatches(page.matches.length, page.totalCount, page.page, page.pageCount)}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              disabled={!page.hasPreviousPage}
              className="rounded-[1rem]"
              onClick={onPreviousPage}
            >
              {t.home.previousMatches}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!page.hasNextPage}
              className="rounded-[1rem]"
              onClick={onNextPage}
            >
              {t.home.nextMatches}
            </Button>
          </div>
        </div>
      ) : null}
    </AppSection>
  );
}

function MatchCard({ kickoffFormatter, match }: { kickoffFormatter: Intl.DateTimeFormat; match: PublicDashboardMatch }) {
  const { locale, t } = useI18n();
  const isFinished = match.status === "finished";

  return (
    <article className="min-w-0 rounded-[1.35rem] border border-border/70 bg-background/86 px-4 py-4 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.42)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.2em] text-primary uppercase">{localizeStageLabel(match.stageLabel, locale)}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock aria-hidden="true" className="size-4" />
            {kickoffFormatter.format(match.kickoffAt)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase",
            match.status === "live" && "bg-accent/15 text-accent-foreground",
            match.status === "scheduled" && "bg-primary/10 text-primary",
            match.status === "finished" && "bg-emerald-500/10 text-emerald-700",
          )}
        >
          {match.status === "live" ? t.home.statusLive : null}
          {match.status === "scheduled" ? t.home.statusScheduled : null}
          {match.status === "finished" ? t.home.statusFinished : null}
        </span>
      </div>

      <div className="mt-4 rounded-[1.15rem] border border-border/60 bg-card/65 px-4 py-4">
        <TeamLine team={match.homeTeam} score={isFinished ? match.homeScore : undefined} />
        <div className="my-3 flex items-center justify-center">
          <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[0.72rem] font-bold tracking-[0.18em] text-primary uppercase">
            vs
          </span>
        </div>
        <TeamLine team={match.awayTeam} score={isFinished ? match.awayScore : undefined} />
      </div>
    </article>
  );
}

function TeamLine({
  team,
  score,
}: {
  team: PublicDashboardMatch["homeTeam"];
  score: number | undefined;
}) {
  const { locale } = useI18n();
  const teamName = localizeTeamName({ code: team.code, locale, name: team.name });

  return (
    <p className="flex min-w-0 items-center justify-between gap-3 text-sm">
      <span className="min-w-0 truncate font-medium text-foreground">
        {team.flagEmoji ? `${team.flagEmoji} ` : ""}
        {teamName}
      </span>
      <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
        <span>{team.code}</span>
        {score !== undefined ? (
          <span className="min-w-8 rounded-full bg-foreground px-2 py-1 text-center font-display text-sm font-bold text-background">
            {score}
          </span>
        ) : null}
      </span>
    </p>
  );
}

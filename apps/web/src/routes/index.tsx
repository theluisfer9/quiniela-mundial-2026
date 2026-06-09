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

const kickoffFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const UPCOMING_MATCHES_PAGE_SIZE = 6;

function HomeComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const publicMatches = useQuery(api.matches.getPublicDashboardMatches, {});
  const standings = useQuery(api.standings.getPublicStandings, {});
  const loginWithPin = useMutation(api.players.loginWithPin);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [storedSession, setStoredSession] = useState<StoredPlayerSession | null>(() => getStoredPlayerSession());
  const dashboard = derivePublicDashboardViewModel({ matches: publicMatches, standings });
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
        setPinError(result.message);
      }
    } catch {
      setPinError("No pudimos validar tu PIN. Intenta de nuevo.");
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
              Quiniela Mundial 2026
            </span>
            <div className="max-w-3xl">
              <h1 className="text-balance font-display text-4xl leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                {storedSession ? "Sigue tus partidos y la tabla familiar." : "Entra con tu PIN y sigue la tabla familiar."}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:mt-5 sm:text-lg sm:leading-7">
                {storedSession
                  ? "Entra a tus partidos o mira cómo va la tabla."
                  : "Revisa cómo va la quiniela, quién viene arriba y qué partidos siguen. Si ya vas a llenar marcadores, entra con tu PIN."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Hoy" value={String(dashboard.todayMatches.length)} />
              <HeroMetric label="Por jugar" value={String(dashboard.upcomingMatches.length)} />
              <HeroMetric label="Cerrados" value={String(dashboard.finishedMatches.length)} />
            </div>
          </div>

          {storedSession ? (
            <StoredPlayerAccessCard displayName={storedSession.displayName} />
          ) : (
            <PinEntryForm
              title="Acceso de jugador"
              description="Usa tu PIN para entrar a tus partidos y guardar marcadores."
              headingLevel="h2"
              isSubmitting={isSubmittingPin}
              error={pinError}
              submitLabel="Entrar a mis partidos"
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
            eyebrow="Siguiente"
            title="Próximos partidos"
            description="Los partidos que vienen para ir ubicando la siguiente tanda."
            matches={upcomingMatchesPage.matches.slice(0, 3)}
            emptyLabel="Aun no hay proximos partidos publicados."
            action={
              <Button className="rounded-[1rem]" render={<a href="/dashboard" />}>
                Ver tablero completo
              </Button>
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function StoredPlayerAccessCard({ displayName }: { displayName: string }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-white/80 bg-white/92 p-4 text-center shadow-[0_24px_58px_-36px_rgba(42,57,141,0.5)] backdrop-blur sm:rounded-[1.75rem] sm:p-6">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_-20px_rgba(230,29,37,0.9)]">
          <Trophy aria-hidden="true" className="size-5" />
        </div>
        <p className="text-[0.7rem] font-bold tracking-[0.22em] text-primary uppercase">Ya estás dentro</p>
        <h2 className="text-balance break-words font-display text-2xl font-extrabold leading-none tracking-[-0.04em] text-foreground sm:text-3xl">
          {displayName}
        </h2>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Entra directo a tus partidos para cargar o revisar tus marcadores.
        </p>
      </div>

      <div className="grid gap-3">
        <Button className="h-11 rounded-[1rem] border border-[#2A398D]/18 bg-[#2A398D]/10 text-[#1f2f78] shadow-[0_12px_24px_-20px_rgba(42,57,141,0.6)] ring-1 ring-[#2A398D]/18 hover:bg-[#2A398D]/14 hover:text-[#1f2f78]" render={<a href="/manual" />} variant="ghost">
          Aprende a jugar
        </Button>
        <Button
          className="h-12 w-full rounded-[1rem] border-b-4 border-[#93000e] bg-primary text-sm font-bold shadow-[0_10px_22px_rgba(189,0,21,0.24)]"
          render={<a href="/pronosticos" />}
        >
          Ir a mis partidos
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
  return (
    <AppSection
      id="tablero"
      eyebrow="Tablero"
      title="Aun no hay datos del torneo"
      description="Cuando se publiquen participantes o partidos, la tabla y el calendario apareceran aqui."
      className="border-primary/15 bg-card/98"
    >
      <Button render={<a href="#pin-acceso" />} variant="outline">
        Ir al acceso con PIN
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
  return (
    <AppSection
      eyebrow="Top 3"
      title="Así va la punta"
      description="Los primeros lugares de la quiniela hasta ahora."
      action={
        <Button className="rounded-[1rem]" render={<a href="/dashboard" />} variant="outline">
          Abrir tablero
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
            <caption className="sr-only">Tabla de participantes</caption>
            <thead>
              <tr className="border-b border-border/70 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-3 text-left font-semibold">Puesto</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Participante</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Puntos</th>
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
          La tabla aparecera cuando haya participantes activos.
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
  onPreviousPage,
  onNextPage,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  matches: PublicDashboardMatch[];
  emptyLabel: string;
  page?: ReturnType<typeof paginatePublicDashboardMatches>;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  action?: ReactNode;
}) {
  return (
    <AppSection eyebrow={eyebrow} title={title} description={description} action={action} className="border-primary/15 bg-card/98">
      {matches.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.matchId} match={match} />
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
            Mostrando {page.matches.length} de {page.totalCount} partidos · Pagina {page.page} de {page.pageCount}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              disabled={!page.hasPreviousPage}
              className="rounded-[1rem]"
              onClick={onPreviousPage}
            >
              Anteriores
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!page.hasNextPage}
              className="rounded-[1rem]"
              onClick={onNextPage}
            >
              Siguientes
            </Button>
          </div>
        </div>
      ) : null}
    </AppSection>
  );
}

function MatchCard({ match }: { match: PublicDashboardMatch }) {
  const isFinished = match.status === "finished";

  return (
    <article className="min-w-0 rounded-[1.35rem] border border-border/70 bg-background/86 px-4 py-4 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.42)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.2em] text-primary uppercase">{match.stageLabel}</p>
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
          {match.status === "live" ? "En vivo" : null}
          {match.status === "scheduled" ? "Programado" : null}
          {match.status === "finished" ? "Final" : null}
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
  return (
    <p className="flex min-w-0 items-center justify-between gap-3 text-sm">
      <span className="min-w-0 truncate font-medium text-foreground">
        {team.flagEmoji ? `${team.flagEmoji} ` : ""}
        {team.name}
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

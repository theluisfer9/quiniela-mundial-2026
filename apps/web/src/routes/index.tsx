import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, CheckCircle2, Clock, ListOrdered, Trophy } from "lucide-react";
import { useState } from "react";

import { PinEntryForm } from "@/components/pin-entry-form";
import { storePlayerSession } from "@/lib/player-session";
import {
  derivePublicDashboardViewModel,
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

function HomeComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const publicMatches = useQuery(api.matches.getPublicDashboardMatches, {});
  const standings = useQuery(api.standings.getPublicStandings, {});
  const loginWithPin = useMutation(api.players.loginWithPin);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const dashboard = derivePublicDashboardViewModel({ matches: publicMatches, standings });

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
      <section id="pin-acceso" className="relative isolate overflow-hidden rounded-[2rem] bg-[#2A398D] text-white shadow-[0_30px_80px_-44px_rgba(42,57,141,0.72)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(230,29,37,0.28),transparent_24%),radial-gradient(circle_at_86%_22%,rgba(60,172,59,0.18),transparent_20%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:30px_30px]" />
        <div className="relative z-10 grid gap-7 px-5 py-7 sm:px-7 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5">
            <span className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
              Quiniela Mundial 2026
            </span>
            <div className="max-w-3xl">
              <h1 className="text-balance font-display text-5xl leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                Entra con tu PIN y sigue la tabla familiar.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
                Consulta el estado publico del torneo sin iniciar sesion. Para cargar marcadores, usa el PIN que te compartieron.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Hoy" value={String(dashboard.todayMatches.length)} />
              <HeroMetric label="Por jugar" value={String(dashboard.upcomingMatches.length)} />
              <HeroMetric label="Cerrados" value={String(dashboard.finishedMatches.length)} />
            </div>
          </div>

          <PinEntryForm
            title="Acceso de jugador"
            description="Ingresa tu PIN para guardar pronosticos. La tabla publica no necesita sesion."
            headingLevel="h2"
            isSubmitting={isSubmittingPin}
            error={pinError}
            submitLabel="Entrar a pronosticos"
            onSubmit={handlePinSubmit}
          />
        </div>
      </section>

      {dashboard.state === "loading" ? <PublicDashboardLoading /> : null}
      {dashboard.state === "empty" ? <PublicDashboardEmpty /> : null}
      {dashboard.state === "ready" ? (
        <>
          <PublicStats cards={dashboard.statCards} />
          <PublicStandings rows={dashboard.standings} />
          <MatchGroup
            eyebrow="Hoy"
            title="Partidos de hoy"
            description="Marcadores visibles solo cuando el partido queda cerrado."
            matches={dashboard.todayMatches}
            emptyLabel="No hay partidos programados para hoy."
          />
          <MatchGroup
            eyebrow="Siguiente"
            title="Proximos partidos"
            description="No mostramos pronosticos futuros; solo horarios y equipos."
            matches={dashboard.upcomingMatches}
            emptyLabel="Aun no hay proximos partidos publicados."
          />
          <MatchGroup
            eyebrow="Historial"
            title="Partidos finalizados"
            description="Resultados cerrados que ya cuentan para la tabla."
            matches={dashboard.finishedMatches}
            emptyLabel="Todavia no hay partidos finalizados."
          />
        </>
      ) : null}
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

function PublicDashboardLoading() {
  return (
    <div className="grid gap-6" aria-label="Cargando tablero publico">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-card/80 ring-1 ring-border/70" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-[2rem] bg-card/80 ring-1 ring-border/70" />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[2rem] bg-card/80 ring-1 ring-border/70" />
        <div className="h-48 animate-pulse rounded-[2rem] bg-card/80 ring-1 ring-border/70" />
      </div>
    </div>
  );
}

function PublicDashboardEmpty() {
  return (
    <AppSection
      eyebrow="Tablero publico"
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen publico">
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
      eyebrow="Tabla publica"
      title="Asi va la quiniela"
      description="Posiciones calculadas solo con partidos finalizados. Nadie aparece marcado como usuario actual en esta vista publica."
      className="border-primary/15 bg-card/98"
    >
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-[1.35rem] border border-border/70 bg-background/80">
          <table className="min-w-[32rem] w-full border-collapse text-sm">
            <caption className="sr-only">Tabla publica de participantes</caption>
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
}: {
  eyebrow: string;
  title: string;
  description: string;
  matches: PublicDashboardMatch[];
  emptyLabel: string;
}) {
  return (
    <AppSection eyebrow={eyebrow} title={title} description={description} className="border-primary/15 bg-card/98">
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
    </AppSection>
  );
}

function MatchCard({ match }: { match: PublicDashboardMatch }) {
  const isFinished = match.status === "finished";

  return (
    <article className="rounded-[1.35rem] border border-border/70 bg-background/86 px-4 py-4 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.42)]">
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
    <p className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium text-foreground">
        {team.flagEmoji ? `${team.flagEmoji} ` : ""}
        {team.name}
      </span>
      <span className="flex items-center gap-3 text-muted-foreground">
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

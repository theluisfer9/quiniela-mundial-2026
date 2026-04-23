import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";

import { buildPredictionEntry, type HomeMatchSummary, type HomeMatchesData } from "@/lib/home-data";

type UpcomingMatchesProps = {
  matches: HomeMatchSummary[];
  nextKickoff: HomeMatchesData["nextKickoff"];
  pendingCount: number;
};

const kickoffFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function UpcomingMatches({ matches, nextKickoff, pendingCount }: UpcomingMatchesProps) {
  const visibleMatches = matches.slice(0, 4);

  return (
    <AppSection
      eyebrow="Proximos partidos"
      title="Lo que viene"
      description={
        pendingCount > 0
          ? `Todavia tienes ${pendingCount} partido${pendingCount === 1 ? "" : "s"} sin pronosticar.`
          : "Ya vas al dia. Aqui puedes revisar lo que viene antes del siguiente cierre."
      }
    >
      {nextKickoff ? (
        <div className="rounded-3xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">Siguiente cierre:</span> {kickoffFormatter.format(nextKickoff.kickoffAt)}
        </div>
      ) : null}
      <div id="proximos-partidos" className="grid gap-3 lg:grid-cols-2">
        {visibleMatches.map((match) => {
          const predictionEntry = buildPredictionEntry(match);

          return (
            <article key={match.matchId} className="rounded-3xl border border-border/70 bg-background/80 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-primary uppercase">{match.stageLabel}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{kickoffFormatter.format(match.kickoffAt)}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase",
                    match.hasPrediction ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/15 text-amber-800",
                  )}
                >
                  {match.hasPrediction ? "Listo" : "Pendiente"}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">
                    {match.homeTeam.flagEmoji ? `${match.homeTeam.flagEmoji} ` : ""}
                    {match.homeTeam.name}
                  </span>
                  <span className="text-muted-foreground">{match.homeTeam.code}</span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">
                    {match.awayTeam.flagEmoji ? `${match.awayTeam.flagEmoji} ` : ""}
                    {match.awayTeam.name}
                  </span>
                  <span className="text-muted-foreground">{match.awayTeam.code}</span>
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                  {match.hasPrediction ? "Tu carga ya existe. Puedes abrirla y ajustarla." : "Todavia no lo cargaste. Entra directo a pronosticar este partido."}
                </p>
                <Button size="sm" variant={match.hasPrediction ? "outline" : "default"} render={<a href={predictionEntry.href} />}>
                  {predictionEntry.label}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </AppSection>
  );
}

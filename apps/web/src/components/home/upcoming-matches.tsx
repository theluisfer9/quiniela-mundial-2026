import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";

import { buildPredictionEntry, type HomeViewModel } from "@/lib/home-data";

type UpcomingMatchesProps = {
  home: Pick<HomeViewModel, "upcomingMatches" | "nextKickoff" | "pendingCount">;
};

const kickoffFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function UpcomingMatches({ home }: UpcomingMatchesProps) {
  const visibleMatches = home.upcomingMatches.slice(0, 4);
  const sectionEntry = buildPredictionEntry();

  return (
    <AppSection
      eyebrow="Proximos partidos"
      title="Próximo cierre"
      description={
        home.pendingCount > 0
          ? `Tienes ${home.pendingCount} partido${home.pendingCount === 1 ? "" : "s"} sin pronóstico antes del cierre.`
          : "No tienes pendientes. Puedes revisar lo que viene y ajustar antes del cierre."
      }
      className="border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,240,239,0.98))]"
      action={
        <Button
          size="lg"
          className={cn(
            "h-11 rounded-[1rem] px-5 text-sm font-bold",
            home.pendingCount > 0
              ? "border-b-4 border-[#93000e] bg-primary text-white hover:bg-primary/92"
              : "border border-primary/15 bg-background/90 text-foreground hover:bg-background",
          )}
          variant={home.pendingCount > 0 ? "default" : "outline"}
          render={<a href={sectionEntry.href} />}
        >
          {home.pendingCount > 0 ? "Completar pronósticos" : "Ver pronósticos"}
        </Button>
      }
    >
      {home.nextKickoff ? (
        <div className="rounded-[1.25rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(42,57,141,0.08),rgba(230,29,37,0.08))] px-4 py-4 text-sm text-foreground">
          <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold tracking-[0.2em] text-primary uppercase">
            <span className="rounded-full bg-primary/10 px-3 py-1">Siguiente cierre</span>
            <span className="text-muted-foreground">{home.nextKickoff.matchCount} partido{home.nextKickoff.matchCount === 1 ? "" : "s"} en esa ventana</span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold tracking-[-0.03em] text-foreground">{kickoffFormatter.format(home.nextKickoff.kickoffAt)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {home.pendingCount > 0
              ? "Aún puedes cargar los marcadores pendientes."
              : "Tus marcadores están cargados para esta ventana."}
          </p>
        </div>
      ) : null}
      <div id="proximos-partidos" className="grid gap-3 lg:grid-cols-2">
        {visibleMatches.map((match) => {
          const predictionEntry = buildPredictionEntry(match);

          return (
            <article
              key={match.matchId}
              className={cn(
                "rounded-[1.35rem] border px-4 py-4 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.42)]",
                match.hasPrediction
                  ? "border-border/70 bg-background/90"
                  : "border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,243,244,0.98))]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-bold tracking-[0.2em] text-primary uppercase">{match.stageLabel}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{kickoffFormatter.format(match.kickoffAt)}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase",
                    match.hasPrediction ? "bg-emerald-500/10 text-emerald-700" : "bg-[#d72638]/10 text-[#b81f31]",
                  )}
                >
                  {match.hasPrediction ? "Listo" : "Pendiente"}
                </span>
              </div>
                <div className="mt-4 rounded-[1.15rem] border border-border/60 bg-background/70 px-4 py-4">
                <div className="grid gap-3 text-sm">
                  <p className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">
                      {match.homeTeam.flagEmoji ? `${match.homeTeam.flagEmoji} ` : ""}
                      {match.homeTeam.name}
                    </span>
                    <span className="text-muted-foreground">{match.homeTeam.code}</span>
                  </p>
                  <div className="flex items-center justify-center">
                    <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[0.72rem] font-bold tracking-[0.18em] text-primary uppercase">
                      vs
                    </span>
                  </div>
                  <p className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">
                      {match.awayTeam.flagEmoji ? `${match.awayTeam.flagEmoji} ` : ""}
                      {match.awayTeam.name}
                    </span>
                    <span className="text-muted-foreground">{match.awayTeam.code}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="max-w-[18rem] text-xs leading-5 text-muted-foreground">
                  {match.hasPrediction
                    ? "Marcador cargado. Puedes editarlo antes del cierre."
                    : "Partido abierto. Carga tu marcador antes del cierre."}
                </p>
                <Button
                  size="sm"
                  className={cn("rounded-[0.9rem]", match.hasPrediction ? "" : "border-b-4 border-[#93000e] bg-primary text-white hover:bg-primary/92")}
                  variant={match.hasPrediction ? "outline" : "default"}
                  render={<a href={predictionEntry.href} />}
                >
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

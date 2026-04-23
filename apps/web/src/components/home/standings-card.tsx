import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";

import type { HomeStandingsRow } from "@/lib/home-data";
import { getStandingsRowUi } from "@/lib/standings-ui";

type StandingsCardProps = {
  rows: HomeStandingsRow[];
};

export function StandingsCard({ rows }: StandingsCardProps) {
  return (
    <AppSection
      eyebrow="Tabla familiar"
      title="Asi va la quiniela"
      description="La tabla se actualiza con los puntos acumulados. Tu fila queda marcada para ubicarte rapido."
      className="border-primary/15 bg-card/98"
    >
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/80">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Tabla general de la quiniela familiar</caption>
          <thead>
            <tr className="border-b border-border/70 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Puesto</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Participante</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Mov.</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Puntos</th>
            </tr>
          </thead>
          <tbody>
          {rows.map((row) => {
            const ui = getStandingsRowUi(row);

            return (
              <tr
                key={`${row.rank}-${row.name}`}
                className={cn(
                  "border-b border-border/60 last:border-b-0",
                  ui.isCurrentUser && "bg-primary/10 ring-1 ring-inset ring-primary/25",
                )}
              >
                <th scope="row" className="px-4 py-4 text-left text-2xl font-semibold tracking-tight text-foreground">#{row.rank}</th>
                <td className="min-w-0 px-4 py-4 align-middle">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-foreground">{row.name}</p>
                    {ui.currentUserLabel ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-semibold tracking-[0.12em] text-primary-foreground uppercase">
                        {ui.currentUserLabel}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium",
                    ui.movement.direction === "up" && "bg-emerald-500/10 text-emerald-700",
                    ui.movement.direction === "down" && "bg-rose-500/10 text-rose-700",
                    ui.movement.direction === "steady" && "bg-muted text-muted-foreground",
                  )}
                  aria-label={ui.movement.longLabel}
                  title={ui.movement.longLabel}
                >
                  <span aria-hidden="true">{ui.movement.icon}</span> {ui.movement.shortLabel}
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-lg font-semibold tracking-tight text-foreground align-middle">{row.points}</td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </AppSection>
  );
}

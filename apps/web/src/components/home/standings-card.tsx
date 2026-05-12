import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";

import type { HomeStandingsRow } from "@/lib/home-data";
import { getStandingsRowUi } from "@/lib/standings-ui";

type StandingsCardProps = {
  rows: HomeStandingsRow[];
};

export function StandingsCard({ rows }: StandingsCardProps) {
  const entries = rows.map((row) => ({
    row,
    ui: getStandingsRowUi(row),
  }));
  const topEntries = entries.filter(({ ui }) => ui.topRank.isTopThree);
  const restEntries = entries.filter(({ ui }) => !ui.topRank.isTopThree);

  return (
    <AppSection
      eyebrow="Tabla familiar"
      title="Asi va la quiniela"
      description="El podio resalta a quienes van arriba y tu posicion sigue marcada para ubicarte rapido."
      className="border-primary/15 bg-card/98"
    >
      <div className="space-y-4">
        {topEntries.length > 0 ? (
          <div aria-labelledby="standings-podium-title" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 id="standings-podium-title" className="text-sm font-semibold tracking-tight text-foreground">
                Podio actual
              </h3>
              <p className="text-xs text-muted-foreground">Top 3 con destaque especial</p>
            </div>

            <ol className="grid gap-3 md:grid-cols-3 md:items-end">
              {topEntries.map(({ row, ui }) => (
                <li
                  key={`${row.rank}-${row.name}`}
                  className={cn(
                    "rounded-3xl border px-4 py-4 shadow-sm",
                    ui.topRank.tier === 1 && "md:min-h-56 border-amber-400/50 bg-amber-500/10",
                    ui.topRank.tier === 2 && "border-slate-300/70 bg-slate-500/5",
                    ui.topRank.tier === 3 && "border-orange-300/70 bg-orange-500/5",
                    ui.isCurrentUser && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                  )}
                >
                  <article aria-label={`${ui.topRank.label}: ${row.name}, ${row.points} puntos, ${ui.movement.longLabel.toLowerCase()}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                          {ui.topRank.label}
                        </p>
                        <p className="mt-2 text-balance text-xl font-semibold tracking-tight text-foreground">
                          {row.name}
                        </p>
                      </div>
                      <span className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-sm font-semibold text-foreground">
                        #{row.rank}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                          Puntos
                        </p>
                        <p className="text-4xl font-semibold tracking-tight text-foreground">{row.points}</p>
                      </div>
                      <div
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          ui.movement.direction === "up" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                          ui.movement.direction === "down" && "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300",
                          ui.movement.direction === "steady" && "border-border/70 bg-muted text-muted-foreground",
                        )}
                        aria-label={ui.movement.longLabel}
                        title={ui.movement.longLabel}
                      >
                        <span aria-hidden="true">{ui.movement.icon}</span>
                        <span className="ml-1">{ui.movement.shortLabel}</span>
                      </div>
                    </div>

                    {ui.currentUserLabel ? (
                      <p className="mt-4 inline-flex rounded-full bg-primary px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.14em] text-primary-foreground uppercase">
                        {ui.currentUserLabel}
                      </p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {restEntries.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/80">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Resto de participantes en la tabla general</caption>
              <thead>
                <tr className="border-b border-border/70 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Puesto</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Participante</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Mov.</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {restEntries.map(({ row, ui }) => (
                  <tr
                    key={`${row.rank}-${row.name}`}
                    className={cn(
                      "border-b border-border/60 last:border-b-0",
                      ui.isCurrentUser && "bg-primary/10 ring-1 ring-inset ring-primary/25",
                    )}
                  >
                    <th scope="row" className="px-4 py-3 text-left text-base font-semibold tracking-tight text-foreground">
                      #{row.rank}
                    </th>
                    <td className="min-w-0 px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{row.name}</p>
                        {ui.currentUserLabel ? (
                          <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.12em] text-primary uppercase">
                            {ui.currentUserLabel}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[0.72rem] font-medium",
                          ui.movement.direction === "up" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                          ui.movement.direction === "down" && "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300",
                          ui.movement.direction === "steady" && "border-border/70 bg-muted text-muted-foreground",
                        )}
                        aria-label={ui.movement.longLabel}
                        title={ui.movement.longLabel}
                      >
                        <span aria-hidden="true">{ui.movement.icon}</span>
                        <span className="ml-1">{ui.movement.shortLabel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold tracking-tight text-foreground align-middle">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AppSection>
  );
}

import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";

import type { HomeStandingsRow } from "@/lib/home-data";
import { getStandingsRowUi } from "@/lib/standings-ui";

type StandingsCardProps = {
  rows: HomeStandingsRow[];
};

const avatarEmojis = ["😎", "🧔🏻‍♂️", "👩🏻", "🧑🏽", "👨🏻‍🦱", "👩🏽‍🦱", "🧑🏻‍🦰", "👴🏼"] as const;

export function StandingsCard({ rows }: StandingsCardProps) {
  const entries = rows.map((row) => ({
    row,
    ui: getStandingsRowUi(row),
  }));
  const topEntries = entries.filter(({ ui }) => ui.topRank.isTopThree);
  const restEntries = entries.filter(({ ui }) => !ui.topRank.isTopThree);

  return (
    <AppSection
      eyebrow="Tabla"
      title="Así va la quiniela"
      description="Posiciones, puntos y movimientos del grupo."
      className="border-primary/15 bg-card/98"
    >
      <div className="flex flex-col gap-4">
        {topEntries.length > 0 ? (
          <div aria-labelledby="standings-podium-title" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 id="standings-podium-title" className="text-sm font-semibold tracking-tight text-foreground">
                Top 3
              </h3>
              <p className="text-xs text-muted-foreground">Los primeros lugares de la tabla</p>
            </div>

            <ol className="grid gap-3 md:grid-cols-3 md:items-end">
              {topEntries.map(({ row, ui }) => (
                <li
                  key={`${row.rank}-${row.name}`}
                  className={cn(
                    "rounded-[1.35rem] border px-4 py-4 shadow-[0_12px_28px_-22px_rgba(42,57,141,0.35)]",
                    ui.topRank.tier === 1 && "md:min-h-56 border-primary/25 bg-primary/10 md:-translate-y-3",
                    ui.topRank.tier === 2 && "border-secondary/60 bg-secondary/20",
                    ui.topRank.tier === 3 && "border-accent/20 bg-accent/10",
                    ui.isCurrentUser && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                  )}
                >
                  <article aria-label={`${ui.topRank.label}: ${row.name}, ${row.points} puntos, ${ui.movement.longLabel.toLowerCase()}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                          {ui.topRank.label}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <PlayerAvatar name={row.name} rank={row.rank} isCurrentUser={ui.isCurrentUser} />
                          <p className="text-balance font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
                            {row.name}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-sm font-bold text-foreground">
                        #{row.rank}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                          Puntos
                        </p>
                        <p className="font-display text-5xl font-extrabold tracking-[-0.05em] text-foreground">{row.points}</p>
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
          <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-background/80">
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
                    <th scope="row" className="px-4 py-3 text-left font-display text-lg font-bold tracking-[-0.03em] text-foreground">
                      #{row.rank}
                    </th>
                    <td className="min-w-0 px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlayerAvatar name={row.name} rank={row.rank} isCurrentUser={ui.isCurrentUser} size="sm" />
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
                    <td className="px-4 py-3 text-right font-display text-lg font-bold tracking-[-0.03em] text-foreground align-middle">
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

function PlayerAvatar({
  name,
  rank,
  isCurrentUser,
  size = "md",
}: {
  name: string;
  rank: number;
  isCurrentUser: boolean;
  size?: "sm" | "md";
}) {
  const emoji = isCurrentUser ? "😎" : avatarEmojis[(rank - 1) % avatarEmojis.length];

  return (
    <span
      aria-label={`Avatar de ${name}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#fff8f7,#dee0ff)] shadow-[0_8px_18px_-12px_rgba(42,57,141,0.55)]",
        size === "sm" ? "size-9" : "size-12",
      )}
      role="img"
    >
      <span className={cn(size === "sm" ? "text-xl" : "text-2xl")}>{emoji}</span>
    </span>
  );
}

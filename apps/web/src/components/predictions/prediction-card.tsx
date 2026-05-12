import { Card, CardContent, CardFooter, CardHeader } from "@quiniela-mundial-2026/ui/components/card";
import { ScoreInput } from "@quiniela-mundial-2026/ui/components/score-input";
import { useEffect, useState } from "react";

import type { HomeMatchSummary } from "@/lib/home-data";
import {
  getPredictionDisplayState,
  getPredictionInputHint,
  getPredictionStatusLabel,
  type PredictionSaveState,
} from "@/lib/prediction-copy";
import { getPrivacyRevealCopy } from "@/lib/privacy-copy";

type PredictionCardProps = {
  match: HomeMatchSummary;
  status: PredictionSaveState;
  savedScore: {
    homeScore: number | null;
    awayScore: number | null;
  };
  isLocked: boolean;
  isSaving: boolean;
  onDirty: () => void;
  onSave: (scores: { homeScore: number; awayScore: number }) => void;
};

const kickoffFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function PredictionCard({ match, status, savedScore, isLocked, isSaving, onDirty, onSave }: PredictionCardProps) {
  const [homeScore, setHomeScore] = useState(savedScore.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(savedScore.awayScore?.toString() ?? "");
  const isReadOnly = isLocked || isSaving;
  const displayState = getPredictionDisplayState({
    draftScore: {
      homeScore: parseScore(homeScore),
      awayScore: parseScore(awayScore),
    },
    isLocked,
    savedScore,
    status,
  });
  const stateTheme = getStateTheme(displayState);

  useEffect(() => {
    setHomeScore(savedScore.homeScore?.toString() ?? "");
    setAwayScore(savedScore.awayScore?.toString() ?? "");
  }, [savedScore.awayScore, savedScore.homeScore, match.matchId]);

  function commitIfComplete() {
    if (isReadOnly) {
      return;
    }

    const nextHomeScore = parseScore(homeScore);
    const nextAwayScore = parseScore(awayScore);
    if (nextHomeScore === null || nextAwayScore === null) {
      return;
    }

    if (nextHomeScore === savedScore.homeScore && nextAwayScore === savedScore.awayScore) {
      return;
    }

    onSave({ homeScore: nextHomeScore, awayScore: nextAwayScore });
  }

  function handleHomeScoreChange(value: string) {
    if (isReadOnly) {
      return;
    }

    setHomeScore(value);
    onDirty();
  }

  function handleAwayScoreChange(value: string) {
    if (isReadOnly) {
      return;
    }

    setAwayScore(value);
    onDirty();
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 py-0 ring-0">
      <CardHeader className="gap-4 px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">{match.stageLabel}</p>
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">Tu marcador del partido</h3>
              <p className="text-sm leading-6 text-muted-foreground">Cierre: {kickoffFormatter.format(match.kickoffAt)}</p>
            </div>
          </div>
          <div className={stateTheme.badgeClassName}>
            <span className="h-2.5 w-2.5 rounded-full bg-current/80" />
            <span>{getPredictionStatusLabel(displayState)}</span>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-border/70 bg-muted/[0.38] p-4 sm:p-5">
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <TeamBlock side="local" team={match.homeTeam} />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-background text-sm font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              vs
            </div>
            <TeamBlock side="visita" team={match.awayTeam} align="end" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.8rem] border border-border/70 bg-background/80 p-4 shadow-[0_18px_40px_-32px_color-mix(in_oklab,var(--color-foreground)_20%,transparent)]">
            <ScoreInput
              aria-label={`Goles de ${match.homeTeam.name}`}
              disabled={isReadOnly}
              hint={getPredictionInputHint({ side: "home", state: displayState })}
              label="Goles local"
              placeholder="0"
              value={homeScore}
              onBlur={commitIfComplete}
              onChange={(event) => handleHomeScoreChange(event.target.value)}
            />
          </div>

          <div className="rounded-[1.8rem] border border-border/70 bg-background/80 p-4 shadow-[0_18px_40px_-32px_color-mix(in_oklab,var(--color-foreground)_20%,transparent)]">
            <ScoreInput
              aria-label={`Goles de ${match.awayTeam.name}`}
              disabled={isReadOnly}
              hint={getPredictionInputHint({ side: "away", state: displayState })}
              label="Goles visita"
              placeholder="0"
              value={awayScore}
              onBlur={commitIfComplete}
              onChange={(event) => handleAwayScoreChange(event.target.value)}
            />
          </div>
        </div>

        <div className={stateTheme.panelClassName}>
          <p aria-live="polite" className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {getPredictionStatusLabel(displayState)}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isLocked
              ? getPrivacyRevealCopy({ isLocked: true })
              : isSaving
                ? "Estamos guardando este marcador. Espera un momento antes de volver a editar."
                : getPrivacyRevealCopy({ isLocked: false })}
          </p>
        </div>
      </CardContent>

      <CardFooter className="border-border/70 px-5 py-4 sm:px-6">
        <p className="text-xs leading-5 text-muted-foreground">
          {isLocked
            ? "Cuando arranca el partido, el pronostico pasa a modo lectura. No es un error: simplemente ya no se puede editar desde aqui."
            : isSaving
              ? "Guardado en curso: bloqueamos la pieza un momento para evitar cambios cruzados mientras llega la respuesta."
              : "Tus picks siguen privados hasta que empiece este partido. Esta pantalla muestra solo tus pronosticos."}
        </p>
      </CardFooter>
    </Card>
  );
}

function TeamBlock({
  side,
  team,
  align = "start",
}: {
  side: "local" | "visita";
  team: HomeMatchSummary["homeTeam"];
  align?: "start" | "end";
}) {
  return (
    <div className="flex items-center gap-4 rounded-[1.5rem] bg-background/80 px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-background)_72%,white)]">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/45 text-3xl leading-none">
        {team.flagEmoji ?? "-"}
      </div>
      <div className={align === "end" ? "min-w-0 text-left sm:text-right" : "min-w-0 text-left"}>
        <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{side}</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{team.name}</p>
        <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">{team.code}</p>
      </div>
    </div>
  );
}

function getStateTheme(state: PredictionSaveState) {
  switch (state) {
    case "saved":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.12] px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-emerald-700 uppercase",
        panelClassName: "rounded-[1.5rem] border border-emerald-500/25 bg-emerald-500/[0.10] px-4 py-3",
      };
    case "saving":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase",
        panelClassName: "rounded-[1.5rem] border border-primary/20 bg-primary/[0.08] px-4 py-3",
      };
    case "error":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-destructive uppercase",
        panelClassName: "rounded-[1.5rem] border border-destructive/25 bg-destructive/10 px-4 py-3",
      };
    case "locked":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/[0.55] px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase",
        panelClassName: "rounded-[1.5rem] border border-border/70 bg-muted/[0.35] px-4 py-3",
      };
    default:
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase",
        panelClassName: "rounded-[1.5rem] border border-primary/15 bg-primary/[0.06] px-4 py-3",
      };
  }
}

function parseScore(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

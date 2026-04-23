import { Card, CardContent, CardFooter, CardHeader } from "@quiniela-mundial-2026/ui/components/card";
import { ScoreInput } from "@quiniela-mundial-2026/ui/components/score-input";
import { useEffect, useState } from "react";

import type { HomeMatchSummary } from "@/lib/home-data";
import { getPredictionStatusLabel, type PredictionSaveState } from "@/lib/prediction-copy";
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
    <Card className="rounded-[2rem] border border-border/80 bg-card/95 py-0 ring-0">
      <CardHeader className="gap-3 px-5 pt-5 pb-0">
        <div className="space-y-2">
          <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">{match.stageLabel}</p>
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Marca tu resultado</h3>
            <p className="text-sm leading-6 text-muted-foreground">Cierre: {kickoffFormatter.format(match.kickoffAt)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 py-5">
        <div className="grid gap-3">
          <TeamBlock side="local" team={match.homeTeam} />
            <ScoreInput
              aria-label={`Goles de ${match.homeTeam.name}`}
              disabled={isReadOnly}
              hint={isLocked ? "Cerrado" : isSaving ? "Guardando..." : "Toca fuera del numero para guardar este partido."}
              label={match.homeTeam.name}
            placeholder="0"
            value={homeScore}
            onBlur={commitIfComplete}
            onChange={(event) => handleHomeScoreChange(event.target.value)}
          />
        </div>

        <div className="grid gap-3">
          <TeamBlock side="visita" team={match.awayTeam} />
            <ScoreInput
              aria-label={`Goles de ${match.awayTeam.name}`}
              disabled={isReadOnly}
              hint={
                isLocked ? "Cerrado" : isSaving ? "Guardando..." : "Cuando completes ambos marcadores se guarda automaticamente."
              }
              label={match.awayTeam.name}
            placeholder="0"
            value={awayScore}
            onBlur={commitIfComplete}
            onChange={(event) => handleAwayScoreChange(event.target.value)}
          />
        </div>

        <div className="rounded-[1.5rem] border border-border/70 bg-muted/35 px-4 py-3">
          <p aria-live="polite" className="text-sm font-semibold tracking-tight text-foreground">
            {getPredictionStatusLabel(isLocked ? "locked" : status)}
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

      <CardFooter className="border-border/70 px-5 py-4">
        <p className="text-xs leading-5 text-muted-foreground">
          {isLocked
            ? "Cuando arranca el partido, el pronostico se cierra y esta pantalla deja de ser editable."
            : isSaving
              ? "Guardado en curso: bloqueamos esta tarjeta para evitar cambios cruzados mientras llega la respuesta."
              : "Tus picks siguen privados hasta que empiece este partido. Esta pantalla muestra solo tus pronosticos."}
        </p>
      </CardFooter>
    </Card>
  );
}

function TeamBlock({ side, team }: { side: "local" | "visita"; team: HomeMatchSummary["homeTeam"] }) {
  return (
    <div className="flex items-center justify-between rounded-[1.5rem] bg-muted/45 px-4 py-3">
      <div>
        <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{side}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{team.name}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl leading-none">{team.flagEmoji ?? "-"}</p>
        <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">{team.code}</p>
      </div>
    </div>
  );
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

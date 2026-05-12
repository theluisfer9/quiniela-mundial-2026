import { Button } from "@quiniela-mundial-2026/ui/components/button";

import { getPrivacyRevealCopy } from "@/lib/privacy-copy";

type PredictionProgressProps = {
  currentIndex: number;
  totalCount: number;
  remainingCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isLocked: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PredictionProgress({
  currentIndex,
  totalCount,
  remainingCount,
  hasPrevious,
  hasNext,
  isLocked,
  onPrevious,
  onNext,
}: PredictionProgressProps) {
  const completedCount = totalCount - remainingCount;
  const progressValue = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  const progressLabelId = "prediction-progress-label";
  const progressValueText = `${completedCount} de ${totalCount} partidos listos`;

  return (
    <div className="space-y-4 rounded-[2rem] border border-border/80 bg-card/95 p-4 shadow-[0_24px_60px_-40px_color-mix(in_oklab,var(--color-foreground)_18%,transparent)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-primary uppercase">Ritmo de picks</p>
          <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Partido {currentIndex + 1} de {totalCount}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {remainingCount === 0
              ? "Ya dejaste cargados todos los partidos abiertos."
              : `${remainingCount} pendientes antes de sus cierres.`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button className="rounded-full px-4" disabled={!hasPrevious} onClick={onPrevious} size="lg" variant="outline">
            Anterior
          </Button>
          <Button className="rounded-full px-4" disabled={!hasNext} onClick={onNext} size="lg" variant="outline">
            Siguiente
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-muted/30 p-3 sm:p-4">
        <p id={progressLabelId} className="sr-only">
          Progreso de pronosticos: {progressValueText}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          <span>{completedCount} listos</span>
          <span>{remainingCount} en juego</span>
        </div>
        <div
          aria-labelledby={progressLabelId}
          aria-valuemax={totalCount}
          aria-valuemin={0}
          aria-valuenow={completedCount}
          aria-valuetext={progressValueText}
          className="h-3 overflow-hidden rounded-full bg-background"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.min(progressValue, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm font-medium tracking-tight text-foreground">
          <span>Vas ahora por {currentIndex + 1}/{totalCount}</span>
          <span>{Math.round(Math.min(progressValue, 100))}%</span>
        </div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {isLocked
          ? getPrivacyRevealCopy({ isLocked: true })
          : getPrivacyRevealCopy({ isLocked: false })}
      </p>
    </div>
  );
}

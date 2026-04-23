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
  return (
    <div className="space-y-3 rounded-[2rem] border border-border/80 bg-muted/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-primary uppercase">Progreso</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Partido {currentIndex + 1} de {totalCount}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {remainingCount} por cargar antes de su cierre.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button disabled={!hasPrevious} onClick={onPrevious} size="sm" variant="outline">
            Anterior
          </Button>
          <Button disabled={!hasNext} onClick={onNext} size="sm" variant="outline">
            Siguiente
          </Button>
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

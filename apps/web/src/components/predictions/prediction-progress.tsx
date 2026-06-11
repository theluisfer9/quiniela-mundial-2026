import { Button } from "@quiniela-mundial-2026/ui/components/button";

import { useI18n } from "@/lib/i18n";

type PredictionProgressProps = {
  currentIndex: number;
  totalCount: number;
  nextBatchPendingCount: number;
  nextBatchTotalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PredictionProgress({
  currentIndex,
  totalCount,
  nextBatchPendingCount,
  nextBatchTotalCount,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PredictionProgressProps) {
  const { t } = useI18n();
  const nextBatchReadyCount = nextBatchTotalCount - nextBatchPendingCount;
  const progressValue = nextBatchTotalCount === 0 ? 0 : (nextBatchReadyCount / nextBatchTotalCount) * 100;
  const progressLabelId = "prediction-progress-label";
  const progressValueText = t.progress.ariaValue(nextBatchReadyCount, nextBatchTotalCount);

  return (
    <div className="hidden flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-card/95 p-4 shadow-[0_18px_44px_-32px_rgba(42,57,141,0.38)] sm:flex sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[0.7rem] font-bold tracking-[0.2em] text-primary uppercase">{t.progress.nextDate}</p>
          <p className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl">
            {t.progress.matchPosition(currentIndex + 1, totalCount)}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {nextBatchPendingCount === 0
              ? t.progress.complete
              : t.progress.missing(nextBatchPendingCount, nextBatchTotalCount)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button className="rounded-[1rem] px-4" disabled={!hasPrevious} onClick={onPrevious} size="lg" variant="outline">
            {t.common.previous}
          </Button>
          <Button className="rounded-[1rem] px-4" disabled={!hasNext} onClick={onNext} size="lg" variant="outline">
            {t.common.next}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-muted/35 p-3 sm:p-4">
        <p id={progressLabelId} className="sr-only">
          {t.progress.ariaLabel(progressValueText)}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          <span>{t.progress.ready(nextBatchReadyCount)}</span>
          <span>{t.progress.pending(nextBatchPendingCount)}</span>
        </div>
        <div
          aria-labelledby={progressLabelId}
          aria-valuemax={nextBatchTotalCount}
          aria-valuemin={0}
          aria-valuenow={nextBatchReadyCount}
          aria-valuetext={progressValueText}
          className="h-3 overflow-hidden rounded-full bg-background"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.min(progressValue, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm font-medium tracking-tight text-foreground">
          <span>{t.progress.nextBatch}</span>
          <span>{Math.round(Math.min(progressValue, 100))}%</span>
        </div>
      </div>
    </div>
  );
}

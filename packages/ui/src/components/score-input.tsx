import { Input } from "@quiniela-mundial-2026/ui/components/input";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import * as React from "react";

type ScoreInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
};

function ScoreInput({
  className,
  hint,
  id: idProp,
  label,
  "aria-describedby": ariaDescribedBy,
  ...props
}: ScoreInputProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [ariaDescribedBy, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="flex min-w-0 flex-col items-center gap-2 text-center sm:gap-3" htmlFor={id}>
      <span className="max-w-full truncate text-[0.65rem] font-bold tracking-[0.12em] text-foreground uppercase sm:text-[0.72rem] sm:tracking-[0.16em]">{label}</span>
      <Input
        id={id}
        aria-describedby={describedBy}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className={cn(
          "h-20 rounded-[1rem] border-border/80 bg-white px-0 text-center font-display !text-5xl font-extrabold tracking-[-0.06em] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_14px_34px_-28px_rgba(42,57,141,0.38)] [appearance:textfield] placeholder:text-muted-foreground/45 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/30 disabled:bg-muted/70 sm:h-28 sm:!text-7xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        )}
        {...props}
      />
      {hint ? (
          <span id={hintId} className="hidden max-w-full text-center text-[0.72rem] leading-5 text-muted-foreground sm:inline">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export { ScoreInput };

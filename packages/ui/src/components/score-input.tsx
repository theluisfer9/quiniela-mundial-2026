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
    <label className="flex min-w-0 flex-col items-center gap-3 text-center" htmlFor={id}>
      <span className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</span>
      <Input
        id={id}
        aria-describedby={describedBy}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className={cn(
          "h-20 rounded-[1.75rem] border-border/80 bg-background/95 px-0 text-center text-4xl font-black tracking-[-0.04em] text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-background)_75%,white),0_18px_40px_-28px_color-mix(in_oklab,var(--color-foreground)_16%,transparent)] [appearance:textfield] placeholder:text-muted-foreground/45 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/70 disabled:bg-muted/70 sm:h-24 sm:text-5xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        )}
        {...props}
      />
      {hint ? (
        <span id={hintId} className="max-w-full text-center text-[0.72rem] leading-5 text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export { ScoreInput };

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
    <label className="flex min-w-0 flex-col gap-2.5" htmlFor={id}>
      <span className="text-sm font-semibold tracking-tight text-foreground">{label}</span>
      <Input
        id={id}
        aria-describedby={describedBy}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className={cn(
          "h-16 rounded-3xl border-border bg-background text-center text-3xl font-semibold tracking-tight text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-background)_80%,white)] [appearance:textfield] placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/70 disabled:bg-muted/70 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:h-18 sm:text-4xl",
          className,
        )}
        {...props}
      />
      {hint ? (
        <span id={hintId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export { ScoreInput };

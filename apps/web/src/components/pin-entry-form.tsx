import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Input } from "@quiniela-mundial-2026/ui/components/input";
import { Label } from "@quiniela-mundial-2026/ui/components/label";
import { Link } from "@tanstack/react-router";
import { ArrowRight, KeyRound } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { isPinEntrySubmittable, normalizePlayerPin } from "@/lib/pin-entry";

type PinEntryFormProps = {
  title?: string;
  description?: string;
  headingLevel?: "h1" | "h2" | "h3";
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (pin: string) => void;
};

function formatPinInput(pin: string) {
  return normalizePlayerPin(pin).replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

function PinEntryForm({
  title,
  description,
  headingLevel = "h2",
  isSubmitting = false,
  error = null,
  submitLabel,
  onSubmit,
}: PinEntryFormProps) {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const inputId = useId();
  const errorId = useId();
  const normalizedPin = normalizePlayerPin(pin);
  const canSubmit = isPinEntrySubmittable(normalizedPin) && !isSubmitting;
  const Heading = headingLevel;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isPinEntrySubmittable(normalizedPin)) {
      return;
    }

    onSubmit(normalizedPin);
  }

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white/92 p-5 shadow-[0_24px_58px_-36px_rgba(42,57,141,0.5)] backdrop-blur sm:p-6">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_-20px_rgba(230,29,37,0.9)]">
          <KeyRound aria-hidden="true" className="size-5" />
        </div>
        <p className="text-[0.7rem] font-bold tracking-[0.22em] text-primary uppercase">{t.pinEntry.eyebrow}</p>
        <Heading className="text-balance font-display text-3xl font-extrabold leading-none tracking-[-0.04em] text-foreground">
          {title ?? t.pinEntry.defaultTitle}
        </Heading>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description ?? t.pinEntry.defaultDescription}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[1.35rem] border border-border/60 bg-background/70 p-4 sm:p-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId} className="text-foreground">{t.common.pin}</Label>
          <Input
            id={inputId}
            name="pin"
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            spellCheck={false}
            placeholder="AB12"
            value={pin}
            onChange={(event) => setPin(formatPinInput(event.target.value))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-12 rounded-[1rem] border-border/70 bg-white text-center font-mono text-lg font-bold tracking-[0.35em] text-foreground uppercase placeholder:text-muted-foreground/65"
          />
          {error ? (
            <p id={errorId} role="alert" className="text-sm font-medium text-red-500">
              {error}
            </p>
          ) : null}
        </div>

        <Button
          className="h-11 rounded-[1rem] border-[#2A398D]/18 bg-[#2A398D]/10 text-[#1f2f78] shadow-[0_12px_24px_-20px_rgba(42,57,141,0.6)] ring-1 ring-[#2A398D]/18 hover:bg-[#2A398D]/14 hover:text-[#1f2f78]"
          render={<Link to="/manual" />}
          type="button"
          variant="outline"
        >
          {t.pinEntry.learn}
        </Button>

        <Button
          type="submit"
          className="h-12 w-full rounded-[1rem] border-b-4 border-[#93000e] bg-primary text-sm font-bold shadow-[0_10px_22px_rgba(189,0,21,0.24)]"
          disabled={!canSubmit}
        >
          {isSubmitting ? t.pinEntry.submitting : submitLabel ?? t.pinEntry.defaultSubmit}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export { PinEntryForm, type PinEntryFormProps };

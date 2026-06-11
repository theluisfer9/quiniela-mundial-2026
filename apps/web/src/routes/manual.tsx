import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Save, Trophy } from "lucide-react";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/manual")({
  component: RouteComponent,
});

const steps = [
  {
    icon: KeyRound,
  },
  {
    icon: Trophy,
  },
  {
    icon: Save,
  },
  {
    icon: CheckCircle2,
  },
];

function RouteComponent() {
  const { t } = useI18n();

  return (
    <div className="grid gap-5 sm:gap-6">
      <section className="rounded-[1.5rem] bg-[#2A398D] px-4 py-7 text-white shadow-[0_30px_80px_-44px_rgba(42,57,141,0.72)] sm:rounded-[2rem] sm:px-7 sm:py-8">
        <p className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
          {t.manual.heroEyebrow}
        </p>
        <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.055em] sm:text-6xl">
          {t.manual.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:text-lg sm:leading-7">
          {t.manual.description}
        </p>
      </section>

      <AppSection
        eyebrow={t.manual.stepsEyebrow}
        title={t.manual.stepsTitle}
        description={t.manual.stepsDescription}
        action={
          <Button className="rounded-[1rem]" render={<Link to="/" hash="pin-acceso" />}>
            {t.manual.enterPin}
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const copy = t.manual.steps[index];
            return (
              <article key={copy.title} className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4 sm:p-5">
                <div className="flex size-10 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold tracking-[-0.03em] text-foreground">{copy.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.body}</p>
              </article>
            );
          })}
        </div>
      </AppSection>

      <AppSection eyebrow={t.manual.importantEyebrow} title={t.manual.importantTitle} description={t.manual.importantDescription}>
        <div className="rounded-[1.25rem] border border-[#2A398D]/12 bg-[#2A398D]/5 p-4 text-sm leading-6 text-[#1f2f78]">
          {t.manual.importantBody}
        </div>
      </AppSection>
    </div>
  );
}

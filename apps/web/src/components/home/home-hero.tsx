import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";

import type { HomeViewModel } from "@/lib/home-data";

type HomeHeroProps = {
  home: HomeViewModel;
  ctaHref: string;
  ctaLabel?: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function getHeroCopy(home: HomeViewModel) {
  if (home.state === "pending") {
    return {
      eyebrow: `${home.pendingCount} pendiente${home.pendingCount === 1 ? "" : "s"}`,
      title: "Pronosticar ahora",
      description:
        home.pendingCount === 1
          ? "Te queda un partido por cargar. Aprovecha este momento antes del siguiente cierre."
          : `Te faltan ${home.pendingCount} partidos por cargar. Deja lista tu quiniela antes de que empiece la fecha.`,
    };
  }

  return {
    eyebrow: "Todo al dia",
    title: "Pronosticar ahora",
    description: "Tus proximos pronosticos ya estan guardados. Puedes revisar la tabla y retocar lo que falta antes del cierre.",
  };
}

export function HomeHero({ home, ctaHref, ctaLabel = "Ir a pronosticos" }: HomeHeroProps) {
  const copy = getHeroCopy(home);

  return (
    <AppSection
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      className={cn(
        "overflow-hidden border-0 bg-foreground text-background shadow-[0_30px_80px_-38px_rgba(0,0,0,0.55)]",
        home.ctaTone === "urgent"
          ? "bg-[linear-gradient(135deg,#101826_0%,#19324e_55%,#24567a_100%)]"
          : "bg-[linear-gradient(135deg,#142032_0%,#1b3655_60%,#2b4a69_100%)]",
      )}
      contentClassName="space-y-5"
      action={
        <Button
          size="lg"
          className="h-11 bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          render={<a href={ctaHref} />}
        >
          {ctaLabel}
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-4 rounded-3xl border border-white/12 bg-white/7 p-4 sm:p-5">
          <p className="text-sm leading-6 text-white/80">{copy.description}</p>
          {home.nextKickoff ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-medium">
                Cierre: {dateTimeFormatter.format(home.nextKickoff.kickoffAt)}
              </span>
              <span>
                {home.nextKickoff.matchCount} partido{home.nextKickoff.matchCount === 1 ? "" : "s"} cierran en ese horario.
              </span>
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/12 bg-white/8 p-4">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-white/55 uppercase">Tu lugar hoy</p>
            {home.currentUserStanding ? (
              <>
                <p className="mt-3 text-3xl font-semibold text-white">#{home.currentUserStanding.rank}</p>
                <p className="mt-1 text-sm text-white/75">{home.currentUserStanding.points} puntos en la tabla familiar</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-2xl font-semibold text-white">Aun sin tabla</p>
                <p className="mt-1 text-sm text-white/75">Cuando se jueguen partidos, aqui vas a ver tu posicion.</p>
              </>
            )}
          </div>
          <div className="rounded-3xl border border-white/12 bg-white/8 p-4">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-white/55 uppercase">Tus proximos pronosticos</p>
            <p className="mt-3 text-3xl font-semibold text-white">{home.pendingCount}</p>
            <p className="mt-1 text-sm text-white/75">
              {home.state === "pending" ? "te esperan en pronosticos" : `${home.predictedCount} ya quedaron guardados`}
            </p>
          </div>
        </div>
      </div>
    </AppSection>
  );
}

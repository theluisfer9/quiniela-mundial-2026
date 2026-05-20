import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";

import type { HomeViewModel } from "@/lib/home-data";

type HomeHeroProps = {
  home: HomeViewModel;
  ctaHref: string;
  ctaLabel?: string;
};

function getHeroCopy(home: HomeViewModel) {
  if (home.state === "pending") {
    return {
      eyebrow: `${home.pendingCount} pendiente${home.pendingCount === 1 ? "" : "s"}`,
      title: "Tienes marcadores pendientes.",
      description:
        home.pendingCount === 1
          ? "Te queda un partido por cargar antes del siguiente cierre."
          : `Te faltan ${home.pendingCount} partidos por cargar antes de que arranque la fecha.`,
    };
  }

  return {
    eyebrow: "Todo al dia",
    title: "Tus próximos partidos ya están cubiertos.",
    description: "Revisa la tabla y vuelve antes del cierre si quieres ajustar un marcador.",
  };
}

export function HomeHero({ home, ctaHref, ctaLabel = "Ir a pronosticos" }: HomeHeroProps) {
  const copy = getHeroCopy(home);
  const heroCtaLabel = ctaLabel === "Ir a pronosticos" ? "Pronosticar ahora" : ctaLabel;

  return (
    <AppSection
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      className={cn(
        "relative overflow-hidden border-0 bg-[#2A398D] text-white shadow-[0_28px_80px_-44px_rgba(42,57,141,0.75)] before:absolute before:inset-0 before:opacity-[0.08] before:[background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] before:[background-size:28px_28px]",
        home.ctaTone === "urgent"
          ? "after:absolute after:-right-20 after:-top-20 after:size-60 after:rounded-full after:bg-primary/55 after:blur-[72px]"
          : "after:absolute after:-right-20 after:-top-20 after:size-60 after:rounded-full after:bg-accent/35 after:blur-[72px]",
      )}
      contentClassName="relative z-10 flex flex-col gap-6"
      action={
        <Button
          size="lg"
          className="relative z-10 h-12 rounded-[1rem] border-b-4 border-[#93000e] bg-primary px-6 text-sm font-bold text-white shadow-[0_18px_40px_-18px_rgba(189,0,21,0.95)] hover:bg-primary/92"
          render={<a href={ctaHref} />}
        >
          {heroCtaLabel}
        </Button>
      }
      >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-4 rounded-[1.35rem] border border-white/16 bg-white/10 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold tracking-[0.22em] text-white/85 uppercase">
            <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1">Mundial 2026</span>
            <span className="rounded-full border border-primary/60 bg-primary/20 px-3 py-1 text-white">
              {home.ctaTone === "urgent" ? "Ventana abierta" : "Equipo listo"}
            </span>
          </div>
          <div className="rounded-[1.25rem] border border-white/16 bg-white/10 p-4 sm:p-5">
            <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-white/82 uppercase">Pendientes</p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.04em] text-white">{home.pendingCount}</p>
            <p className="mt-2 text-sm leading-6 text-white/82">
              {home.state === "pending"
                ? `pronóstico${home.pendingCount === 1 ? "" : "s"} pendiente${home.pendingCount === 1 ? "" : "s"} para esta fecha.`
                : `${home.predictedCount} pronóstico${home.predictedCount === 1 ? "" : "s"} guardado${home.predictedCount === 1 ? "" : "s"}.`}
            </p>
          </div>
        </div>
        <div className="rounded-[1.35rem] border border-white/16 bg-white/10 p-5">
          <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-white/82 uppercase">Resumen</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-white">{home.currentUserName}</p>
          <div className="mt-4 rounded-[1.25rem] border border-white/16 bg-white/10 px-4 py-3">
            <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Estado</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white">
              {home.state === "pending" ? "Faltan pronósticos" : "Sin pendientes"}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/82">
              {home.state === "pending"
                ? "Entra ahora para cargar lo que falta."
                : "Puedes volver a revisar tus marcadores antes del cierre."}
            </p>
          </div>
          {home.currentUserStanding ? (
            <>
              <div className="mt-4 flex items-end justify-between gap-3 rounded-[1.25rem] border border-white/16 bg-white/10 p-4">
                <div>
                  <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Posicion actual</p>
                  <p className="mt-1 font-display text-5xl font-extrabold tracking-[-0.04em] text-white">#{home.currentUserStanding.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Puntos</p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-[-0.03em] text-white">{home.currentUserStanding.points}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/82">Tu posición puede cambiar con cada partido cerrado.</p>
            </>
          ) : (
              <div className="mt-4 rounded-[1.25rem] border border-white/16 bg-white/10 p-4">
              <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Posicion actual</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">Aun sin tabla</p>
              <p className="mt-2 text-sm leading-6 text-white/82">Cuando empiece el torneo, aquí verás tu posición y puntaje.</p>
            </div>
          )}
        </div>
      </div>
    </AppSection>
  );
}

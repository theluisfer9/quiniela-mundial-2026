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
      title: "Este cierre todavia se juega en casa.",
      description:
        home.pendingCount === 1
          ? "Te queda un partido por cargar. Aprovecha este momento antes del siguiente cierre y dejalo listo con calma."
          : `Te faltan ${home.pendingCount} partidos por cargar. Deja lista tu quiniela antes de que arranque la fecha.`,
    };
  }

  return {
    eyebrow: "Todo al dia",
    title: "La tabla se mueve y tu quiniela ya esta en partido.",
    description: "Tus proximos pronosticos ya estan guardados. Revisa como va la familia y vuelve a entrar antes del cierre si quieres ajustar algo.",
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
        "overflow-hidden border-0 bg-foreground text-background shadow-[0_30px_80px_-38px_rgba(0,0,0,0.55)]",
        home.ctaTone === "urgent"
          ? "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,#07111f_0%,#103154_48%,#1f5f8b_100%)]"
          : "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%),linear-gradient(135deg,#08131f_0%,#123458_52%,#275f86_100%)]",
      )}
      contentClassName="space-y-6"
      action={
        <Button
          size="lg"
          className="h-12 rounded-full bg-[#d72638] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(215,38,56,0.95)] hover:bg-[#bf2030]"
          render={<a href={ctaHref} />}
        >
          {heroCtaLabel}
        </Button>
      }
      >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-[2rem] border border-white/16 bg-white/8 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold tracking-[0.22em] text-white/85 uppercase">
            <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1">Torneo vivo</span>
            <span className="rounded-full border border-[#d72638]/60 bg-[#d72638]/20 px-3 py-1 text-white">
              {home.ctaTone === "urgent" ? "Ventana abierta" : "Equipo listo"}
            </span>
          </div>
          <div className="rounded-[1.75rem] border border-white/16 bg-[#07101a]/35 p-4 sm:p-5">
            <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-white/82 uppercase">Tu jugada hoy</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{home.pendingCount}</p>
            <p className="mt-2 text-sm leading-6 text-white/82">
              {home.state === "pending"
                ? `pronostico${home.pendingCount === 1 ? "" : "s"} pendiente${home.pendingCount === 1 ? "" : "s"} para dejar lista esta fecha.`
                : `${home.predictedCount} pronostico${home.predictedCount === 1 ? "" : "s"} ya quedaron guardados y listos para revisarse.`}
            </p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/16 bg-[#08111a]/38 p-5">
          <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-white/82 uppercase">Tu resumen de fecha</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-white">{home.currentUserName}</p>
          <div className="mt-4 rounded-[1.5rem] border border-white/16 bg-white/10 px-4 py-3">
            <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Estado</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white">
              {home.state === "pending" ? "Todavia hay juego" : "Todo cubierto"}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/82">
              {home.state === "pending"
                ? "Tu acceso rapido sigue abierto para cerrar la fecha a tiempo."
                : "Tu carga ya quedo lista y puedes volver a revisarla antes del cierre."}
            </p>
          </div>
          {home.currentUserStanding ? (
            <>
              <div className="mt-4 flex items-end justify-between gap-3 rounded-[1.5rem] border border-white/16 bg-white/10 p-4">
                <div>
                  <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Posicion actual</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight text-white">#{home.currentUserStanding.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Puntos</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{home.currentUserStanding.points}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/82">Vas en carrera dentro de la tabla familiar. Un buen cierre puede mover rapido tu puesto.</p>
            </>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-white/16 bg-white/10 p-4">
              <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/82 uppercase">Posicion actual</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">Aun sin tabla</p>
              <p className="mt-2 text-sm leading-6 text-white/82">Cuando empiecen a jugarse partidos, aqui vas a ver tu lugar y como se mueve tu puntaje.</p>
            </div>
          )}
        </div>
      </div>
    </AppSection>
  );
}

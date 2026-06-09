import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Save, Trophy } from "lucide-react";

export const Route = createFileRoute("/manual")({
  component: RouteComponent,
});

const steps = [
  {
    icon: KeyRound,
    title: "1. Entra con tu PIN",
    body: "En la pantalla de inicio escribe el PIN de 4 caracteres que te compartieron. Si el PIN es correcto, entras directo a tus partidos.",
  },
  {
    icon: Trophy,
    title: "2. Abre Mis partidos",
    body: "Ahí verás un partido a la vez. Revisa local, visita y la fecha de cierre antes de poner tu marcador.",
  },
  {
    icon: Save,
    title: "3. Escribe y guarda",
    body: "Pon los goles de cada equipo y presiona Guardar. Si cambias un marcador, vuelve a guardar para confirmar el cambio.",
  },
  {
    icon: CheckCircle2,
    title: "4. Sigue al siguiente",
    body: "Usa Anterior y Siguiente para avanzar por los partidos. Puedes editar hasta que el partido empiece; después queda bloqueado.",
  },
];

function RouteComponent() {
  return (
    <div className="grid gap-5 sm:gap-6">
      <section className="rounded-[1.5rem] bg-[#2A398D] px-4 py-7 text-white shadow-[0_30px_80px_-44px_rgba(42,57,141,0.72)] sm:rounded-[2rem] sm:px-7 sm:py-8">
        <p className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
          Manual rápido
        </p>
        <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.055em] sm:text-6xl">
          Cómo entrar y votar tus marcadores.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:text-lg sm:leading-7">
          Solo necesitas tu PIN. Cada marcador se guarda manualmente y puedes cambiarlo hasta que empiece el partido.
        </p>
      </section>

      <AppSection
        eyebrow="Paso a paso"
        title="Haz esto cada vez que quieras votar"
        description="Guía corta para entrar, cargar tus pronósticos y confirmar que quedaron guardados."
        action={
          <Button className="rounded-[1rem]" render={<Link to="/" hash="pin-acceso" />}>
            Entrar con PIN
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4 sm:p-5">
                <div className="flex size-10 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold tracking-[-0.03em] text-foreground">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
            );
          })}
        </div>
      </AppSection>

      <AppSection eyebrow="Importante" title="Cómo saber si ya quedó" description="Después de guardar, el botón cambia a Guardado y puedes avanzar al siguiente partido.">
        <div className="rounded-[1.25rem] border border-[#2A398D]/12 bg-[#2A398D]/5 p-4 text-sm leading-6 text-[#1f2f78]">
          Si ves un error, revisa que hayas escrito los dos marcadores y presiona Guardar de nuevo. Si el partido ya empezó, ya no se puede editar.
        </div>
      </AppSection>
    </div>
  );
}

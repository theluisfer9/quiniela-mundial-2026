import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { CheckCircle2, ChevronRight, ListOrdered, Medal, PencilLine, Trophy, Users } from "lucide-react";

const previewLeaderboard = [
  { name: "Luisfer", points: 42, tone: "bg-emerald-500/18 border-emerald-500/35", avatar: "🧔🏻‍♂️" },
  { name: "Tu", points: 38, tone: "bg-primary/10 ring-1 ring-primary/35", avatar: "😎" },
  { name: "Lili", points: 35, tone: "bg-white/70 border-border/70", avatar: "👩🏻" },
] as const;

const steps = [
  {
    title: "Carga marcadores",
    body: "Elige tus resultados antes del cierre de cada partido.",
    Icon: PencilLine,
    card: "bg-[color:var(--color-card)]",
    accent: "bg-primary text-primary-foreground",
  },
  {
    title: "Suma puntos",
    body: "Resultado exacto vale más. Acertar ganador también cuenta.",
    Icon: Trophy,
    card: "bg-[color:color-mix(in_oklab,var(--color-foreground)_10%,white)]",
    accent: "bg-foreground text-background",
  },
  {
    title: "Sube en la tabla",
    body: "Revisa posiciones, puntos y movimientos durante el torneo.",
    Icon: Medal,
    card: "bg-[color:color-mix(in_oklab,var(--color-accent)_22%,white)]",
    accent: "bg-accent text-accent-foreground",
  },
] as const;

export function PublicLanding() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-background shadow-[0_22px_64px_-42px_rgba(42,57,141,0.42)]">
      <section className="relative isolate overflow-hidden bg-[#2A398D] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(230,29,37,0.22),transparent_22%),radial-gradient(circle_at_82%_64%,rgba(60,172,59,0.14),transparent_18%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/45 blur-[96px]" />
        <div className="absolute bottom-0 left-0 h-56 w-full bg-gradient-to-t from-background via-background/45 to-transparent" />

        <div className="relative z-10 flex min-h-[40rem] flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-20">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-primary/18 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-white/92 uppercase shadow-sm">
            <Users className="size-4" />
            Pronósticos del Mundial
          </span>

          <h1 className="max-w-5xl text-balance font-display text-[3rem] leading-[0.95] tracking-[-0.05em] text-white drop-shadow-lg sm:text-[4.5rem] lg:text-[5.5rem]">
            La Quiniela Familiar <span className="text-[#8afc7f]">2026</span>
          </h1>

          <p className="mt-6 max-w-3xl text-balance text-base leading-7 text-white/88 sm:text-lg">
            Organiza una quiniela privada para el Mundial 2026: marcadores antes de cada partido, tabla automática y puntos claros para todo el grupo.
          </p>

          <Button
            size="lg"
            className="mt-10 h-14 rounded-[1rem] border-b-4 border-[#93000e] bg-primary px-8 text-base font-bold text-primary-foreground shadow-[0_6px_18px_rgba(189,0,21,0.38)] hover:bg-primary/92"
            render={<a href="/dashboard" />}
          >
            Crear mi quiniela
          </Button>

          <div className="mt-14 hidden w-full max-w-6xl justify-between gap-6 px-2 md:flex">
            <DecorativeScoreCard className="-rotate-6" left="MEX" leftFlag="🇲🇽" right="ARG" rightFlag="🇦🇷" score="2 - 1" />
            <DecorativeScoreCard className="translate-y-10 rotate-6" left="BRA" leftFlag="🇧🇷" right="FRA" rightFlag="🇫🇷" score="0 - 0" />
          </div>
        </div>
      </section>

      <section className="relative z-20 bg-background px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">
              Cómo funciona
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Lo básico para jugar sin hojas de cálculo ni mensajes perdidos.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.Icon;

              return (
              <div
                key={step.title}
                className={`group relative overflow-hidden rounded-[1.5rem] border border-white/50 p-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)] ${step.card}`}
              >
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/12 transition-transform duration-500 group-hover:scale-150" />
                <div
                  className={`relative z-10 mb-6 flex size-16 items-center justify-center rounded-[1.2rem] shadow-md transition-transform ${step.accent} ${index === 1 ? "-rotate-3 group-hover:rotate-0" : "rotate-3 group-hover:rotate-0"}`}
                >
                  <Icon className="size-8" />
                </div>
                <h3 className="relative z-10 font-display text-2xl leading-tight tracking-[-0.03em] text-foreground">
                  {index + 1}. {step.title}
                </h3>
                <p className="relative z-10 mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{step.body}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-[color:color-mix(in_oklab,var(--color-card)_62%,var(--color-primary)_4%)] px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">
              La tabla se actualiza sola
            </h2>
            <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-lg">
              Cada participante ve sus puntos, su posición y qué partidos le faltan por cargar. Menos discusión, más marcador.
            </p>
            <ul className="mt-8 space-y-4 text-sm leading-6 text-foreground sm:text-base">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-accent" />
                3 puntos por resultado exacto
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-accent" />
                1 punto por acertar ganador
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-accent" />
                Tabla automática para todo el grupo
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/84 p-6 shadow-[0_18px_40px_rgba(42,57,141,0.1)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h3 className="flex items-center gap-2 font-display text-2xl tracking-[-0.03em] text-[#2A398D]">
                <ListOrdered className="size-6" />
                Ranking Familiar
              </h3>
              <span className="rounded-full bg-[#97a5ff]/45 px-3 py-1 text-xs font-semibold text-[#28378b]">
                Fase de grupos
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {previewLeaderboard.map((entry, index) => (
                <div
                  key={entry.name}
                  className={`flex items-center justify-between rounded-[1.2rem] border p-3 shadow-sm ${entry.tone}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-display text-xl text-foreground/75">{index + 1}</div>
                    <EmojiAvatar emoji={entry.avatar} name={entry.name} />
                    <span className="font-semibold text-foreground">{entry.name}</span>
                  </div>
                  <span className="font-display text-2xl tracking-[-0.03em] text-foreground">{entry.points} pts</span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-border/50 pt-4 text-center">
              <a href="/dashboard" className="inline-flex items-center gap-1 font-semibold text-[#2A398D] hover:underline">
                Ver tabla completa
                <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmojiAvatar({ emoji, name }: { emoji: string; name: string }) {
  return (
    <span
      aria-label={`Avatar de ${name}`}
      className="flex size-11 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#fff8f7,#dee0ff)] text-2xl shadow-[0_8px_18px_-12px_rgba(42,57,141,0.55)]"
      role="img"
    >
      {emoji}
    </span>
  );
}

function DecorativeScoreCard({
  left,
  leftFlag,
  right,
  rightFlag,
  score,
  className,
}: {
  left: string;
  leftFlag: string;
  right: string;
  rightFlag: string;
  score: string;
  className?: string;
}) {
  return (
    <div className={`w-64 rounded-xl border border-white/15 bg-white/92 p-4 text-foreground shadow-xl ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-white text-2xl shadow-sm">
          {leftFlag}
        </div>
        <span className="font-display text-2xl tracking-[-0.03em] text-foreground">{score}</span>
        <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-white text-2xl shadow-sm">
          {rightFlag}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

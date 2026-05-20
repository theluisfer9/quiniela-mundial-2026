import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@quiniela-mundial-2026/ui/components/card";

type EmptyTournamentProps = {
  currentUserName: string;
};

export function EmptyTournament({ currentUserName }: EmptyTournamentProps) {
  return (
    <AppSection
      eyebrow="Bienvenida"
      title={`Hola, ${currentUserName}`}
      description="El torneo todavía no arranca. Cuando publiquemos el fixture, este inicio mostrará partidos, tabla y accesos para pronosticar."
      className="border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(18,72,120,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,243,236,0.98))]"
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.95fr]">
        <Card className="overflow-hidden border border-primary/15 bg-background/90 shadow-[0_20px_55px_-40px_rgba(9,44,77,0.45)]">
          <CardHeader className="border-b border-border/70 bg-[linear-gradient(135deg,rgba(9,61,110,0.06),rgba(215,38,56,0.08))]">
            <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold tracking-[0.2em] text-primary uppercase">
              <span className="rounded-full bg-primary/10 px-3 py-1">Previa</span>
              <span className="rounded-full bg-[#d72638]/10 px-3 py-1 text-[#b81f31]">Fixture pendiente</span>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">Todavía no hay partidos publicados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-1">
            <p className="text-sm leading-6 text-muted-foreground">
              Cuando se cargue el fixture, verás los partidos abiertos, el siguiente cierre y la tabla de posiciones.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 px-4 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">Fixture</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Cada partido tendrá acceso directo para cargar marcador.</p>
              </div>
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 px-4 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">Tabla</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Tu posición y puntos aparecerán al iniciar el torneo.</p>
              </div>
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 px-4 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">Cierres</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Mostraremos la próxima fecha límite para cargar marcadores.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full bg-[#d72638] text-white hover:bg-[#bf2030]" render={<a href="#proximos-pasos" />}>
                Ver flujo
              </Button>
              <Button variant="outline" className="rounded-full" render={<a href="/dashboard" />}>
                Administrar mi cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card
          id="proximos-pasos"
          className="border border-dashed border-primary/25 bg-[linear-gradient(180deg,rgba(9,61,110,0.05),rgba(255,255,255,0.92))]"
        >
          <CardHeader className="border-b border-primary/15">
            <CardTitle className="text-base font-semibold">Qué sigue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-1 text-sm leading-6 text-muted-foreground">
            <div className="rounded-[1.35rem] border border-primary/10 bg-background/80 px-4 py-3">
              <p className="font-semibold text-foreground">1. Publicamos los partidos del Mundial.</p>
              <p className="mt-1">La pantalla de inicio cambia a tablero de fecha.</p>
            </div>
            <div className="rounded-[1.35rem] border border-primary/10 bg-background/80 px-4 py-3">
              <p className="font-semibold text-foreground">2. Se habilitan los pronósticos.</p>
              <p className="mt-1">Desde ahí puedes cargar o ajustar marcadores abiertos.</p>
            </div>
            <div className="rounded-[1.35rem] border border-primary/10 bg-background/80 px-4 py-3">
              <p className="font-semibold text-foreground">3. Se actualiza la tabla.</p>
              <p className="mt-1">Posición, puntos y próximos cierres quedan visibles desde el primer partido.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppSection>
  );
}

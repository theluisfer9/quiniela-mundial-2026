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
      description="La quiniela familiar ya esta lista para recibirte, pero el torneo todavia no arranca. Apenas aparezcan los primeros partidos, este inicio se convierte en tu tablero para pronosticar y seguir la tabla."
      className="border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,239,0.95))]"
    >
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="border border-primary/15 bg-background/85">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="text-xl font-semibold tracking-tight">Todavia no hay partidos publicados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <p className="text-sm leading-6 text-muted-foreground">
              Cuando se cargue el fixture vas a ver tres cosas aqui mismo: el boton grande para pronosticar, la tabla familiar y los proximos cierres para que nadie llegue tarde.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button render={<a href="#proximos-pasos" />}>Como va a funcionar</Button>
              <Button variant="outline" render={<a href="/dashboard" />}>Administrar mi cuenta</Button>
            </div>
          </CardContent>
        </Card>
        <Card id="proximos-pasos" className="border border-dashed border-primary/25 bg-primary/5">
          <CardHeader className="border-b border-primary/15">
            <CardTitle className="text-base font-semibold">Que sigue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-1 text-sm leading-6 text-muted-foreground">
            <p>1. Cargamos los partidos del Mundial.</p>
            <p>2. Se activa el bloque <span className="font-semibold text-foreground">Pronosticar ahora</span>.</p>
            <p>3. Empiezas a sumar puntos y a pelear la tabla familiar desde el primer cierre.</p>
          </CardContent>
        </Card>
      </div>
    </AppSection>
  );
}

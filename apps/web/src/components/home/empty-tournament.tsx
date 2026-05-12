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
      description="La quiniela familiar ya esta lista para recibirte, pero el torneo todavia no arranca. Apenas aparezca el fixture, este inicio se convierte en tu tablero para jugar la fecha, seguir la tabla y entrar rapido a pronosticar."
      className="border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(18,72,120,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,243,236,0.98))]"
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.95fr]">
        <Card className="overflow-hidden border border-primary/15 bg-background/90 shadow-[0_20px_55px_-40px_rgba(9,44,77,0.45)]">
          <CardHeader className="border-b border-border/70 bg-[linear-gradient(135deg,rgba(9,61,110,0.06),rgba(215,38,56,0.08))]">
            <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold tracking-[0.2em] text-primary uppercase">
              <span className="rounded-full bg-primary/10 px-3 py-1">Previa del torneo</span>
              <span className="rounded-full bg-[#d72638]/10 px-3 py-1 text-[#b81f31]">Lista para arrancar</span>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">Todavia no hay partidos publicados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-1">
            <p className="text-sm leading-6 text-muted-foreground">
              Cuando se cargue el fixture vas a ver el boton fuerte para entrar a pronosticar, la tabla familiar y la ventana de cierres para que toda la familia juegue la fecha a tiempo.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 px-4 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">Fixture</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Apenas salga, cada partido va a tener acceso directo a tu pronostico.</p>
              </div>
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 px-4 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">Tabla</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Tu posicion y tus puntos se van a ver apenas empiece a rodar la pelota.</p>
              </div>
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 px-4 py-4">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">Cierres</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Te vamos a mostrar que ventana viene para que no se te pase ningun partido.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full bg-[#d72638] text-white hover:bg-[#bf2030]" render={<a href="#proximos-pasos" />}>
                Como va a funcionar
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
            <CardTitle className="text-base font-semibold">Que sigue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-1 text-sm leading-6 text-muted-foreground">
            <div className="rounded-[1.35rem] border border-primary/10 bg-background/80 px-4 py-3">
              <p className="font-semibold text-foreground">1. Publicamos los partidos del Mundial.</p>
              <p className="mt-1">En cuanto aparezcan, la home cambia de bienvenida a tablero de fecha.</p>
            </div>
            <div className="rounded-[1.35rem] border border-primary/10 bg-background/80 px-4 py-3">
              <p className="font-semibold text-foreground">2. Se enciende el bloque Pronosticar ahora.</p>
              <p className="mt-1">Desde ahi vas a poder entrar directo a cargar y continuar tus jugadas.</p>
            </div>
            <div className="rounded-[1.35rem] border border-primary/10 bg-background/80 px-4 py-3">
              <p className="font-semibold text-foreground">3. Empieza la pelea por la tabla familiar.</p>
              <p className="mt-1">Tu posicion, tus puntos y los proximos cierres quedan visibles desde el primer partido.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppSection>
  );
}

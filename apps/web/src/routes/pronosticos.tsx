import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pronosticos")({
  component: PredictionsPlaceholderRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    match: typeof search.match === "string" ? search.match : undefined,
  }),
});

function PredictionsPlaceholderRoute() {
  const { match } = Route.useSearch();

  return (
    <AppSection
      eyebrow="Pronosticos"
      title="Pantalla de pronosticos en preparacion"
      description="Task 4 deja listo el punto de entrada. La carga completa de pronosticos llega en Task 5."
    >
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          {match
            ? `Llegaste para continuar el partido ${match}.`
            : "Llegaste al acceso principal para empezar a pronosticar."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button render={<a href="/" />}>Volver al inicio</Button>
          <Button variant="outline" render={<a href="/dashboard" />}>Ir al dashboard</Button>
        </div>
      </div>
    </AppSection>
  );
}

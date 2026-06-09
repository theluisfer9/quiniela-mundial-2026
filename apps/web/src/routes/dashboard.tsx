import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";

import { PinEntryForm } from "@/components/pin-entry-form";
import { storePlayerSession } from "@/lib/player-session";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const loginWithPin = useMutation(api.players.loginWithPin);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  async function handlePinSubmit(pin: string) {
    setPinError(null);
    setIsSubmittingPin(true);

    try {
      const result = await loginWithPin({ pin });

      if (result.status === "ok") {
        storePlayerSession({
          sessionToken: result.sessionToken,
          displayName: result.player.displayName,
        });
        await navigate({ to: "/pronosticos", search: { match: undefined } });
        return;
      }

      if (result.status === "invalid_pin" || result.status === "locked") {
        setPinError(result.message);
      }
    } catch {
      setPinError("No pudimos validar tu PIN. Intenta de nuevo.");
    } finally {
      setIsSubmittingPin(false);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[40rem] gap-4">
      <AppSection
        eyebrow="Acceso actualizado"
        title="Ahora entras con tu PIN"
        description="Para cargar marcadores, ingresa el PIN de tu jugador. La tabla publica esta disponible desde Inicio."
        className="border-border/70 bg-white/88"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_auto] lg:items-start">
          <PinEntryForm
            title="Acceso de jugador"
            description="Ingresa tu PIN para guardar pronosticos. Pronósticos validara tu acceso antes de mostrar tus partidos."
            headingLevel="h2"
            isSubmitting={isSubmittingPin}
            error={pinError}
            submitLabel="Entrar a pronosticos"
            onSubmit={handlePinSubmit}
          />
          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/#pin-acceso" />} variant="outline">
              Ir al acceso con PIN
            </Button>
            <Button render={<a href="/pronosticos" />} variant="outline">
              Abrir Pronósticos
            </Button>
          </div>
        </div>
      </AppSection>
    </section>
  );
}

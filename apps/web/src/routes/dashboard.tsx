import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { POST_AUTH_REDIRECT_PATH } from "@/lib/navigation";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className="mx-auto grid w-full max-w-[32rem] gap-4">
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </section>
  );
}

function AuthenticatedDashboardShell() {
  const navigate = useNavigate({ from: "/dashboard" });

  useEffect(() => {
    void navigate({
      to: POST_AUTH_REDIRECT_PATH,
      replace: true,
    });
  }, [navigate]);

  return (
    <DashboardShell>
      <AppSection
        eyebrow="Acceso correcto"
        title="Acceso confirmado"
        description="Puedes ir al inicio o seguir directo a Pronósticos."
        className="border-border/70 bg-white/88"
      >
        <div className="flex items-center gap-2 rounded-[1.4rem] bg-accent/10 px-4 py-3 text-sm font-semibold text-foreground">
          <CheckCircle2 className="size-4 text-accent" />
          Tu sesión ya está activa.
        </div>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link to={POST_AUTH_REDIRECT_PATH} />}>Ir al inicio</Button>
          <Button render={<Link to="/pronosticos" search={{ match: undefined }} />} variant="outline">
            Ir a Pronósticos
          </Button>
        </div>
      </AppSection>
    </DashboardShell>
  );
}

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);

  const shellTitle = showSignIn ? "Entra a tu quiniela" : "Crea tu cuenta";
  const shellDescription = showSignIn
    ? "Consulta la tabla, revisa cierres y carga tus pronósticos del Mundial."
    : "Guarda tus marcadores, suma puntos y sigue el torneo con tu grupo.";

  return (
    <>
      <Authenticated>
        <AuthenticatedDashboardShell />
      </Authenticated>
      <Unauthenticated>
        <DashboardShell>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </DashboardShell>
      </Unauthenticated>
      <AuthLoading>
        <DashboardShell>
          <AppSection
            eyebrow="Un momento"
            title="Revisando tu sesión"
            description="Queremos mostrarte el estado correcto sin perder de vista tu cuenta."
            className="border-border/70 bg-white/88"
          >
            <div className="flex items-center gap-3 rounded-[1.4rem] bg-secondary/55 px-4 py-4 text-sm font-semibold text-foreground">
              <Loader2 className="size-4 animate-spin text-sidebar-primary" />
              Cargando tu acceso...
            </div>
          </AppSection>
        </DashboardShell>
      </AuthLoading>
    </>
  );
}

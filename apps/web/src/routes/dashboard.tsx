import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useEffect, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { POST_AUTH_REDIRECT_PATH } from "@/lib/navigation";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function AuthenticatedDashboardShell() {
  const navigate = useNavigate({ from: "/dashboard" });

  useEffect(() => {
    void navigate({
      to: POST_AUTH_REDIRECT_PATH,
      replace: true,
    });
  }, [navigate]);

  return (
    <AppSection
      eyebrow="Cuenta lista"
      title="Ya entraste a la quiniela"
      description="Te estamos llevando al inicio para que sigas con tus pronósticos y la tabla familiar."
    >
      <div className="flex flex-wrap gap-3">
        <Button render={<Link to={POST_AUTH_REDIRECT_PATH} />}>Ir al inicio</Button>
        <Button render={<Link to="/pronosticos" search={{ match: undefined }} />} variant="outline">
          Ir a Pronósticos
        </Button>
      </div>
    </AppSection>
  );
}

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <>
      <Authenticated>
        <AuthenticatedDashboardShell />
      </Authenticated>
      <Unauthenticated>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </Unauthenticated>
      <AuthLoading>
        <AppSection
          eyebrow="Cuenta"
          title="Estamos preparando tu acceso"
          description="En un momento sabremos si entramos a tu cuenta o si te mostramos el formulario para continuar."
        />
      </AuthLoading>
    </>
  );
}

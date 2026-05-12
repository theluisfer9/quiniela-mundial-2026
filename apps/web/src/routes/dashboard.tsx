import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { CheckCircle2, Loader2, ShieldCheck, Trophy } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { POST_AUTH_REDIRECT_PATH } from "@/lib/navigation";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function DashboardShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.05fr_minmax(0,28rem)] lg:items-start">
      <div className="overflow-hidden rounded-[2.4rem] bg-[linear-gradient(160deg,#232a62_0%,#31439a_50%,#e61d25_100%)] p-6 text-white shadow-[0_34px_90px_-42px_rgba(31,36,80,0.68)] sm:p-7">
        <div className="flex size-12 items-center justify-center rounded-[1.2rem] bg-white/14 backdrop-blur">
          <Trophy className="size-5" />
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-white/78 uppercase">{eyebrow}</p>
          <h1 className="max-w-lg text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
          <p className="max-w-xl text-sm leading-6 text-white/82 sm:text-base">{description}</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.6rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-white/70 uppercase">Siempre a mano</p>
            <p className="mt-2 text-sm font-semibold text-white">Inicio, Pronósticos y tu cuenta quedan a un toque.</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-white/70 uppercase">Hecho para la familia</p>
            <p className="mt-2 text-sm font-semibold text-white">Sigue la tabla, entra a tiempo y comparte cada jornada.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
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
    <DashboardShell
      eyebrow="Cuenta lista"
      title="Ya entraste a la quiniela"
      description="Te estamos llevando al inicio para que sigas con tus pronósticos y la tabla familiar."
    >
      <AppSection
        eyebrow="Acceso correcto"
        title="Tu lugar ya está listo"
        description="Mientras termina el redireccionamiento, puedes ir directo a donde quieras continuar."
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

  const shellTitle = showSignIn ? "Entra para seguir la quiniela" : "Abre tu cuenta y empieza a jugar";
  const shellDescription = showSignIn
    ? "Vuelve a la tabla familiar, revisa tus cierres y entra directo a tus pronósticos del Mundial."
    : "Crea tu espacio en la quiniela para guardar pronósticos, sumar puntos y seguir cada partido con tu gente.";

  return (
    <>
      <Authenticated>
        <AuthenticatedDashboardShell />
      </Authenticated>
      <Unauthenticated>
        <DashboardShell eyebrow="Quiniela familiar" title={shellTitle} description={shellDescription}>
          <div className="flex items-center gap-2 rounded-[1.4rem] border border-border/60 bg-white/72 px-4 py-3 text-sm font-medium text-foreground shadow-sm backdrop-blur">
            <ShieldCheck className="size-4 text-primary" />
            Tu acceso queda listo para entrar al inicio o a Pronósticos sin rodeos.
          </div>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </DashboardShell>
      </Unauthenticated>
      <AuthLoading>
        <DashboardShell
          eyebrow="Cuenta"
          title="Estamos preparando tu acceso"
          description="En un momento sabremos si entramos a tu cuenta o si te mostramos el formulario para continuar."
        >
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

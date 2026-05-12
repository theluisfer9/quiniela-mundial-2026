import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Input } from "@quiniela-mundial-2026/ui/components/input";
import { Label } from "@quiniela-mundial-2026/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock3, Trophy } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { POST_AUTH_REDIRECT_PATH } from "@/lib/navigation";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const navigate = useNavigate({
    from: "/dashboard",
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: POST_AUTH_REDIRECT_PATH,
            });
            toast.success("Qué bueno verte de nuevo. Ya puedes entrar a tu quiniela.");
          },
          onError: () => {
            toast.error("No pudimos entrar. Revisa tu correo y tu contraseña para intentarlo otra vez.");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Escribe un correo válido para entrar."),
        password: z.string().min(8, "Tu contraseña debe tener al menos 8 caracteres."),
      }),
    },
  });

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_26px_60px_-36px_rgba(31,36,80,0.45)] backdrop-blur sm:p-6">
      <div className="mb-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-primary text-primary-foreground shadow-[0_16px_34px_-20px_rgba(230,29,37,0.9)]">
            <Trophy className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">Tu cuenta</p>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Qué gusto verte otra vez</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Entra para seguir la quiniela, revisar tus marcadores y llegar a tiempo a los cierres.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[1.4rem] bg-secondary/60 px-4 py-3">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-secondary-foreground/80 uppercase">
              Tu ritmo
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">Sigue la tabla y tus puntos sin perderte un cierre.</p>
          </div>
          <div className="rounded-[1.4rem] bg-accent/10 px-4 py-3">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-accent uppercase">Cada jornada cuenta</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock3 className="size-4 text-accent" />
              Revisa tus marcadores antes del siguiente partido.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4 rounded-[1.6rem] border border-border/60 bg-background/70 p-4 sm:p-5"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Correo electrónico</Label>
                <Input
                  className="h-11 rounded-[1rem] border-border/70 bg-white px-3 text-sm"
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="familia@ejemplo.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error, index) => (
                  <p key={`${field.name}-error-${index}`} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Contraseña</Label>
                <Input
                  className="h-11 rounded-[1rem] border-border/70 bg-white px-3 text-sm"
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="Tu contraseña"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error, index) => (
                  <p key={`${field.name}-error-${index}`} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="h-11 w-full rounded-[1rem] text-sm font-semibold"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar a mi quiniela"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 rounded-[1.4rem] bg-primary/[0.06] px-4 py-3 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="h-auto px-0 text-sm font-semibold text-primary hover:text-primary"
        >
          ¿Primera vez por aquí? Crea tu cuenta
        </Button>
      </div>
    </div>
  );
}

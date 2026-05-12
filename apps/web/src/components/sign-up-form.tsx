import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Input } from "@quiniela-mundial-2026/ui/components/input";
import { Label } from "@quiniela-mundial-2026/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { POST_AUTH_REDIRECT_PATH } from "@/lib/navigation";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate({
    from: "/dashboard",
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            navigate({
              to: POST_AUTH_REDIRECT_PATH,
            });
            toast.success("Tu cuenta ya está lista. Vamos a empezar la quiniela.");
          },
          onError: () => {
            toast.error("No pudimos crear tu cuenta. Inténtalo otra vez en un momento.");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Escribe el nombre con el que te reconocerá tu familia."),
        email: z.email("Escribe un correo válido para crear tu cuenta."),
        password: z.string().min(8, "Elige una contraseña de al menos 8 caracteres."),
      }),
    },
  });

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_26px_60px_-36px_rgba(31,36,80,0.45)] backdrop-blur sm:p-6">
      <div className="mb-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_18px_34px_-20px_rgba(42,57,141,0.9)]">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">Empieza hoy</p>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Crea tu cuenta para jugar en familia</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Guarda tus pronósticos, sigue la tabla y acompaña cada partido con el resto de la familia.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[1.4rem] bg-secondary/60 px-4 py-3">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-secondary-foreground/80 uppercase">
              Entra a la tabla
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">Tu cuenta te guarda puntos, cierres y pronósticos desde el primer partido.</p>
          </div>
          <div className="rounded-[1.4rem] bg-accent/10 px-4 py-3">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-accent uppercase">Juega acompañado</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="size-4 text-accent" />
              Elige cómo te verá tu familia en la quiniela.
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
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Tu nombre</Label>
                <Input
                  className="h-11 rounded-[1rem] border-border/70 bg-white px-3 text-sm"
                  id={field.name}
                  name={field.name}
                  placeholder="Ana"
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
                  placeholder="Elige una contraseña"
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
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta y entrar"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 rounded-[1.4rem] bg-sidebar-primary/[0.06] px-4 py-3 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="h-auto px-0 text-sm font-semibold text-sidebar-primary hover:text-sidebar-primary"
        >
          ¿Ya tienes cuenta? Entra aquí
        </Button>
      </div>
    </div>
  );
}

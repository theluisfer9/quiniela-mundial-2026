import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Input } from "@quiniela-mundial-2026/ui/components/input";
import { Label } from "@quiniela-mundial-2026/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
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
    <div className="mx-auto mt-10 w-full max-w-md rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
      <div className="mb-6 space-y-2 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">Tu cuenta</p>
        <h1 className="text-3xl font-bold tracking-tight">Qué gusto verte otra vez</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Entra para seguir la quiniela, revisar tus marcadores y llegar a tiempo a los cierres.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Correo electrónico</Label>
                <Input
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
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar a mi quiniela"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ¿Primera vez por aquí? Crea tu cuenta
        </Button>
      </div>
    </div>
  );
}

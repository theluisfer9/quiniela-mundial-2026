import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Input } from "@quiniela-mundial-2026/ui/components/input";
import { Label } from "@quiniela-mundial-2026/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail, Sparkles, User } from "lucide-react";
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
            toast.success("Cuenta creada. Ya puedes cargar tus pronósticos.");
          },
          onError: () => {
            toast.error("No pudimos crear tu cuenta. Inténtalo otra vez en un momento.");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Escribe el nombre que aparecerá en la tabla."),
        email: z.email("Escribe un correo válido para crear tu cuenta."),
        password: z.string().min(8, "Elige una contraseña de al menos 8 caracteres."),
      }),
    },
  });

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white/92 p-5 shadow-[0_24px_58px_-36px_rgba(42,57,141,0.5)] backdrop-blur sm:p-6">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_18px_34px_-20px_rgba(42,57,141,0.9)]">
            <Sparkles className="size-5" />
        </div>
        <p className="text-[0.7rem] font-bold tracking-[0.22em] text-primary uppercase">Crear cuenta</p>
        <h1 className="font-display text-3xl font-extrabold leading-none tracking-[-0.04em] text-balance">Crea tu cuenta</h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Guarda tus marcadores, consulta la tabla y juega con tu grupo durante el Mundial.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4 rounded-[1.35rem] border border-border/60 bg-background/70 p-4 sm:p-5"
      >
        <div>
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>Tu nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-[1rem] border-border/70 bg-white pl-10 text-sm"
                    id={field.name}
                    name={field.name}
                    placeholder="Ana"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-[1rem] border-border/70 bg-white pl-10 text-sm"
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-[1rem] border-border/70 bg-white pl-10 text-sm"
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="Elige una contraseña"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
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
              className="h-12 w-full rounded-[1rem] border-b-4 border-[#93000e] bg-primary text-sm font-bold shadow-[0_10px_22px_rgba(189,0,21,0.24)]"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta y entrar"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 rounded-[1.2rem] bg-sidebar-primary/[0.06] px-4 py-3 text-center">
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

import { Button } from "@quiniela-mundial-2026/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@quiniela-mundial-2026/ui/components/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { AUTH_ENTRY_PATH } from "@/lib/navigation";

type UserMenuProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export default function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate();
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "Cuenta";
  const firstInitial = firstName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-auto rounded-[1.35rem] border-border/70 bg-white px-3 py-2 shadow-[0_12px_24px_-20px_rgba(31,36,80,0.4)]"
          />
        }
      >
        <span className="flex items-center gap-3 text-left">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-sm font-bold text-primary">
            {firstInitial}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Mi cuenta
            </span>
            <span className="block max-w-28 truncate text-sm font-semibold text-foreground">Hola, {firstName}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64 rounded-[1.5rem] border-border/70 bg-card p-1">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="rounded-[1rem] bg-secondary/45 px-3 py-3">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-primary uppercase">Tu cuenta</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="rounded-[1rem]"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({
                      to: AUTH_ENTRY_PATH,
                    });
                  },
                },
              });
            }}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

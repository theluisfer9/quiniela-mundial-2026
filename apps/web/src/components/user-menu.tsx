import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
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
import { useMutation } from "convex/react";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

import { AUTH_ENTRY_PATH } from "@/lib/navigation";
import { clearPlayerSession, type StoredPlayerSession } from "@/lib/player-session";

type UserMenuProps = {
  playerSession: StoredPlayerSession;
  onPlayerSessionCleared: () => void;
};

export default function UserMenu({ playerSession, onPlayerSessionCleared }: UserMenuProps) {
  const navigate = useNavigate();
  const logoutPlayer = useMutation(api.players.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const firstName = playerSession.displayName.trim().split(/\s+/)[0] || "Jugador";
  const firstInitial = firstName.charAt(0).toUpperCase();

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      if (playerSession.sessionToken) {
        await logoutPlayer({ sessionToken: playerSession.sessionToken });
      }
    } catch (error) {
      console.warn("No pudimos cerrar la sesión remota del jugador.", error);
    } finally {
      clearPlayerSession();
      onPlayerSessionCleared();
      try {
        await navigate({ to: AUTH_ENTRY_PATH });
      } catch (error) {
        console.warn("No pudimos navegar al inicio después de cambiar jugador.", error);
        setIsLoggingOut(false);
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            disabled={isLoggingOut}
            className="h-auto w-full justify-between rounded-[1.35rem] border-border/70 bg-white px-3 py-2 shadow-[0_12px_24px_-20px_rgba(31,36,80,0.4)] sm:w-auto"
          />
        }
      >
        <span className="flex w-full items-center gap-3 text-left sm:w-auto">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-sm font-bold text-primary">
            {firstInitial}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Mi jugador
            </span>
            <span className="block max-w-28 truncate text-sm font-semibold text-foreground">Hola, {firstName}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64 rounded-[1.5rem] border-border/70 bg-card p-1">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="rounded-[1rem] bg-secondary/45 px-3 py-3">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-primary uppercase">Jugador guardado</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{playerSession.displayName}</p>
            <p className="text-xs text-muted-foreground">Se validara al abrir Pronósticos.</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isLoggingOut}
            className="rounded-[1rem]"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
            {isLoggingOut ? "Cambiando..." : "Cambiar jugador"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

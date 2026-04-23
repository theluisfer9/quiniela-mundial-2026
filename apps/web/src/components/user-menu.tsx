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
import { useQuery } from "convex/react";

import { authClient } from "@/lib/auth-client";
import { AUTH_ENTRY_PATH } from "@/lib/navigation";

export default function UserMenu() {
  const navigate = useNavigate();
  const user = useQuery(api.auth.getCurrentUser);
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "Cuenta";

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Hola, {firstName}</DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tu cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="block cursor-default focus:bg-transparent focus:text-foreground">
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
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
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

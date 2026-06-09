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
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { BarChart3, BookOpenText, ChevronDown, ClipboardList, Home, LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import { AUTH_ENTRY_PATH } from "@/lib/navigation";
import { useI18n } from "@/lib/i18n";
import { clearPlayerSession, type StoredPlayerSession } from "@/lib/player-session";

type UserMenuProps = {
  playerSession: StoredPlayerSession;
  onPlayerSessionCleared: () => void;
};

export default function UserMenu({ playerSession, onPlayerSessionCleared }: UserMenuProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const logoutPlayer = useMutation(api.players.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const firstName = playerSession.displayName.trim().split(/\s+/)[0] || t.common.playerFallback;
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
      console.warn(t.errors.remoteLogout, error);
    } finally {
      clearPlayerSession();
      onPlayerSessionCleared();
      try {
        await navigate({ to: AUTH_ENTRY_PATH });
      } catch (error) {
        console.warn(t.errors.navigateAfterLogout, error);
        setIsLoggingOut(false);
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            disabled={isLoggingOut}
            className="min-h-10 w-auto justify-between rounded-[1rem] border border-[#2A398D]/18 bg-[#2A398D]/10 px-2 py-0 text-[#1f2f78] shadow-[0_12px_24px_-20px_rgba(42,57,141,0.6)] ring-1 ring-[#2A398D]/18 hover:bg-[#2A398D]/14 hover:text-[#1f2f78] aria-expanded:bg-[#2A398D]/14 aria-expanded:text-[#1f2f78] sm:min-h-11 sm:min-w-[10rem] sm:px-3"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2 text-left sm:gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.85rem] bg-[#2A398D] text-white shadow-[0_10px_20px_-14px_rgba(42,57,141,0.9)] sm:hidden">
            <UserRound className="size-4" />
          </span>
          <span className="hidden size-8 shrink-0 items-center justify-center rounded-[0.85rem] bg-[#2A398D] text-sm font-bold text-white shadow-[0_10px_20px_-14px_rgba(42,57,141,0.9)] sm:flex">
            {firstInitial}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="hidden text-[0.64rem] font-semibold tracking-[0.12em] text-[#2A398D]/70 uppercase sm:block">
              {t.nav.playerMenu}
            </span>
            <span className="block max-w-[4.75rem] truncate text-sm font-semibold leading-tight text-[#1f2f78] sm:max-w-24">{firstName}</span>
          </span>
          <span className="rounded-full bg-white/65 px-2 py-0.5 text-[0.64rem] font-bold tracking-[0.12em] text-[#2A398D]/75 uppercase ring-1 ring-[#2A398D]/10 sm:hidden">
            {t.nav.menu}
          </span>
          <ChevronDown className="size-4 text-[#2A398D]/70" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-[1.35rem] border-border/70 bg-card p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 rounded-[1rem] px-2.5 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2A398D]/10 text-[#2A398D] ring-1 ring-[#2A398D]/15">
              <UserRound className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{t.nav.player}</span>
              <span className="block truncate text-sm font-semibold text-foreground">{playerSession.displayName}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link to="/" />} className="rounded-[1rem] sm:hidden">
            <Home className="size-4" />
            {t.common.home}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/dashboard" />} className="rounded-[1rem] sm:hidden">
            <BarChart3 className="size-4" />
            {t.common.dashboard}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/manual" />} className="rounded-[1rem] sm:hidden">
            <BookOpenText className="size-4" />
            {t.common.manual}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuItem render={<Link to="/pronosticos" search={{ match: undefined }} />} className="rounded-[1rem]">
            <ClipboardList className="size-4" />
            {t.common.myMatches}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isLoggingOut}
            className="rounded-[1rem]"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
            {isLoggingOut ? t.nav.loggingOut : t.nav.logout}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

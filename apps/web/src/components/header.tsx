import { Link } from "@tanstack/react-router";
import { LogIn, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import UserMenu from "@/components/user-menu";
import {
  AUTH_ENTRY_PATH,
  PRIMARY_NAV_ITEMS,
  getHeaderAccountAffordance,
  getHeaderAccountState,
  shouldShowPrimaryNav,
} from "@/lib/navigation";
import {
  getStoredPlayerSession,
  subscribeToPlayerSessionChanges,
  type StoredPlayerSession,
} from "@/lib/player-session";

export default function Header() {
  const [storedSession, setStoredSession] = useState<StoredPlayerSession | null>(() => getStoredPlayerSession());
  const accountState = getHeaderAccountState(storedSession);
  const showPrimaryNav = shouldShowPrimaryNav(accountState);
  const accountAffordance = getHeaderAccountAffordance(accountState, storedSession?.displayName);

  useEffect(() => {
    function refreshStoredSession() {
      setStoredSession(getStoredPlayerSession());
    }

    refreshStoredSession();
    const unsubscribeFromPlayerSessionChanges = subscribeToPlayerSessionChanges(refreshStoredSession);
    window.addEventListener("storage", refreshStoredSession);
    window.addEventListener("focus", refreshStoredSession);

    return () => {
      unsubscribeFromPlayerSessionChanges();
      window.removeEventListener("storage", refreshStoredSession);
      window.removeEventListener("focus", refreshStoredSession);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-border/45 bg-background/92 backdrop-blur sm:-mx-6 lg:-mx-8">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/88 p-1.5 shadow-[0_12px_36px_-28px_rgba(42,57,141,0.55)] backdrop-blur sm:rounded-[1.75rem] sm:p-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-3 rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(230,29,37,0.1),rgba(42,57,141,0.07)_48%,rgba(60,172,59,0.1))] px-3 py-2.5 transition-transform hover:-translate-y-0.5 sm:rounded-[1.35rem] sm:py-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground shadow-[0_12px_28px_-18px_rgba(230,29,37,0.9)]">
                <Trophy className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold tracking-[0.2em] text-primary uppercase">
                  Quiniela 2026
                </p>
                <p className="truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                  Pronósticos privados del Mundial
                </p>
              </div>
            </Link>

            <div className="flex flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {showPrimaryNav ? (
                <nav className="grid w-full grid-cols-2 gap-1.5 rounded-[1.1rem] bg-secondary/45 p-1 ring-1 ring-border/60 sm:min-w-[18rem] sm:gap-2 sm:rounded-[1.2rem] sm:p-1.5">
                  {PRIMARY_NAV_ITEMS.map(({ to, label }) => {
                    return (
                      <Link
                        key={to}
                        to={to}
                        activeOptions={to === "/" ? { exact: true } : undefined}
                        activeProps={{
                          className:
                            "bg-white text-foreground shadow-[0_12px_24px_-18px_rgba(31,36,80,0.55)] ring-1 ring-border/70",
                        }}
                        className="flex min-h-10 items-center justify-center rounded-[0.9rem] px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:min-h-11 sm:rounded-[1rem]"
                      >
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
              {accountState === "storedPlayer" && storedSession ? (
                <UserMenu playerSession={storedSession} onPlayerSessionCleared={() => setStoredSession(null)} />
              ) : (
                <a
                  href={`${AUTH_ENTRY_PATH}#pin-acceso`}
                  className="group inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[0.9rem] bg-primary px-3.5 text-sm font-bold text-primary-foreground shadow-[0_12px_24px_-18px_rgba(189,0,21,0.75)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_16px_28px_-20px_rgba(189,0,21,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                >
                  <LogIn className="size-4 opacity-80 transition-transform group-hover:translate-x-0.5" />
                  {accountAffordance.label}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

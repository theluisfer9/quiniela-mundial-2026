import { Link } from "@tanstack/react-router";
import { LogIn, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { LanguageToggle } from "@/components/language-toggle";
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
import { useI18n } from "@/lib/i18n";

export default function Header() {
  const { t } = useI18n();
  const [storedSession, setStoredSession] = useState<StoredPlayerSession | null>(() => getStoredPlayerSession());
  const accountState = getHeaderAccountState(storedSession);
  const showPrimaryNav = shouldShowPrimaryNav(accountState);
  const accountAffordance = getHeaderAccountAffordance(accountState, storedSession?.displayName, {
    needsPin: {
      eyebrow: t.nav.accountPinEyebrow,
      label: t.nav.accountPinLabel,
    },
    storedPlayer: {
      eyebrow: t.nav.storedPlayerEyebrow,
      label: t.nav.storedPlayerLabel,
    },
  });

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
    <header className="sticky top-0 z-20 -mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto w-full max-w-6xl px-3 py-2 sm:px-6 sm:py-4 lg:px-8">
        <div className="rounded-[1.35rem] border border-border/45 bg-background/92 p-1.5 shadow-[0_12px_36px_-28px_rgba(42,57,141,0.55)] backdrop-blur sm:rounded-[2rem] sm:p-2">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2 rounded-[1rem] bg-[linear-gradient(135deg,rgba(230,29,37,0.1),rgba(42,57,141,0.07)_48%,rgba(60,172,59,0.1))] px-2.5 py-2 sm:gap-3 sm:rounded-[1.35rem] sm:px-3 sm:py-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-primary text-primary-foreground shadow-[0_12px_28px_-18px_rgba(230,29,37,0.9)] sm:size-11 sm:rounded-[1rem]">
                <Trophy className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold tracking-[0.2em] text-primary uppercase">{t.common.appName}</p>
                <p className="hidden truncate font-display text-sm font-bold tracking-tight text-foreground sm:block sm:text-lg">
                  {t.common.brandLine}
                </p>
              </div>
            </Link>

            <div className="flex min-w-0 items-stretch gap-1.5 rounded-[1rem] bg-secondary/45 p-1 ring-1 ring-border/60 sm:w-auto sm:min-w-[30rem] sm:p-1.5 sm:items-center sm:justify-end sm:rounded-[1.35rem]">
              {showPrimaryNav ? (
                <nav className="hidden w-full grid-cols-3 gap-1.5 sm:grid sm:flex-1">
                  {PRIMARY_NAV_ITEMS.map(({ to, hash, labelKey }) => {
                    return (
                      <Link
                        key={`${to}-${hash ?? "top"}`}
                        to={to}
                        hash={hash}
                        activeOptions={to === "/" ? { exact: true } : undefined}
                        activeProps={{
                          className:
                            "bg-white text-foreground shadow-[0_12px_24px_-18px_rgba(31,36,80,0.55)] ring-1 ring-border/70",
                        }}
                        className="flex min-h-10 items-center justify-center rounded-[0.9rem] px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:min-h-11 sm:rounded-[1rem]"
                      >
                        {t.common[labelKey]}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
              <LanguageToggle />
              {accountState === "storedPlayer" && storedSession ? (
                <UserMenu playerSession={storedSession} onPlayerSessionCleared={() => setStoredSession(null)} />
              ) : (
                <a
                  href={`${AUTH_ENTRY_PATH}#pin-acceso`}
                  className="group inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[0.9rem] bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_12px_24px_-18px_rgba(189,0,21,0.75)] transition-[background-color,transform,box-shadow] hover:bg-primary/92 hover:shadow-[0_16px_28px_-20px_rgba(189,0,21,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-11 sm:w-auto sm:min-w-[9.5rem] sm:rounded-[1rem]"
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

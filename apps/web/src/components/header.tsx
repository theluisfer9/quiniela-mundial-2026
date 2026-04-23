import { Link } from "@tanstack/react-router";
import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import UserMenu from "@/components/user-menu";
import { AUTH_ENTRY_PATH, PRIMARY_NAV_ITEMS, getHeaderAccountState } from "@/lib/navigation";

export default function Header() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const accountState = getHeaderAccountState(currentUser);

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-border/70 bg-background/90 backdrop-blur sm:-mx-6 lg:-mx-8">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="min-w-0 rounded-[1.75rem] border border-border/80 bg-card/90 px-4 py-3 shadow-sm transition-colors hover:border-primary/30"
        >
          <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">Quiniela Mundial 2026</p>
          <p className="text-lg font-semibold tracking-tight text-foreground">Juega y pronostica en familia</p>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <nav className="flex items-center gap-2 rounded-full border border-border/80 bg-card/90 p-1 text-sm font-medium text-muted-foreground shadow-sm">
            {PRIMARY_NAV_ITEMS.map(({ to, label }) => {
            return (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="rounded-full px-3 py-2 transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            );
            })}
          </nav>
          {accountState === "signedIn" ? (
            <UserMenu />
          ) : accountState === "signedOut" ? (
            <Link
              to={AUTH_ENTRY_PATH}
              className="rounded-full border border-border/80 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
            >
              Entrar
            </Link>
          ) : (
            <div
              aria-hidden="true"
              className="h-10 w-24 rounded-full border border-border/60 bg-card/70 shadow-sm animate-pulse"
            />
          )}
        </div>
      </div>
    </header>
  );
}

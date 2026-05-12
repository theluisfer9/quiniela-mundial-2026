import { Link } from "@tanstack/react-router";
import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Trophy } from "lucide-react";

import UserMenu from "@/components/user-menu";
import {
  AUTH_ENTRY_PATH,
  PRIMARY_NAV_ITEMS,
  getHeaderAccountAffordance,
  getHeaderAccountState,
} from "@/lib/navigation";

export default function Header() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const accountState = getHeaderAccountState(currentUser);
  const signedInUser = currentUser && currentUser !== null ? currentUser : null;
  const accountAffordance =
    accountState === "signedIn" ? null : getHeaderAccountAffordance(accountState);

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-border/50 bg-background/92 backdrop-blur sm:-mx-6 lg:-mx-8">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="rounded-[2rem] border border-border/70 bg-white/78 p-2 shadow-[0_18px_45px_-32px_rgba(31,36,80,0.45)] backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-3 rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(230,29,37,0.08),rgba(42,57,141,0.06)_48%,rgba(60,172,59,0.1))] px-3 py-3 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-primary text-primary-foreground shadow-[0_12px_28px_-18px_rgba(230,29,37,0.9)]">
                <Trophy className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-primary uppercase">
                  Quiniela Mundial 2026
                </p>
                <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Juega el Mundial en familia
                </p>
              </div>
            </Link>

            <div className="grid gap-2 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <nav className="grid grid-cols-2 gap-2 rounded-[1.35rem] bg-secondary/60 p-1.5 ring-1 ring-border/60 sm:min-w-[18rem]">
                {PRIMARY_NAV_ITEMS.map(({ to, label }) => {
                  return (
                    <Link
                      key={to}
                      to={to}
                      activeProps={{
                        className:
                          "bg-white text-foreground shadow-[0_12px_24px_-18px_rgba(31,36,80,0.55)] ring-1 ring-border/70",
                      }}
                      className="flex min-h-11 items-center justify-center rounded-[1rem] px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
              {accountState === "signedIn" && signedInUser ? (
                <UserMenu user={signedInUser} />
              ) : accountState === "signedOut" ? (
                <Link
                  to={AUTH_ENTRY_PATH}
                  className="flex min-h-11 min-w-[11rem] flex-col items-start justify-center rounded-[1.35rem] border border-border/70 bg-white px-4 py-2 text-left shadow-[0_12px_24px_-20px_rgba(31,36,80,0.4)] transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    {accountAffordance?.eyebrow}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{accountAffordance?.label}</span>
                </Link>
              ) : (
                <div className="flex min-h-11 min-w-[11rem] flex-col items-start justify-center rounded-[1.35rem] border border-border/60 bg-white/75 px-4 py-2 shadow-sm sm:w-auto">
                  <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    {accountAffordance?.eyebrow}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{accountAffordance?.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

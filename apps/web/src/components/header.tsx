import { Link } from "@tanstack/react-router";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-border/70 bg-background/90 backdrop-blur sm:-mx-6 lg:-mx-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
            Mundial 2026
          </p>
          <p className="text-lg font-semibold tracking-tight text-foreground">Quiniela familiar</p>
        </div>
        <nav className="flex items-center gap-2 rounded-full border border-border/80 bg-card/90 p-1 text-sm font-medium text-muted-foreground shadow-sm">
          {links.map(({ to, label }) => {
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
      </div>
    </header>
  );
}

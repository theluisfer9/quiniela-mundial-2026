import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { EmptyTournament } from "@/components/home/empty-tournament";
import { HomeHero } from "@/components/home/home-hero";
import { StandingsCard } from "@/components/home/standings-card";
import { UpcomingMatches } from "@/components/home/upcoming-matches";
import { buildPredictionEntry, deriveHomeViewModel } from "@/lib/home-data";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const homeMatches = useQuery(api.matches.listHomeMatches, currentUser ? {} : "skip");
  const standings = useQuery(api.standings.getHomeStandings, currentUser ? {} : "skip");

  if (currentUser === undefined) {
    return <HomeLoadingSkeleton />;
  }

  if (currentUser === null) {
    return (
      <AppSection
        eyebrow="Quiniela familiar"
        title="Entra para ver la tabla y tus pronosticos"
        description="Inicia sesion para seguir como va la familia, revisar los cierres y encontrar rapido donde empezar a pronosticar."
      >
        <div className="flex flex-wrap gap-3">
          <Button render={<a href="/dashboard" />}>Entrar o crear cuenta</Button>
        </div>
      </AppSection>
      );
  }

  if (homeMatches === undefined || standings === undefined) {
    return <HomeLoadingSkeleton />;
  }

  const home = deriveHomeViewModel({
    currentUser,
    standings,
    matches: homeMatches,
  });

  if (home.state === "empty") {
    return <EmptyTournament currentUserName={home.currentUserName} />;
  }

  const predictionEntry = buildPredictionEntry();

  return (
    <div className="grid gap-6">
      <HomeHero home={home} ctaHref={predictionEntry.href} ctaLabel={predictionEntry.label} />
      <StandingsCard rows={home.standings} />
      <UpcomingMatches home={home} />
    </div>
  );
}

function HomeLoadingSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-[0_30px_80px_-38px_rgba(0,0,0,0.55)] sm:px-6 sm:py-7">
        <div className="space-y-4">
          <div className="h-3 w-28 animate-pulse rounded-full bg-white/20" />
          <div className="h-12 w-64 animate-pulse rounded-full bg-white/15" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-white/10" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
            <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
          </div>
        </div>
      </div>
      <div className="h-80 animate-pulse rounded-[2rem] bg-card/80 ring-1 ring-border/70" />
      <div className="h-28 animate-pulse rounded-[2rem] bg-primary/5 ring-1 ring-primary/15" />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-36 animate-pulse rounded-[2rem] bg-card/80 ring-1 ring-border/70" />
        <div className="h-36 animate-pulse rounded-[2rem] bg-card/80 ring-1 ring-border/70" />
      </div>
    </div>
  );
}

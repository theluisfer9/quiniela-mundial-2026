import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Skeleton } from "@quiniela-mundial-2026/ui/components/skeleton";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PredictionCard } from "@/components/predictions/prediction-card";
import { PredictionProgress } from "@/components/predictions/prediction-progress";
import type { HomeMatchSummary } from "@/lib/home-data";
import type { PredictionSaveState } from "@/lib/prediction-copy";

export const Route = createFileRoute("/pronosticos")({
  component: PredictionsRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    match: typeof search.match === "string" ? search.match : undefined,
  }),
});

type PredictionValue = {
  homeScore: number;
  awayScore: number;
  updatedAt: number;
};

function PredictionsRoute() {
  const { match } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const currentUser = useQuery(api.auth.getCurrentUser);
  const matches = useQuery(api.matches.listHomeMatches, currentUser ? {} : "skip");
  const predictions = useQuery(api.predictions.listMyPredictions, currentUser ? {} : "skip");
  const savePrediction = useMutation(api.predictions.upsertPrediction);
  const [now, setNow] = useState(() => Date.now());
  const [saveStateByMatchId, setSaveStateByMatchId] = useState<Record<string, PredictionSaveState>>({});
  const [predictionOverrides, setPredictionOverrides] = useState<Record<string, PredictionValue>>({});
  const inFlightSaveByMatchIdRef = useRef<Record<string, number>>({});
  const saveRequestSequenceRef = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const predictionByMatchId = useMemo(() => {
    const baseEntries: Array<[string, PredictionValue]> = (predictions ?? []).map((prediction) => [
      String(prediction.matchId),
      {
        homeScore: Number(prediction.homeScore),
        awayScore: Number(prediction.awayScore),
        updatedAt: prediction.updatedAt,
      },
    ]);

    return new Map<string, PredictionValue>([...baseEntries, ...Object.entries(predictionOverrides)]);
  }, [predictionOverrides, predictions]);

  const upcomingMatches = matches?.upcomingMatches ?? [];
  const focusedMatchIndex = getFocusedMatchIndex({
    upcomingMatches,
    focusedMatchId: match,
    predictionByMatchId,
  });
  const focusedMatch = upcomingMatches[focusedMatchIndex];
  const remainingCount = upcomingMatches.filter((upcomingMatch) => {
    const key = String(upcomingMatch.matchId);
    return !predictionByMatchId.has(key) && now < upcomingMatch.kickoffAt;
  }).length;

  if (currentUser === undefined) {
    return <PredictionsLoadingState />;
  }

  if (currentUser === null) {
    return (
      <AppSection
        eyebrow="Pronosticos"
        title="Entra para cargar marcadores"
        description="Inicia sesión para guardar pronósticos y revisar fechas límite."
      >
        <div className="flex flex-wrap gap-3">
          <Button render={<a href="/dashboard" />}>Entrar o crear cuenta</Button>
          <Button render={<a href="/" />} variant="outline">
            Volver al inicio
          </Button>
        </div>
      </AppSection>
    );
  }

  if (matches === undefined || predictions === undefined) {
    return <PredictionsLoadingState />;
  }

  if (!focusedMatch) {
    return (
      <AppSection
        eyebrow="Pronosticos"
        title="No hay partidos abiertos"
        description="Cuando publiquemos el siguiente bloque, podrás cargar marcadores desde aquí."
      >
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Esta pantalla muestra tus pronósticos mientras cada partido sigue abierto.</p>
          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/" />}>Volver al inicio</Button>
            <Button render={<a href="/dashboard" />} variant="outline">
              Ir al dashboard
            </Button>
          </div>
        </div>
      </AppSection>
    );
  }

  const focusedMatchId = String(focusedMatch.matchId);
  const savedPrediction = predictionByMatchId.get(focusedMatchId);
  const isLocked = now >= focusedMatch.kickoffAt;
  const status = isLocked ? "locked" : (saveStateByMatchId[focusedMatchId] ?? "idle");

  function moveToMatch(nextIndex: number) {
    const nextMatch = upcomingMatches[nextIndex];
    if (!nextMatch) {
      return;
    }

    void navigate({
      search: (prev) => ({
        ...prev,
        match: String(nextMatch.matchId),
      }),
    });
  }

  async function handleSave(scores: { homeScore: number; awayScore: number }) {
    if (isLocked) {
      setSaveStateByMatchId((current) => ({
        ...current,
        [focusedMatchId]: "locked",
      }));
      return;
    }

    if (inFlightSaveByMatchIdRef.current[focusedMatchId] !== undefined) {
      return;
    }

    const requestId = ++saveRequestSequenceRef.current;
    inFlightSaveByMatchIdRef.current[focusedMatchId] = requestId;

    setSaveStateByMatchId((current) => ({
      ...current,
      [focusedMatchId]: "saving",
    }));

    try {
      const result = await savePrediction({
        matchId: focusedMatch.matchId,
        homeScore: BigInt(scores.homeScore),
        awayScore: BigInt(scores.awayScore),
      });

      if (inFlightSaveByMatchIdRef.current[focusedMatchId] !== requestId) {
        return;
      }

      setPredictionOverrides((current) => ({
        ...current,
        [focusedMatchId]: {
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          updatedAt: result.updatedAt,
        },
      }));
      setSaveStateByMatchId((current) => ({
        ...current,
        [focusedMatchId]: "saved",
      }));
    } catch (error) {
      if (inFlightSaveByMatchIdRef.current[focusedMatchId] !== requestId) {
        return;
      }

      const nextState = error instanceof Error && error.message.includes("Match is locked") ? "locked" : "error";
      setSaveStateByMatchId((current) => ({
        ...current,
        [focusedMatchId]: nextState,
      }));
    } finally {
      if (inFlightSaveByMatchIdRef.current[focusedMatchId] === requestId) {
        delete inFlightSaveByMatchIdRef.current[focusedMatchId];
      }
    }
  }

  return (
    <AppSection
      eyebrow="Pronosticos"
      title="Carga tus marcadores"
      description="Avanza partido por partido. Guardamos cada marcador cuando está completo."
      action={<Button render={<a href="/" />} variant="outline">Volver al inicio</Button>}
    >
      <div className="space-y-4">
        <PredictionProgress
          currentIndex={focusedMatchIndex}
          hasNext={focusedMatchIndex < upcomingMatches.length - 1}
          hasPrevious={focusedMatchIndex > 0}
          isLocked={isLocked}
          remainingCount={remainingCount}
          totalCount={upcomingMatches.length}
          onNext={() => moveToMatch(focusedMatchIndex + 1)}
          onPrevious={() => moveToMatch(focusedMatchIndex - 1)}
        />

        <PredictionCard
          isLocked={isLocked}
          isSaving={status === "saving"}
          match={focusedMatch}
          savedScore={{
            homeScore: savedPrediction?.homeScore ?? null,
            awayScore: savedPrediction?.awayScore ?? null,
          }}
          status={status}
          onDirty={() => {
            setSaveStateByMatchId((current) => ({
              ...current,
              [focusedMatchId]: "idle",
            }));
          }}
          onSave={handleSave}
        />
      </div>
    </AppSection>
  );
}

function PredictionsLoadingState() {
  return (
    <AppSection
      eyebrow="Pronosticos"
      title="Cargando partidos"
      description="Estamos preparando tus próximos cierres y marcadores guardados."
    >
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-[2rem]" />
        <Skeleton className="h-[32rem] rounded-[2rem]" />
      </div>
    </AppSection>
  );
}

function getFocusedMatchIndex({
  upcomingMatches,
  focusedMatchId,
  predictionByMatchId,
}: {
  upcomingMatches: HomeMatchSummary[];
  focusedMatchId?: string;
  predictionByMatchId: Map<string, PredictionValue>;
}) {
  if (upcomingMatches.length === 0) {
    return 0;
  }

  if (focusedMatchId) {
    const focusedIndex = upcomingMatches.findIndex((upcomingMatch) => String(upcomingMatch.matchId) === focusedMatchId);
    if (focusedIndex >= 0) {
      return focusedIndex;
    }
  }

  const firstPendingIndex = upcomingMatches.findIndex((upcomingMatch) => !predictionByMatchId.has(String(upcomingMatch.matchId)));
  return firstPendingIndex >= 0 ? firstPendingIndex : 0;
}

import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import type { Id } from "@quiniela-mundial-2026/backend/convex/_generated/dataModel";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Skeleton } from "@quiniela-mundial-2026/ui/components/skeleton";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvex, useMutation } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PinEntryForm } from "@/components/pin-entry-form";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { PredictionProgress } from "@/components/predictions/prediction-progress";
import type { HomeMatchSummary } from "@/lib/home-data";
import {
  clearPlayerSession,
  getStoredPlayerSession,
  storePlayerSession,
  type StoredPlayerSession,
} from "@/lib/player-session";
import type { PredictionSaveState } from "@/lib/prediction-copy";
import { getPredictionsAccessState } from "@/lib/predictions-access";

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

type CurrentPlayer = { displayName: string } | null | undefined;
type PrivateHomeMatchSummary = HomeMatchSummary & { matchId: Id<"matches"> };
type MatchesResult = { upcomingMatches: PrivateHomeMatchSummary[] };
type PredictionResult = Omit<PredictionValue, "homeScore" | "awayScore"> & {
  matchId: unknown;
  homeScore: bigint;
  awayScore: bigint;
};
type PrivateDataState =
  | { state: "idle" | "loading" }
  | { state: "ready"; matches: MatchesResult; predictions: PredictionResult[] }
  | { state: "error"; message: string };

const SESSION_EXPIRED_MESSAGE = "Tu sesion vencio. Ingresa tu PIN de nuevo.";
const LOAD_ERROR_MESSAGE = "No pudimos cargar tus pronosticos. Revisa tu conexion e intenta de nuevo.";

function isNotAuthenticatedError(error: unknown) {
  return error instanceof Error && error.message.includes("Not authenticated");
}

function PredictionsRoute() {
  const { match } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const convex = useConvex();
  const loginWithPin = useMutation(api.players.loginWithPin);
  const savePrediction = useMutation(api.predictions.upsertPrediction);
  const [hasReadStoredSession, setHasReadStoredSession] = useState(false);
  const [storedSession, setStoredSession] = useState<StoredPlayerSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [privateData, setPrivateData] = useState<PrivateDataState>({ state: "idle" });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const accessState = getPredictionsAccessState({ storedSession, currentPlayer });
  const sessionToken = accessState.state === "ready" ? storedSession?.sessionToken : undefined;
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [saveStateByMatchId, setSaveStateByMatchId] = useState<Record<string, PredictionSaveState>>({});
  const [predictionOverrides, setPredictionOverrides] = useState<Record<string, PredictionValue>>({});
  const inFlightSaveByMatchIdRef = useRef<Record<string, number>>({});
  const saveRequestSequenceRef = useRef(0);

  useEffect(() => {
    setStoredSession(getStoredPlayerSession());
    setHasReadStoredSession(true);
  }, []);

  useEffect(() => {
    if (!storedSession) {
      setCurrentPlayer(undefined);
      return;
    }

    let isCurrent = true;
    setCurrentPlayer(undefined);

    void convex
      .query(api.players.getCurrentPlayer, { sessionToken: storedSession.sessionToken })
      .then((player) => {
        if (isCurrent) {
          setValidationError(null);
          setCurrentPlayer(player);
        }
      })
      .catch((error) => {
        if (!isCurrent) {
          return;
        }

        if (isNotAuthenticatedError(error)) {
          setCurrentPlayer(null);
          setValidationError(null);
          return;
        }

        setCurrentPlayer(undefined);
        setValidationError("No pudimos validar tu PIN guardado. Revisa tu conexion e intenta de nuevo.");
      });

    return () => {
      isCurrent = false;
    };
  }, [convex, storedSession, validationAttempt]);

  useEffect(() => {
    if (accessState.state !== "invalidSession") {
      return;
    }

    clearPlayerSession();
    setStoredSession(null);
    setPinError(SESSION_EXPIRED_MESSAGE);
  }, [accessState.state]);

  useEffect(() => {
    if (!sessionToken) {
      setPrivateData({ state: "idle" });
      return;
    }

    let isCurrent = true;
    setPrivateData({ state: "loading" });

    void Promise.all([
      convex.query(api.matches.listHomeMatches, { sessionToken }),
      convex.query(api.predictions.listMyPredictions, { sessionToken }),
    ])
      .then(([nextMatches, nextPredictions]) => {
        if (isCurrent) {
          setPrivateData({ state: "ready", matches: nextMatches, predictions: nextPredictions });
        }
      })
      .catch((error) => {
        if (!isCurrent) {
          return;
        }

        if (isNotAuthenticatedError(error)) {
          clearSessionForPinEntry();
          return;
        }

        setPrivateData({ state: "error", message: LOAD_ERROR_MESSAGE });
      });

    return () => {
      isCurrent = false;
    };
  }, [convex, loadAttempt, sessionToken]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const predictionByMatchId = useMemo(() => {
    const baseEntries: Array<[string, PredictionValue]> = (
      privateData.state === "ready" ? privateData.predictions : []
    ).map((prediction) => [
      String(prediction.matchId),
      {
        homeScore: Number(prediction.homeScore),
        awayScore: Number(prediction.awayScore),
        updatedAt: prediction.updatedAt,
      },
    ]);

    return new Map<string, PredictionValue>([...baseEntries, ...Object.entries(predictionOverrides)]);
  }, [predictionOverrides, privateData]);

  const upcomingMatches = privateData.state === "ready" ? privateData.matches.upcomingMatches : [];
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

  function clearSessionForPinEntry(message = SESSION_EXPIRED_MESSAGE) {
    clearPlayerSession();
    setStoredSession(null);
    setCurrentPlayer(undefined);
    setPinError(message);
    setValidationError(null);
    setPrivateData({ state: "idle" });
    setPredictionOverrides({});
    setSaveStateByMatchId({});
  }

  async function handlePinSubmit(pin: string) {
    setPinError(null);
    setIsSubmittingPin(true);

    try {
      const result = await loginWithPin({ pin });

      if (result.status === "ok") {
        const nextSession = {
          sessionToken: result.sessionToken,
          displayName: result.player.displayName,
        };
        storePlayerSession(nextSession);
        setStoredSession(nextSession);
        setCurrentPlayer(undefined);
        setValidationError(null);
        setPrivateData({ state: "idle" });
        setPredictionOverrides({});
        setSaveStateByMatchId({});
        return;
      }

      if (result.status === "invalid_pin" || result.status === "locked") {
        setPinError(result.message);
      }
    } catch {
      setPinError("No pudimos validar tu PIN. Intenta de nuevo.");
    } finally {
      setIsSubmittingPin(false);
    }
  }

  if (validationError) {
    return (
      <PredictionsRetryState
        message={validationError}
        title="No pudimos validar tu acceso"
        onRetry={() => {
          setValidationError(null);
          setValidationAttempt((attempt) => attempt + 1);
        }}
      />
    );
  }

  if (!hasReadStoredSession || accessState.state === "checking") {
    return <PredictionsLoadingState />;
  }

  if (accessState.state === "needsPin" || accessState.state === "invalidSession") {
    return (
      <AppSection
        eyebrow="Pronosticos"
        title="Ingresa tu PIN para cargar marcadores"
        description="Usa el PIN que te compartieron para guardar pronosticos y revisar fechas limite."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_auto] lg:items-start">
          <PinEntryForm
            title="Acceso de jugador"
            description="Ingresa tu PIN para cargar marcadores. La tabla publica no necesita sesion."
            headingLevel="h2"
            isSubmitting={isSubmittingPin}
            error={pinError}
            submitLabel="Cargar marcadores"
            onSubmit={handlePinSubmit}
          />
          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/" />} variant="outline">
              Volver al inicio
            </Button>
          </div>
        </div>
      </AppSection>
    );
  }

  if (privateData.state === "error") {
    return (
      <PredictionsRetryState
        message={privateData.message}
        title="No pudimos cargar tus partidos"
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }

  if (privateData.state !== "ready") {
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
    if (!sessionToken) {
      clearSessionForPinEntry();
      return;
    }

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
        sessionToken,
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

      if (isNotAuthenticatedError(error)) {
        clearSessionForPinEntry();
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
      action={
        <Button render={<a href="/" />} variant="outline">
          Volver al inicio
        </Button>
      }
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

function PredictionsRetryState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <AppSection eyebrow="Pronosticos" title={title} description={message}>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onRetry}>
          Intentar de nuevo
        </Button>
        <Button render={<a href="/" />} variant="outline">
          Volver al inicio
        </Button>
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

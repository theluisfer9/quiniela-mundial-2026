import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import type { Id } from "@quiniela-mundial-2026/backend/convex/_generated/dataModel";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Skeleton } from "@quiniela-mundial-2026/ui/components/skeleton";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvex, useMutation } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PinEntryForm } from "@/components/pin-entry-form";
import { PredictionCard, type PredictionDraftState } from "@/components/predictions/prediction-card";
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

const SESSION_EXPIRED_MESSAGE = "Vuelve a entrar con tu PIN para seguir cargando marcadores.";
const LOAD_ERROR_MESSAGE = "No pudimos cargar tus partidos. Revisa tu conexion e intenta de nuevo.";

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
  const [focusedDraftState, setFocusedDraftState] = useState<PredictionDraftState | null>(null);
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
  const nextBatchMatches = getNextBatchMatches(upcomingMatches);
  const nextBatchPendingCount = nextBatchMatches.filter((upcomingMatch) => {
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
        eyebrow="Mis partidos"
        title="Ingresa tu PIN para cargar marcadores"
        description="Entra como tu jugador para ver qué partidos tienes pendientes."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_auto] lg:items-start">
          <PinEntryForm
            title="Acceso de jugador"
            description="Usa tu PIN para abrir tus partidos y guardar marcadores."
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
        eyebrow="Mis partidos"
        title="No hay partidos abiertos"
        description="Cuando publiquemos el siguiente bloque, podrás cargar marcadores desde aquí."
      >
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Cuando haya partidos disponibles, aquí aparecerán para que pongas tus marcadores.</p>
          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/" />}>Volver al inicio</Button>
            <Button render={<a href="/" />} variant="outline">
              Ver la tabla
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
      toast.success("Marcador guardado", {
        description: `${focusedMatch.homeTeam.name} ${scores.homeScore} - ${scores.awayScore} ${focusedMatch.awayTeam.name}`,
      });
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
      toast.error(nextState === "locked" ? "Este partido ya cerró" : "No se pudo guardar", {
        description: nextState === "locked" ? "El marcador quedó en modo lectura." : "Intenta guardar de nuevo.",
      });
    } finally {
      if (inFlightSaveByMatchIdRef.current[focusedMatchId] === requestId) {
        delete inFlightSaveByMatchIdRef.current[focusedMatchId];
      }
    }
  }

  return (
    <AppSection
      eyebrow="Mis partidos"
      title="Carga tus marcadores"
      description="El flujo es simple: revisa el partido, escribe los dos goles y sigue al siguiente."
      className="px-3 py-3 sm:px-6 sm:py-6"
      contentClassName="space-y-3 sm:space-y-4"
      action={
        <Button className="rounded-[1rem]" render={<a href="/" />} variant="outline">
          Volver al inicio
        </Button>
      }
    >
      <div className="space-y-3 pb-24 sm:space-y-4 sm:pb-0">
        <div className="hidden gap-3 rounded-[1.5rem] border border-[#2A398D]/15 bg-[#2A398D]/6 p-4 text-sm text-[#1f2f78] sm:grid sm:grid-cols-3 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2A398D] text-xs font-bold text-white">1</span>
            <p><span className="font-bold">Revisa el partido.</span> Confirma equipos y hora de cierre.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2A398D] text-xs font-bold text-white">2</span>
            <p><span className="font-bold">Pon los goles.</span> Llena local y visita.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2A398D] text-xs font-bold text-white">3</span>
            <p><span className="font-bold">Guarda.</span> Presiona Guardar marcador y luego sigue al siguiente partido.</p>
          </div>
        </div>
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
          onDraftStateChange={setFocusedDraftState}
          onSave={handleSave}
        />

        <PredictionProgress
          currentIndex={focusedMatchIndex}
          hasNext={focusedMatchIndex < upcomingMatches.length - 1}
          hasPrevious={focusedMatchIndex > 0}
          nextBatchPendingCount={nextBatchPendingCount}
          nextBatchTotalCount={nextBatchMatches.length}
          totalCount={upcomingMatches.length}
          onNext={() => moveToMatch(focusedMatchIndex + 1)}
          onPrevious={() => moveToMatch(focusedMatchIndex - 1)}
        />
      </div>
      <MobilePredictionWizardNav
        canSave={focusedDraftState?.canSave ?? false}
        hasNext={focusedMatchIndex < upcomingMatches.length - 1}
        hasPrevious={focusedMatchIndex > 0}
        isSaving={status === "saving"}
        match={focusedMatch}
        sameDateMatchCount={getSameDateMatchCount(upcomingMatches, focusedMatch)}
        scores={focusedDraftState?.scores ?? null}
        statusLabel={focusedDraftState?.displayState === "saved" && focusedDraftState.draftMatchesSavedScore ? "Guardado" : undefined}
        onNext={() => moveToMatch(focusedMatchIndex + 1)}
        onPrevious={() => moveToMatch(focusedMatchIndex - 1)}
        onSave={(scores) => void handleSave(scores)}
      />
    </AppSection>
  );
}

function MobilePredictionWizardNav({
  canSave,
  hasNext,
  hasPrevious,
  isSaving,
  match,
  sameDateMatchCount,
  onNext,
  onPrevious,
  onSave,
  scores,
  statusLabel,
}: {
  canSave: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  isSaving: boolean;
  match: HomeMatchSummary;
  sameDateMatchCount: number;
  scores: { homeScore: number; awayScore: number } | null;
  statusLabel?: string;
  onPrevious: () => void;
  onNext: () => void;
  onSave: (scores: { homeScore: number; awayScore: number }) => void;
}) {
  const dateLabel = shortDateFormatter.format(match.kickoffAt);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-3 pb-[max(1.1rem,calc(0.85rem+env(safe-area-inset-bottom)))] pt-3 shadow-[0_-18px_45px_-34px_rgba(42,57,141,0.65)] backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md gap-2">
        <div className="flex items-center justify-between gap-3 px-1 text-xs font-semibold text-muted-foreground">
          <span>{`Fecha ${dateLabel}`}</span>
          <span>{`${sameDateMatchCount} partidos`}</span>
        </div>
        <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr] gap-2">
          <Button className="h-12 rounded-[1rem]" disabled={!hasPrevious || isSaving} onClick={onPrevious} type="button" variant="outline">
            Anterior
          </Button>
          <Button
            className="h-12 rounded-[1rem] text-sm font-bold"
            disabled={!canSave || !scores || isSaving}
            onClick={() => {
              if (scores) {
                onSave(scores);
              }
            }}
            type="button"
          >
            {isSaving ? "Guardando..." : statusLabel ?? "Guardar"}
          </Button>
          <Button className="h-12 rounded-[1rem]" disabled={!hasNext || isSaving} onClick={onNext} type="button" variant="outline">
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}

const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
});

function PredictionsLoadingState() {
  return (
    <AppSection
      eyebrow="Mis partidos"
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
    <AppSection eyebrow="Mis partidos" title={title} description={message}>
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

function getNextBatchMatches(upcomingMatches: HomeMatchSummary[]) {
  const nextMatch = upcomingMatches[0];

  if (!nextMatch) {
    return [];
  }

  const nextMatchDate = new Date(nextMatch.kickoffAt);
  return upcomingMatches.filter((upcomingMatch) => {
    const kickoffDate = new Date(upcomingMatch.kickoffAt);
    return (
      kickoffDate.getFullYear() === nextMatchDate.getFullYear() &&
      kickoffDate.getMonth() === nextMatchDate.getMonth() &&
      kickoffDate.getDate() === nextMatchDate.getDate()
    );
  });
}

function getSameDateMatchCount(upcomingMatches: HomeMatchSummary[], match: HomeMatchSummary) {
  const matchDate = new Date(match.kickoffAt);

  return upcomingMatches.filter((upcomingMatch) => {
    const kickoffDate = new Date(upcomingMatch.kickoffAt);
    return (
      kickoffDate.getFullYear() === matchDate.getFullYear() &&
      kickoffDate.getMonth() === matchDate.getMonth() &&
      kickoffDate.getDate() === matchDate.getDate()
    );
  }).length;
}

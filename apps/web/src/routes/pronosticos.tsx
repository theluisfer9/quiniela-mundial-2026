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
import { translatePinResultMessage, useI18n } from "@/lib/i18n";
import {
  clearPlayerSession,
  getStoredPlayerSession,
  storePlayerSession,
  type StoredPlayerSession,
} from "@/lib/player-session";
import type { PredictionSaveState } from "@/lib/prediction-copy";
import { getPredictionsAccessState } from "@/lib/predictions-access";

type PredictionsTab = "por-venir" | "historico";

export const Route = createFileRoute("/pronosticos")({
  component: PredictionsRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    match: typeof search.match === "string" ? search.match : undefined,
    tab: getSearchTab(search.tab),
  }),
});

type PredictionValue = {
  homeScore: number;
  awayScore: number;
  updatedAt: number;
};

type CurrentPlayer = { displayName: string } | null | undefined;
type PrivateHomeMatchSummary = HomeMatchSummary & { matchId: Id<"matches"> };
type MatchesResult = {
  upcomingMatches: PrivateHomeMatchSummary[];
  historicalMatches?: PrivateHomeMatchSummary[];
};
type PredictionResult = Omit<PredictionValue, "homeScore" | "awayScore"> & {
  matchId: unknown;
  homeScore: bigint;
  awayScore: bigint;
};
type PrivateDataState =
  | { state: "idle" | "loading" }
  | { state: "ready"; matches: MatchesResult; predictions: PredictionResult[] }
  | { state: "error"; message: string };

function getSearchTab(tab: unknown): PredictionsTab | undefined {
  if (tab === "historico" || tab === "por-venir") {
    return tab;
  }

  return undefined;
}

function isNotAuthenticatedError(error: unknown) {
  return error instanceof Error && error.message.includes("Not authenticated");
}

function PredictionsRoute() {
  const { t } = useI18n();
  const { match, tab } = Route.useSearch();
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
        setValidationError(t.errors.validateStoredPin);
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
    setPinError(t.errors.sessionExpired);
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

        setPrivateData({ state: "error", message: t.errors.loadMatches });
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
  const historicalMatches = privateData.state === "ready" ? (privateData.matches.historicalMatches ?? []) : [];
  const activeTab = getActiveTab({
    requestedTab: tab,
    focusedMatchId: match,
    upcomingMatches,
    historicalMatches,
  });
  const visibleMatches = activeTab === "historico" ? historicalMatches : upcomingMatches;
  const focusedMatchIndex = getFocusedMatchIndex({
    matches: visibleMatches,
    focusedMatchId: match,
    predictionByMatchId,
  });
  const focusedMatch = visibleMatches[focusedMatchIndex];
  const nextBatchMatches = getNextBatchMatches(visibleMatches);
  const nextBatchPendingCount = nextBatchMatches.filter((upcomingMatch) => {
    const key = String(upcomingMatch.matchId);
    return !predictionByMatchId.has(key) && now < upcomingMatch.kickoffAt;
  }).length;
  function clearSessionForPinEntry(message = t.errors.sessionExpired) {
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
        setPinError(translatePinResultMessage(result.message, t));
      }
    } catch {
      setPinError(t.errors.validatePin);
    } finally {
      setIsSubmittingPin(false);
    }
  }

  if (validationError) {
    return (
      <PredictionsRetryState
        message={validationError}
        title={t.predictions.validationTitle}
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
        eyebrow={t.predictions.sectionEyebrow}
        title={t.predictions.pinTitle}
        description={t.predictions.pinDescription}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_auto] lg:items-start">
          <PinEntryForm
            title={t.predictions.pinCardTitle}
            description={t.predictions.pinCardDescription}
            headingLevel="h2"
            isSubmitting={isSubmittingPin}
            error={pinError}
            submitLabel={t.predictions.pinSubmit}
            onSubmit={handlePinSubmit}
          />
          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/" />} variant="outline">
              {t.common.backHome}
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
        title={t.predictions.loadErrorTitle}
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
        eyebrow={t.predictions.sectionEyebrow}
        title={t.predictions.emptyTitle}
        description={t.predictions.emptyDescription}
      >
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>{t.predictions.emptyBody}</p>
          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/" />}>{t.common.backHome}</Button>
            <Button render={<a href="/" />} variant="outline">
              {t.predictions.viewStandings}
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
    const nextMatch = visibleMatches[nextIndex];
    if (!nextMatch) {
      return;
    }

    void navigate({
      search: (prev) => ({
        ...prev,
        match: String(nextMatch.matchId),
        tab: activeTab,
      }),
    });
  }

  function changeTab(nextTab: PredictionsTab) {
    const nextMatches = nextTab === "historico" ? historicalMatches : upcomingMatches;

    void navigate({
      search: (prev) => ({
        ...prev,
        match: nextMatches[0] ? String(nextMatches[0].matchId) : undefined,
        tab: nextTab,
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
      toast.success(t.predictions.scoreSavedToast, {
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
      toast.error(nextState === "locked" ? t.predictions.matchLockedToast : t.predictions.saveErrorToast, {
        description: nextState === "locked" ? t.predictions.lockedDescription : t.predictions.saveAgainDescription,
      });
    } finally {
      if (inFlightSaveByMatchIdRef.current[focusedMatchId] === requestId) {
        delete inFlightSaveByMatchIdRef.current[focusedMatchId];
      }
    }
  }

  return (
    <AppSection
      eyebrow={t.predictions.sectionEyebrow}
      title={activeTab === "historico" ? t.predictions.historyTitle : t.predictions.mainTitle}
      description={
        activeTab === "historico"
          ? t.predictions.historyDescription
          : t.predictions.mainDescription
      }
      className="px-3 py-3 sm:px-6 sm:py-6"
      contentClassName="space-y-3 sm:space-y-4"
      action={
        <Button className="rounded-[1rem]" render={<a href="/" />} variant="outline">
          {t.common.backHome}
        </Button>
      }
    >
      <div className="space-y-3 pb-24 sm:space-y-4 sm:pb-0">
        <PredictionTabs
          activeTab={activeTab}
          historicalCount={historicalMatches.length}
          upcomingCount={upcomingMatches.length}
          onChange={changeTab}
        />

        {activeTab === "por-venir" ? (
          <div className="hidden gap-3 rounded-[1.5rem] border border-[#2A398D]/15 bg-[#2A398D]/6 p-4 text-sm text-[#1f2f78] sm:grid sm:grid-cols-3 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2A398D] text-xs font-bold text-white">1</span>
              <p><span className="font-bold">{t.predictions.step1Title}</span> {t.predictions.step1Body}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2A398D] text-xs font-bold text-white">2</span>
              <p><span className="font-bold">{t.predictions.step2Title}</span> {t.predictions.step2Body}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2A398D] text-xs font-bold text-white">3</span>
              <p><span className="font-bold">{t.predictions.step3Title}</span> {t.predictions.step3Body}</p>
            </div>
          </div>
        ) : null}
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
          hasNext={focusedMatchIndex < visibleMatches.length - 1}
          hasPrevious={focusedMatchIndex > 0}
          nextBatchPendingCount={nextBatchPendingCount}
          nextBatchTotalCount={nextBatchMatches.length}
          totalCount={visibleMatches.length}
          onNext={() => moveToMatch(focusedMatchIndex + 1)}
          onPrevious={() => moveToMatch(focusedMatchIndex - 1)}
        />
      </div>
      <MobilePredictionWizardNav
        canSave={focusedDraftState?.canSave ?? false}
        hasNext={focusedMatchIndex < visibleMatches.length - 1}
        hasPrevious={focusedMatchIndex > 0}
        isSaving={status === "saving"}
        match={focusedMatch}
        sameDateMatchCount={getSameDateMatchCount(visibleMatches, focusedMatch)}
        scores={focusedDraftState?.scores ?? null}
        statusLabel={focusedDraftState?.displayState === "saved" && focusedDraftState.draftMatchesSavedScore ? t.common.saved : undefined}
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
  const { dateLocale, t } = useI18n();
  const shortDateFormatter = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
  });
  const dateLabel = shortDateFormatter.format(match.kickoffAt);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-3 pb-[max(1.1rem,calc(0.85rem+env(safe-area-inset-bottom)))] pt-3 shadow-[0_-18px_45px_-34px_rgba(42,57,141,0.65)] backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md gap-2">
        <div className="flex items-center justify-between gap-3 px-1 text-xs font-semibold text-muted-foreground">
          <span>{t.predictions.mobileDate(dateLabel)}</span>
          <span>{t.predictions.matchCount(sameDateMatchCount)}</span>
        </div>
        <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr] gap-2">
          <Button className="h-12 rounded-[1rem]" disabled={!hasPrevious || isSaving} onClick={onPrevious} type="button" variant="outline">
            {t.common.previous}
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
            {isSaving ? t.common.saving : statusLabel ?? t.common.save}
          </Button>
          <Button className="h-12 rounded-[1rem]" disabled={!hasNext || isSaving} onClick={onNext} type="button" variant="outline">
            {t.common.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PredictionTabs({
  activeTab,
  historicalCount,
  upcomingCount,
  onChange,
}: {
  activeTab: PredictionsTab;
  historicalCount: number;
  upcomingCount: number;
  onChange: (tab: PredictionsTab) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-2 rounded-[1.2rem] border border-border/70 bg-muted/35 p-1.5">
      <button
        type="button"
        className={getTabClassName(activeTab === "por-venir")}
        aria-pressed={activeTab === "por-venir"}
        onClick={() => onChange("por-venir")}
      >
        <span>{t.predictions.upcomingTab}</span>
        <span className="rounded-full bg-current/10 px-2 py-0.5 text-[0.7rem] font-bold">{upcomingCount}</span>
      </button>
      <button
        type="button"
        className={getTabClassName(activeTab === "historico")}
        aria-pressed={activeTab === "historico"}
        onClick={() => onChange("historico")}
      >
        <span>{t.predictions.historyTab}</span>
        <span className="rounded-full bg-current/10 px-2 py-0.5 text-[0.7rem] font-bold">{historicalCount}</span>
      </button>
    </div>
  );
}

function getTabClassName(isActive: boolean) {
  return [
    "flex min-h-11 items-center justify-center gap-2 rounded-[0.9rem] px-3 text-sm font-bold transition",
    isActive
      ? "bg-background text-foreground shadow-[0_10px_28px_-24px_rgba(42,57,141,0.8)]"
      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
  ].join(" ");
}

function PredictionsLoadingState() {
  const { t } = useI18n();

  return (
    <AppSection
      eyebrow={t.predictions.sectionEyebrow}
      title={t.predictions.loadingTitle}
      description={t.predictions.loadingDescription}
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
  const { t } = useI18n();

  return (
    <AppSection eyebrow={t.predictions.sectionEyebrow} title={title} description={message}>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onRetry}>
          {t.common.retry}
        </Button>
        <Button render={<a href="/" />} variant="outline">
          {t.common.backHome}
        </Button>
      </div>
    </AppSection>
  );
}

function getActiveTab({
  requestedTab,
  focusedMatchId,
  upcomingMatches,
  historicalMatches,
}: {
  requestedTab?: PredictionsTab;
  focusedMatchId?: string;
  upcomingMatches: HomeMatchSummary[];
  historicalMatches: HomeMatchSummary[];
}): PredictionsTab {
  if (focusedMatchId) {
    if (historicalMatches.some((historicalMatch) => String(historicalMatch.matchId) === focusedMatchId)) {
      return "historico";
    }

    if (upcomingMatches.some((upcomingMatch) => String(upcomingMatch.matchId) === focusedMatchId)) {
      return "por-venir";
    }
  }

  if (requestedTab === "historico" && historicalMatches.length > 0) {
    return "historico";
  }

  if (upcomingMatches.length === 0 && historicalMatches.length > 0) {
    return "historico";
  }

  return "por-venir";
}

function getFocusedMatchIndex({
  matches,
  focusedMatchId,
  predictionByMatchId,
}: {
  matches: HomeMatchSummary[];
  focusedMatchId?: string;
  predictionByMatchId: Map<string, PredictionValue>;
}) {
  if (matches.length === 0) {
    return 0;
  }

  if (focusedMatchId) {
    const focusedIndex = matches.findIndex((upcomingMatch) => String(upcomingMatch.matchId) === focusedMatchId);
    if (focusedIndex >= 0) {
      return focusedIndex;
    }
  }

  const firstPendingIndex = matches.findIndex((upcomingMatch) => !predictionByMatchId.has(String(upcomingMatch.matchId)));
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

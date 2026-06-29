import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import type { Id } from "@quiniela-mundial-2026/backend/convex/_generated/dataModel";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useConvex, useMutation } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PinEntryForm } from "@/components/pin-entry-form";
import { useI18n } from "@/lib/i18n";
import {
  clearOperatorSession,
  getStoredOperatorSession,
  storeOperatorSession,
  type StoredOperatorSession,
} from "@/lib/operator-session";

export const Route = createFileRoute("/marcadores")({
  component: ScoreManagerRoute,
});

type ManageableMatch = {
  matchId: Id<"matches">;
  kickoffAt: number;
  stageLabel: string;
  matchNumber?: number;
  status: "scheduled" | "live" | "finished";
  homeTeam: { id: Id<"teams">; code: string; name: string; flagEmoji?: string };
  awayTeam: { id: Id<"teams">; code: string; name: string; flagEmoji?: string };
  homeScore?: number;
  awayScore?: number;
  winnerTeam?: { id: Id<"teams">; code: string; name: string; flagEmoji?: string };
  advancementMethod?: "regularTime" | "extraTime" | "penalties";
};

type OperatorMatchVote = {
  playerName: string;
  hasPrediction: boolean;
  homeScore?: bigint;
  awayScore?: bigint;
  updatedAt?: number;
};

type OperatorMatchVotes = {
  matchId: Id<"matches">;
  kickoffAt: number;
  stageLabel: string;
  status: "scheduled" | "live" | "finished";
  homeTeamName: string;
  awayTeamName: string;
  totalPlayers: number;
  votedCount: number;
  votes: OperatorMatchVote[];
};

type ScoreDraft = {
  homeScore: string;
  awayScore: string;
  winnerTeamId: string;
  advancementMethod: "extraTime" | "penalties";
};

type OperatorTab = "scores" | "votes";

type DataState =
  | { state: "idle" | "loading" }
  | { state: "ready"; matches: ManageableMatch[]; voteMatches: OperatorMatchVotes[] }
  | { state: "error"; message: string };

function isKnockoutMatch(match: ManageableMatch) {
  return (match.matchNumber ?? 0) >= 73;
}

function createScoreDraft(match: ManageableMatch): ScoreDraft {
  return {
    awayScore: String(match.awayScore ?? 0),
    homeScore: String(match.homeScore ?? 0),
    winnerTeamId: String(match.winnerTeam?.id ?? match.homeTeam.id),
    advancementMethod: match.advancementMethod === "extraTime" ? "extraTime" : "penalties",
  };
}

function buildScoreDrafts(matches: ManageableMatch[]) {
  return Object.fromEntries(matches.map((match) => [String(match.matchId), createScoreDraft(match)]));
}

function ScoreManagerRoute() {
  const { t } = useI18n();
  const convex = useConvex();
  const loginWithPin = useMutation(api.players.loginWithPin);
  const updateScore = useMutation(api.matches.updateMatchScoreWithOperatorSession);
  const [session, setSession] = useState<StoredOperatorSession | null>(() => getStoredOperatorSession());
  const [data, setData] = useState<DataState>({ state: "idle" });
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [activeTab, setActiveTab] = useState<OperatorTab>("scores");

  async function loadOperatorData(sessionToken: string) {
    const [manageableResult, votesResult] = await Promise.all([
      convex.query(api.matches.listManageableMatches, { sessionToken }),
      convex.query(api.predictions.listOperatorMatchVotes, { sessionToken }),
    ]);

    return { manageableResult, votesResult };
  }

  useEffect(() => {
    if (!session) {
      setData({ state: "idle" });
      return;
    }

    let isCurrent = true;
    setData({ state: "loading" });

    void loadOperatorData(session.sessionToken)
      .then(({ manageableResult, votesResult }) => {
        if (!isCurrent) {
          return;
        }

        setData({ state: "ready", matches: manageableResult.matches, voteMatches: votesResult.matches });
        setDrafts(buildScoreDrafts(manageableResult.matches));
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        clearOperatorSession();
        setSession(null);
        setData({ state: "idle" });
        setPinError("Vuelve a entrar con el PIN de operador.");
      });

    return () => {
      isCurrent = false;
    };
  }, [convex, session]);

  async function handlePinSubmit(pin: string) {
    setPinError(null);
    setIsSubmittingPin(true);

    try {
      const result = await loginWithPin({ pin });
      if (result.status === "ok_operator") {
        const nextSession = {
          displayName: result.operator.displayName,
          sessionToken: result.sessionToken,
        };
        storeOperatorSession(nextSession);
        setSession(nextSession);
        return;
      }

      setPinError("Este PIN no tiene permiso para administrar marcadores.");
    } catch {
      setPinError(t.errors.validatePin);
    } finally {
      setIsSubmittingPin(false);
    }
  }

  async function handleSave(match: ManageableMatch, status: "live" | "finished") {
    if (!session) {
      return;
    }

    const draft = drafts[String(match.matchId)];
    const homeScore = Number(draft?.homeScore);
    const awayScore = Number(draft?.awayScore);
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      toast.error("Revisa el marcador", { description: "Los goles deben ser números enteros de 0 en adelante." });
      return;
    }

    const isTiedKnockoutFinished = status === "finished" && isKnockoutMatch(match) && homeScore === awayScore;
    const winnerTeamId = isTiedKnockoutFinished ? draft?.winnerTeamId : undefined;
    const advancementMethod = isTiedKnockoutFinished ? draft?.advancementMethod : undefined;
    if (isTiedKnockoutFinished && (!winnerTeamId || (winnerTeamId !== String(match.homeTeam.id) && winnerTeamId !== String(match.awayTeam.id)))) {
      toast.error("Elegí quién avanza", { description: "En eliminatoria empatada, el marcador de 90' queda igual pero hay que guardar el equipo que pasa." });
      return;
    }

    if (status === "finished") {
      const advancementLabel = isTiedKnockoutFinished
        ? ` Avanza ${winnerTeamId === String(match.homeTeam.id) ? match.homeTeam.name : match.awayTeam.name} por ${advancementMethod === "extraTime" ? "tiempo extra" : "penales"}.`
        : "";
      const confirmed = window.confirm(
        `¿Finalizar ${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name}?${advancementLabel} Ya no aparecerá para edición en vivo.`,
      );

      if (!confirmed) {
        return;
      }
    }

    setSavingMatchId(String(match.matchId));
    try {
      await updateScore({
        awayScore,
        homeScore,
        matchId: match.matchId,
        sessionToken: session.sessionToken,
        status,
        ...(isTiedKnockoutFinished
          ? {
              winnerTeamId: winnerTeamId as Id<"teams">,
              advancementMethod,
            }
          : {}),
      });
      const { manageableResult, votesResult } = await loadOperatorData(session.sessionToken);
      setData({ state: "ready", matches: manageableResult.matches, voteMatches: votesResult.matches });
      setDrafts(buildScoreDrafts(manageableResult.matches));
      toast.success(status === "finished" ? "Partido finalizado" : "Marcador en vivo guardado", {
        description: `${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name}`,
      });
    } catch {
      toast.error("No se pudo guardar el marcador", { description: "Intenta de nuevo en unos segundos." });
    } finally {
      setSavingMatchId(null);
    }
  }

  if (!session) {
    return (
      <AppSection
        eyebrow="Operador"
        title="Administra marcadores en vivo."
        description="Entra con el PIN de operador. Solo podrás editar partidos que el cron ya marcó como en vivo."
      >
        <PinEntryForm
          title="PIN de operador"
          description="Este acceso es separado del PIN de jugador."
          error={pinError}
          isSubmitting={isSubmittingPin}
          submitLabel="Entrar a marcadores"
          onSubmit={handlePinSubmit}
        />
      </AppSection>
    );
  }

  return (
    <AppSection
      eyebrow="Operador"
      title="Panel de operador"
      description={`Sesión de ${session.displayName}. Actualiza partidos en vivo o revisa votos cargados por partido.`}
      action={
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearOperatorSession();
            setSession(null);
          }}
        >
          Salir
        </Button>
      }
    >
      <div className="grid min-w-0 grid-cols-2 gap-2 rounded-[1.15rem] bg-muted p-1">
        <TabButton active={activeTab === "scores"} onClick={() => setActiveTab("scores")}>Marcadores en vivo</TabButton>
        <TabButton active={activeTab === "votes"} onClick={() => setActiveTab("votes")}>Votos por partido</TabButton>
      </div>
      {data.state === "loading" ? (
        <p className="rounded-[1.25rem] border border-border/70 bg-card/90 px-4 py-4 text-sm text-muted-foreground">Cargando panel de operador...</p>
      ) : null}
      {data.state === "error" ? (
        <p className="rounded-[1.25rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive">{data.message}</p>
      ) : null}
      {activeTab === "scores" && data.state === "ready" && data.matches.length === 0 ? (
        <p className="rounded-[1.25rem] border border-border/70 bg-card/90 px-4 py-4 text-sm text-muted-foreground">No hay partidos en vivo para editar.</p>
      ) : null}
      {activeTab === "scores" && data.state === "ready" && data.matches.length > 0 ? (
        <div className="grid gap-4">
          {data.matches.map((match) => {
            const key = String(match.matchId);
            const draft = drafts[key] ?? createScoreDraft(match);
            const isSaving = savingMatchId === key;
            const draftHomeScore = Number(draft.homeScore);
            const draftAwayScore = Number(draft.awayScore);
            const showAdvancement = isKnockoutMatch(match) && Number.isInteger(draftHomeScore) && Number.isInteger(draftAwayScore) && draftHomeScore === draftAwayScore;

            return (
              <article key={key} className="min-w-0 overflow-hidden rounded-[1.35rem] border border-[#2A398D]/14 bg-card/95 p-3 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.45)] sm:rounded-[1.5rem] sm:p-5">
                <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-black tracking-[0.2em] text-[#2A398D]/72 uppercase">{match.stageLabel}</p>
                    <h2 className="mt-1 break-words font-display text-xl font-extrabold leading-tight tracking-[-0.04em] text-foreground sm:text-2xl">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </h2>
                  </div>
                  <span className="w-fit rounded-full bg-[#18a058]/12 px-3 py-1 text-xs font-black tracking-[0.14em] text-[#08783a] uppercase">En vivo</span>
                </div>
                <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                  <ScoreBox
                    label={match.homeTeam.name}
                    value={draft.homeScore}
                    onChange={(value) => setDrafts((current) => ({ ...current, [key]: { ...draft, homeScore: value } }))}
                  />
                  <span className="justify-self-center rounded-full bg-muted px-3 py-1 text-xs font-black tracking-[0.16em] text-muted-foreground uppercase sm:bg-transparent sm:px-0 sm:pb-3 sm:text-sm sm:tracking-normal sm:lowercase">vs</span>
                  <ScoreBox
                    label={match.awayTeam.name}
                    value={draft.awayScore}
                    onChange={(value) => setDrafts((current) => ({ ...current, [key]: { ...draft, awayScore: value } }))}
                  />
                </div>
                {showAdvancement ? (
                  <div className="mt-4 grid gap-3 rounded-[1rem] border border-[#2A398D]/14 bg-[#2A398D]/5 p-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-black tracking-[0.16em] text-muted-foreground uppercase">Avanza</span>
                      <select
                        className="min-h-11 rounded-[0.9rem] border border-border/80 bg-background px-3 text-sm font-bold text-foreground outline-none focus:border-[#2A398D] focus:ring-2 focus:ring-[#2A398D]/20"
                        value={draft.winnerTeamId}
                        onChange={(event) => setDrafts((current) => ({ ...current, [key]: { ...draft, winnerTeamId: event.target.value } }))}
                      >
                        <option value={String(match.homeTeam.id)}>{match.homeTeam.name}</option>
                        <option value={String(match.awayTeam.id)}>{match.awayTeam.name}</option>
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-black tracking-[0.16em] text-muted-foreground uppercase">Definición</span>
                      <select
                        className="min-h-11 rounded-[0.9rem] border border-border/80 bg-background px-3 text-sm font-bold text-foreground outline-none focus:border-[#2A398D] focus:ring-2 focus:ring-[#2A398D]/20"
                        value={draft.advancementMethod}
                        onChange={(event) => setDrafts((current) => ({ ...current, [key]: { ...draft, advancementMethod: event.target.value as ScoreDraft["advancementMethod"] } }))}
                      >
                        <option value="extraTime">Tiempo extra</option>
                        <option value="penalties">Penales</option>
                      </select>
                    </label>
                    <p className="text-xs font-semibold leading-5 text-muted-foreground sm:col-span-2">
                      El marcador de 90' queda para puntos; este campo solo define quién sigue en la llave.
                    </p>
                  </div>
                ) : null}
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button className="h-12 rounded-[1rem]" disabled={isSaving} type="button" variant="outline" onClick={() => void handleSave(match, "live")}>Guardar en vivo</Button>
                  <Button className="h-12 rounded-[1rem]" disabled={isSaving} type="button" onClick={() => void handleSave(match, "finished")}>Finalizar partido</Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {activeTab === "votes" && data.state === "ready" ? (
        <VoteAuditPanel matches={data.voteMatches} />
      ) : null}
    </AppSection>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      className={cn(
        "min-h-11 min-w-0 rounded-[0.9rem] px-2 py-2 text-center text-xs font-black leading-tight tracking-[-0.01em] transition sm:px-3 sm:text-sm",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function VoteAuditPanel({ matches }: { matches: OperatorMatchVotes[] }) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => matches[0] ? String(matches[0].matchId) : null);

  useEffect(() => {
    if (matches.length === 0) {
      setSelectedMatchId(null);
      return;
    }

    if (!selectedMatchId || !matches.some((match) => String(match.matchId) === selectedMatchId)) {
      setSelectedMatchId(String(matches[0].matchId));
    }
  }, [matches, selectedMatchId]);

  if (matches.length === 0) {
    return <p className="rounded-[1.25rem] border border-border/70 bg-card/90 px-4 py-4 text-sm text-muted-foreground">No hay partidos para revisar.</p>;
  }

  const selectedIndex = Math.max(0, matches.findIndex((match) => String(match.matchId) === selectedMatchId));
  const selectedMatch = matches[selectedIndex] ?? matches[0];

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0 rounded-[1.25rem] border border-border/70 bg-card/95 p-3 lg:sticky lg:top-24">
        <div className="grid gap-2 lg:hidden">
          <label className="grid gap-2">
            <span className="text-xs font-black tracking-[0.16em] text-muted-foreground uppercase">Partido</span>
            <select
              className="min-h-12 w-full min-w-0 rounded-[1rem] border border-border/80 bg-background px-3 text-sm font-bold text-foreground outline-none focus:border-[#2A398D] focus:ring-2 focus:ring-[#2A398D]/20"
              value={String(selectedMatch.matchId)}
              onChange={(event) => setSelectedMatchId(event.target.value)}
            >
              {matches.map((match, index) => (
                <option key={String(match.matchId)} value={String(match.matchId)}>
                  {index + 1}. {match.homeTeamName} vs {match.awayTeamName} ({match.votedCount}/{match.totalPlayers})
                </option>
              ))}
            </select>
          </label>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <Button className="h-11 min-w-0 rounded-[1rem] px-2 text-xs sm:text-sm" disabled={selectedIndex <= 0} type="button" variant="outline" onClick={() => setSelectedMatchId(String(matches[selectedIndex - 1].matchId))}>Anterior</Button>
            <p className="px-2 text-center text-xs font-black text-muted-foreground">{selectedIndex + 1}/{matches.length}</p>
            <Button className="h-11 min-w-0 rounded-[1rem] px-2 text-xs sm:text-sm" disabled={selectedIndex >= matches.length - 1} type="button" variant="outline" onClick={() => setSelectedMatchId(String(matches[selectedIndex + 1].matchId))}>Siguiente</Button>
          </div>
        </div>

        <div className="hidden lg:grid lg:max-h-[70vh] lg:gap-2 lg:overflow-y-auto lg:pr-1">
          {matches.map((match) => {
            const isSelected = String(match.matchId) === String(selectedMatch.matchId);
            const pendingCount = match.totalPlayers - match.votedCount;

            return (
              <button
                key={String(match.matchId)}
                className={cn(
                  "min-w-0 rounded-[1rem] border px-3 py-3 text-left transition",
                  isSelected ? "border-[#2A398D]/35 bg-[#2A398D]/10" : "border-border/70 bg-background/70 hover:border-[#2A398D]/25 hover:bg-background",
                )}
                type="button"
                onClick={() => setSelectedMatchId(String(match.matchId))}
              >
                <p className="line-clamp-2 text-sm font-extrabold leading-5 text-foreground">{match.homeTeamName} vs {match.awayTeamName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
                  <span>{match.votedCount}/{match.totalPlayers} votaron</span>
                  {pendingCount > 0 ? <span>Faltan {pendingCount}</span> : <span>Completo</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <VoteAuditCard match={selectedMatch} />
    </div>
  );
}

function VoteAuditCard({ match }: { match: OperatorMatchVotes }) {
  const pendingCount = match.totalPlayers - match.votedCount;

  return (
    <article className="min-w-0 overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/95 p-3 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.35)] sm:rounded-[1.5rem] sm:p-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black tracking-[0.2em] text-[#2A398D]/72 uppercase">{match.stageLabel}</p>
          <h2 className="mt-1 break-words font-display text-xl font-extrabold leading-tight tracking-[-0.04em] text-foreground sm:text-2xl">
            {match.homeTeamName} vs {match.awayTeamName}
          </h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{formatOperatorKickoff(match.kickoffAt)}</p>
        </div>
        <div className="grid gap-2 sm:justify-items-end">
          <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-black tracking-[0.14em] uppercase", getStatusClassName(match.status))}>{getStatusLabel(match.status)}</span>
          <p className="text-sm font-black text-foreground">{match.votedCount}/{match.totalPlayers} votaron</p>
          {pendingCount > 0 ? <p className="text-xs font-semibold text-muted-foreground">Faltan {pendingCount}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {match.votes.map((vote) => (
          <div key={vote.playerName} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[1rem] border border-border/70 bg-background/80 px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{vote.playerName}</p>
              <p className={cn("text-xs font-semibold", vote.hasPrediction ? "text-[#08783a]" : "text-muted-foreground")}>{vote.hasPrediction ? "Voto cargado" : "Pendiente"}</p>
            </div>
            {vote.hasPrediction ? (
              <span className="shrink-0 rounded-[0.8rem] bg-[#2A398D]/10 px-2.5 py-1.5 font-display text-lg font-extrabold tracking-[-0.04em] text-[#2A398D] sm:px-3 sm:text-xl">
                {String(vote.homeScore)}-{String(vote.awayScore)}
              </span>
            ) : (
              <span className="shrink-0 rounded-[0.8rem] bg-muted px-2.5 py-1.5 text-[0.68rem] font-black tracking-[0.08em] text-muted-foreground uppercase sm:px-3 sm:text-xs sm:tracking-[0.12em]">Sin voto</span>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function getStatusLabel(status: OperatorMatchVotes["status"]) {
  if (status === "live") {
    return "En vivo";
  }

  if (status === "finished") {
    return "Finalizado";
  }

  return "Programado";
}

function getStatusClassName(status: OperatorMatchVotes["status"]) {
  if (status === "live") {
    return "bg-[#18a058]/12 text-[#08783a]";
  }

  if (status === "finished") {
    return "bg-[#2A398D]/10 text-[#2A398D]";
  }

  return "bg-muted text-muted-foreground";
}

function formatOperatorKickoff(kickoffAt: number) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Guatemala",
  }).format(new Date(kickoffAt));
}

function ScoreBox({ label, onChange, value }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground sm:min-h-0 sm:line-clamp-1">{label}</span>
      <input
        className="h-14 min-w-0 rounded-[1rem] border border-border/80 bg-background px-3 text-center font-display text-3xl font-extrabold text-foreground shadow-inner outline-none [appearance:textfield] focus:border-[#2A398D] focus:ring-2 focus:ring-[#2A398D]/20 sm:h-16 sm:rounded-[1.1rem] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        inputMode="numeric"
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

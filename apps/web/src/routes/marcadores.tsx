import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import type { Id } from "@quiniela-mundial-2026/backend/convex/_generated/dataModel";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useConvex, useMutation } from "convex/react";
import { useEffect, useState } from "react";

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
  status: "scheduled" | "live" | "finished";
  homeTeam: { code: string; name: string; flagEmoji?: string };
  awayTeam: { code: string; name: string; flagEmoji?: string };
  homeScore?: number;
  awayScore?: number;
};

type DataState =
  | { state: "idle" | "loading" }
  | { state: "ready"; matches: ManageableMatch[] }
  | { state: "error"; message: string };

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
  const [drafts, setDrafts] = useState<Record<string, { homeScore: string; awayScore: string }>>({});

  useEffect(() => {
    if (!session) {
      setData({ state: "idle" });
      return;
    }

    let isCurrent = true;
    setData({ state: "loading" });

    void convex
      .query(api.matches.listManageableMatches, { sessionToken: session.sessionToken })
      .then((result) => {
        if (!isCurrent) {
          return;
        }

        setData({ state: "ready", matches: result.matches });
        setDrafts(Object.fromEntries(result.matches.map((match: ManageableMatch) => [
          String(match.matchId),
          {
            awayScore: String(match.awayScore ?? 0),
            homeScore: String(match.homeScore ?? 0),
          },
        ])));
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
      return;
    }

    setSavingMatchId(String(match.matchId));
    try {
      await updateScore({
        awayScore,
        homeScore,
        matchId: match.matchId,
        sessionToken: session.sessionToken,
        status,
      });
      const result = await convex.query(api.matches.listManageableMatches, { sessionToken: session.sessionToken });
      setData({ state: "ready", matches: result.matches });
      setDrafts(Object.fromEntries(result.matches.map((nextMatch: ManageableMatch) => [
        String(nextMatch.matchId),
        {
          awayScore: String(nextMatch.awayScore ?? 0),
          homeScore: String(nextMatch.homeScore ?? 0),
        },
      ])));
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
      title="Marcadores en vivo"
      description={`Sesión de ${session.displayName}. Solo aparecen partidos actualmente en vivo.`}
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
      {data.state === "loading" ? (
        <p className="rounded-[1.25rem] border border-border/70 bg-card/90 px-4 py-4 text-sm text-muted-foreground">Cargando partidos en vivo...</p>
      ) : null}
      {data.state === "error" ? (
        <p className="rounded-[1.25rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive">{data.message}</p>
      ) : null}
      {data.state === "ready" && data.matches.length === 0 ? (
        <p className="rounded-[1.25rem] border border-border/70 bg-card/90 px-4 py-4 text-sm text-muted-foreground">No hay partidos en vivo para editar.</p>
      ) : null}
      {data.state === "ready" && data.matches.length > 0 ? (
        <div className="grid gap-4">
          {data.matches.map((match) => {
            const key = String(match.matchId);
            const draft = drafts[key] ?? { homeScore: String(match.homeScore ?? 0), awayScore: String(match.awayScore ?? 0) };
            const isSaving = savingMatchId === key;

            return (
              <article key={key} className="rounded-[1.5rem] border border-[#2A398D]/14 bg-card/95 p-4 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.45)] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-black tracking-[0.2em] text-[#2A398D]/72 uppercase">{match.stageLabel}</p>
                    <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.04em] text-foreground">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#18a058]/12 px-3 py-1 text-xs font-black tracking-[0.14em] text-[#08783a] uppercase">En vivo</span>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <ScoreBox
                    label={match.homeTeam.name}
                    value={draft.homeScore}
                    onChange={(value) => setDrafts((current) => ({ ...current, [key]: { ...draft, homeScore: value } }))}
                  />
                  <span className="pb-3 text-sm font-black text-muted-foreground">vs</span>
                  <ScoreBox
                    label={match.awayTeam.name}
                    value={draft.awayScore}
                    onChange={(value) => setDrafts((current) => ({ ...current, [key]: { ...draft, awayScore: value } }))}
                  />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button disabled={isSaving} type="button" variant="outline" onClick={() => void handleSave(match, "live")}>Guardar en vivo</Button>
                  <Button disabled={isSaving} type="button" onClick={() => void handleSave(match, "finished")}>Finalizar partido</Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </AppSection>
  );
}

function ScoreBox({ label, onChange, value }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="line-clamp-1 text-sm font-bold text-foreground">{label}</span>
      <input
        className="h-16 rounded-[1.1rem] border border-border/80 bg-background px-3 text-center font-display text-3xl font-extrabold text-foreground shadow-inner outline-none focus:border-[#2A398D] focus:ring-2 focus:ring-[#2A398D]/20"
        inputMode="numeric"
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

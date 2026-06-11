import { Card, CardContent, CardFooter, CardHeader } from "@quiniela-mundial-2026/ui/components/card";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { ScoreInput } from "@quiniela-mundial-2026/ui/components/score-input";
import { useEffect, useState } from "react";

import type { HomeMatchSummary } from "@/lib/home-data";
import { useI18n } from "@/lib/i18n";
import {
  getPredictionDisplayState,
  getPredictionInputHint,
  getPredictionStatusLabel,
  type PredictionSaveState,
} from "@/lib/prediction-copy";
import { getPrivacyRevealCopy } from "@/lib/privacy-copy";
import { localizeStageLabel, localizeTeamName } from "@/lib/team-i18n";

type PredictionCardProps = {
  match: HomeMatchSummary;
  status: PredictionSaveState;
  savedScore: {
    homeScore: number | null;
    awayScore: number | null;
  };
  isLocked: boolean;
  isSaving: boolean;
  onDirty: () => void;
  onDraftStateChange?: (state: PredictionDraftState) => void;
  onSave: (scores: { homeScore: number; awayScore: number }) => void;
};

export type PredictionDraftState = {
  canSave: boolean;
  displayState: PredictionSaveState;
  draftMatchesSavedScore: boolean;
  hasCompleteDraft: boolean;
  scores: { homeScore: number; awayScore: number } | null;
};

export function PredictionCard({ match, status, savedScore, isLocked, isSaving, onDirty, onDraftStateChange, onSave }: PredictionCardProps) {
  const { dateLocale, locale, t } = useI18n();
  const kickoffFormatter = new Intl.DateTimeFormat(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const [homeScore, setHomeScore] = useState(savedScore.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(savedScore.awayScore?.toString() ?? "");
  const isReadOnly = isLocked || isSaving;
  const displayState = getPredictionDisplayState({
    draftScore: {
      homeScore: parseScore(homeScore),
      awayScore: parseScore(awayScore),
    },
    isLocked,
    savedScore,
    status,
  });
  const stateTheme = getStateTheme(displayState);
  const parsedHomeScore = parseScore(homeScore);
  const parsedAwayScore = parseScore(awayScore);
  const hasCompleteDraft = parsedHomeScore !== null && parsedAwayScore !== null;
  const draftMatchesSavedScore = parsedHomeScore === savedScore.homeScore && parsedAwayScore === savedScore.awayScore;
  const canSave = !isReadOnly && hasCompleteDraft && !draftMatchesSavedScore;

  useEffect(() => {
    onDraftStateChange?.({
      canSave,
      displayState,
      draftMatchesSavedScore,
      hasCompleteDraft,
      scores: parsedHomeScore !== null && parsedAwayScore !== null
        ? { homeScore: parsedHomeScore, awayScore: parsedAwayScore }
        : null,
    });
  }, [canSave, displayState, draftMatchesSavedScore, hasCompleteDraft, onDraftStateChange, parsedAwayScore, parsedHomeScore]);

  useEffect(() => {
    setHomeScore(savedScore.homeScore?.toString() ?? "");
    setAwayScore(savedScore.awayScore?.toString() ?? "");
  }, [savedScore.awayScore, savedScore.homeScore, match.matchId]);

  function handleSaveClick() {
    if (isReadOnly) {
      return;
    }

    if (parsedHomeScore === null || parsedAwayScore === null) {
      return;
    }

    if (draftMatchesSavedScore) {
      return;
    }

    onSave({ homeScore: parsedHomeScore, awayScore: parsedAwayScore });
  }

  function handleHomeScoreChange(value: string) {
    if (isReadOnly) {
      return;
    }

    setHomeScore(value);
    onDirty();
  }

  function handleAwayScoreChange(value: string) {
    if (isReadOnly) {
      return;
    }

    setAwayScore(value);
    onDirty();
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/95 py-0 shadow-[0_18px_44px_-32px_rgba(42,57,141,0.38)] ring-0 sm:rounded-[1.75rem]">
      <CardHeader className="gap-3 bg-[#2A398D] px-4 pt-4 pb-4 text-white sm:gap-4 sm:px-6 sm:pt-6 sm:pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-bold tracking-[0.24em] text-white/75 uppercase">{localizeStageLabel(match.stageLabel, locale)}</p>
            <div className="space-y-1">
              <h3 className="hidden font-display text-3xl font-extrabold leading-none tracking-[-0.04em] text-white sm:block sm:text-4xl">{t.predictionCard.question}</h3>
              <p className="text-sm leading-6 text-white/82">{t.predictionCard.editableUntil(kickoffFormatter.format(match.kickoffAt))}</p>
            </div>
          </div>
          <div className={stateTheme.badgeClassName}>
            <span className="h-2.5 w-2.5 rounded-full bg-current/80" />
            <span>{getPredictionStatusLabel(displayState, t)}</span>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/12 bg-white/10 p-2.5 sm:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:gap-3">
            <TeamBlock side={t.predictionCard.home} team={match.homeTeam} teamName={localizeTeamName({ code: match.homeTeam.code, locale, name: match.homeTeam.name })} />
            <div className="mx-auto flex size-9 items-center justify-center self-center rounded-full border border-white/18 bg-white text-xs font-bold tracking-[0.14em] text-[#2A398D] uppercase shadow-[0_14px_30px_-22px_rgba(0,0,0,0.7)] sm:size-14 sm:text-sm sm:tracking-[0.18em]">
              vs
            </div>
            <TeamBlock side={t.predictionCard.away} team={match.awayTeam} teamName={localizeTeamName({ code: match.awayTeam.code, locale, name: match.awayTeam.name })} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-[1.15rem] border border-border/70 bg-background/80 p-2.5 shadow-[0_18px_40px_-32px_rgba(42,57,141,0.28)] sm:rounded-[1.25rem] sm:p-4">
            <ScoreInput
              aria-label={t.predictionCard.homeGoalsAria(localizeTeamName({ code: match.homeTeam.code, locale, name: match.homeTeam.name }))}
              disabled={isReadOnly}
              hint={getPredictionInputHint({ side: "home", state: displayState, t })}
              label={t.predictionCard.homeGoals(localizeTeamName({ code: match.homeTeam.code, locale, name: match.homeTeam.name }))}
              placeholder="0"
              value={homeScore}
              onChange={(event) => handleHomeScoreChange(event.target.value)}
            />
          </div>

          <div className="rounded-[1.15rem] border border-border/70 bg-background/80 p-2.5 shadow-[0_18px_40px_-32px_rgba(42,57,141,0.28)] sm:rounded-[1.25rem] sm:p-4">
            <ScoreInput
              aria-label={t.predictionCard.awayGoalsAria(localizeTeamName({ code: match.awayTeam.code, locale, name: match.awayTeam.name }))}
              disabled={isReadOnly}
              hint={getPredictionInputHint({ side: "away", state: displayState, t })}
              label={t.predictionCard.awayGoals(localizeTeamName({ code: match.awayTeam.code, locale, name: match.awayTeam.name }))}
              placeholder="0"
              value={awayScore}
              onChange={(event) => handleAwayScoreChange(event.target.value)}
            />
          </div>
        </div>

        <div className="hidden gap-3 rounded-[1.5rem] border border-[#2A398D]/12 bg-[#2A398D]/5 p-4 sm:grid sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p aria-live="polite" className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {getPredictionStatusLabel(displayState, t)}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isLocked
                ? getPrivacyRevealCopy({ isLocked: true, t })
                : isSaving
                  ? t.predictionCard.savingScore
                  : hasCompleteDraft
                    ? t.predictionCard.pressSave
                    : t.predictionCard.fillBoth}
            </p>
          </div>
          <Button
            type="button"
            className="h-12 rounded-[1rem] px-6 text-sm font-bold"
            disabled={!canSave}
            onClick={handleSaveClick}
          >
            {isSaving ? t.common.saving : displayState === "saved" && draftMatchesSavedScore ? t.common.saved : t.predictionCard.saveScore}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="hidden border-border/70 bg-muted/25 px-5 py-4 sm:block sm:px-6">
        <p className="text-xs leading-5 text-muted-foreground">
          {isLocked
            ? t.predictionCard.lockedFooter
            : isSaving
              ? t.predictionCard.savingFooter
              : t.predictionCard.defaultFooter}
        </p>
      </CardFooter>
    </Card>
  );
}

function TeamBlock({
  side,
  team,
  teamName,
}: {
  side: string;
  team: HomeMatchSummary["homeTeam"];
  teamName: string;
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-[0.9rem] bg-white/12 px-2 py-3 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:min-h-28 sm:flex-row sm:justify-start sm:gap-3 sm:rounded-[1rem] sm:px-4 sm:py-4 sm:text-left">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/24 bg-white text-2xl leading-none sm:size-14 sm:text-3xl">
        {team.flagEmoji ?? "-"}
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-white/68 uppercase sm:text-[0.7rem] sm:tracking-[0.2em]">{side}</p>
        <p className="mt-1 line-clamp-2 text-balance font-display text-base font-bold leading-tight tracking-[-0.03em] text-white sm:text-2xl">{teamName}</p>
      </div>
    </div>
  );
}

function getStateTheme(state: PredictionSaveState) {
  switch (state) {
    case "saved":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-[#176c3a] uppercase shadow-[0_10px_24px_-18px_rgba(0,0,0,0.5)]",
        panelClassName: "rounded-[1.5rem] border border-emerald-500/25 bg-emerald-500/[0.10] px-4 py-3",
      };
    case "saving":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-[#2A398D] uppercase shadow-[0_10px_24px_-18px_rgba(0,0,0,0.5)]",
        panelClassName: "rounded-[1.5rem] border border-primary/20 bg-primary/[0.08] px-4 py-3",
      };
    case "error":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-destructive uppercase shadow-[0_10px_24px_-18px_rgba(0,0,0,0.5)]",
        panelClassName: "rounded-[1.5rem] border border-destructive/25 bg-destructive/10 px-4 py-3",
      };
    case "locked":
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase shadow-[0_10px_24px_-18px_rgba(0,0,0,0.5)]",
        panelClassName: "rounded-[1.5rem] border border-border/70 bg-muted/[0.35] px-4 py-3",
      };
    default:
      return {
        badgeClassName:
          "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-[#2A398D] uppercase shadow-[0_10px_24px_-18px_rgba(0,0,0,0.5)]",
        panelClassName: "rounded-[1.5rem] border border-primary/15 bg-primary/[0.06] px-4 py-3",
      };
  }
}

function parseScore(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

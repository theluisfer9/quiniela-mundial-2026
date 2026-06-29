import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { KnockoutRadialBracket } from "@/components/knockout-radial-bracket";
import {
  buildCalendarDaySections,
  buildGroupStandings,
  getDefaultCalendarDayKey,
  getSelectedCalendarDaySection,
  getSelectedGroupStanding,
  type CalendarMatch,
  type GroupStanding,
} from "@/lib/calendar-groups";
import { useI18n } from "@/lib/i18n";
import { getDevCalendarPreviewMatches } from "@/lib/dev-calendar-preview";
import { localizeStageLabel, localizeTeamName } from "@/lib/team-i18n";

export const Route = createFileRoute("/calendario")({
  component: CalendarRoute,
});

type CalendarTab = "schedule" | "groups" | "knockout";

type CalendarData = {
  matches: CalendarMatch[];
};

function CalendarRoute() {
  const { t } = useI18n();
  const convex = useConvex();
  const [data, setData] = useState<CalendarData | undefined>();
  const [activeTab, setActiveTab] = useState<CalendarTab>("schedule");
  const matches = data?.matches ?? [];
  const daySections = buildCalendarDaySections(matches);
  const groups = buildGroupStandings(matches);

  useEffect(() => {
    let isCurrent = true;
    const devPreviewTimeout = import.meta.env.DEV
      ? window.setTimeout(() => {
          if (isCurrent) {
            setData({ matches: getDevCalendarPreviewMatches() });
          }
        }, 1_500)
      : undefined;

    void convex.query(api.matches.getPublicCalendar, {}).then((calendar) => {
      if (isCurrent) {
        if (devPreviewTimeout !== undefined) {
          window.clearTimeout(devPreviewTimeout);
        }
        setData(calendar as CalendarData);
      }
    }).catch(() => {
      if (isCurrent) {
        if (devPreviewTimeout !== undefined) {
          window.clearTimeout(devPreviewTimeout);
        }
        setData({ matches: [] });
      }
    });

    return () => {
      isCurrent = false;
      if (devPreviewTimeout !== undefined) {
        window.clearTimeout(devPreviewTimeout);
      }
    };
  }, [convex]);

  return (
    <div className="grid gap-5">
      <AppSection
        eyebrow={t.calendar.eyebrow}
        title={t.calendar.title}
        description={t.calendar.description}
        className="border-primary/15 bg-card/98"
      >
        <div className="grid grid-cols-3 gap-2 rounded-[1.15rem] bg-muted p-1">
          <CalendarTabButton active={activeTab === "schedule"} icon={<CalendarDays className="size-5" />} onClick={() => setActiveTab("schedule")}>
            {t.calendar.scheduleTab}
          </CalendarTabButton>
          <CalendarTabButton active={activeTab === "groups"} icon={<ListOrdered className="size-5" />} onClick={() => setActiveTab("groups")}>
            {t.calendar.groupsTab}
          </CalendarTabButton>
          <CalendarTabButton active={activeTab === "knockout"} icon={<Trophy className="size-5" />} onClick={() => setActiveTab("knockout")}>
            {t.calendar.knockoutTab}
          </CalendarTabButton>
        </div>
      </AppSection>

      {data === undefined ? (
        <AppSection eyebrow={t.calendar.eyebrow} title={t.calendar.loading} description="" className="border-primary/15 bg-card/98">
          <p className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">{t.calendar.loading}</p>
        </AppSection>
      ) : matches.length === 0 ? (
        <AppSection eyebrow={t.calendar.eyebrow} title={t.calendar.empty} description="" className="border-primary/15 bg-card/98">
          <p className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">{t.calendar.empty}</p>
        </AppSection>
      ) : activeTab === "schedule" ? (
        <ScheduleTab daySections={daySections} />
      ) : activeTab === "groups" ? (
        <GroupsTab groups={groups} matches={matches} />
      ) : (
        <KnockoutTab groups={groups} matches={matches} />
      )}
    </div>
  );
}

function KnockoutTab({ groups, matches }: { groups: GroupStanding[]; matches: CalendarMatch[] }) {
  const { t } = useI18n();
  void groups;

  return (
    <AppSection
      eyebrow={t.calendar.knockoutEyebrow}
      title={t.calendar.knockoutTitle}
      className="min-w-0 border-primary/15 bg-card/98"
      contentClassName="min-w-0"
    >
      <KnockoutRadialBracket matches={matches} />
    </AppSection>
  );
}

function CalendarTabButton({ active, children, icon, onClick }: { active: boolean; children: ReactNode; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-[0.9rem] px-1.5 py-2 text-center text-[0.68rem] font-black leading-tight transition sm:flex-row sm:gap-2 sm:px-3 sm:text-sm [&>svg]:shrink-0",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
      type="button"
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function ScheduleTab({ daySections }: { daySections: ReturnType<typeof buildCalendarDaySections> }) {
  const { dateLocale } = useI18n();
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(() => getDefaultCalendarDayKey(daySections));
  const selectedSection = getSelectedCalendarDaySection(daySections, selectedDayKey);
  const activeDayButtonRef = useRef<HTMLButtonElement | null>(null);
  const dayFormatter = new Intl.DateTimeFormat(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guatemala",
  });
  const chipFormatter = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    timeZone: "America/Guatemala",
  });

  useEffect(() => {
    activeDayButtonRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [selectedSection?.dayKey]);

  if (!selectedSection) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        {daySections.map((section) => {
          const isActive = section.dayKey === selectedSection.dayKey;

          return (
            <button
              key={section.dayKey}
              ref={isActive ? activeDayButtonRef : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-black transition",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_14px_26px_-20px_rgba(189,0,21,0.9)]"
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
              type="button"
              onClick={() => setSelectedDayKey(section.dayKey)}
            >
              {capitalize(chipFormatter.format(new Date(section.kickoffAt)))} · {section.matches.length}
            </button>
          );
        })}
      </div>
      <AppSection
        eyebrow={selectedSection.dayKey}
        title={capitalize(dayFormatter.format(new Date(selectedSection.kickoffAt)))}
        description={`${selectedSection.matches.length} partido${selectedSection.matches.length === 1 ? "" : "s"}`}
        className="border-primary/15 bg-card/98"
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {selectedSection.matches.map((match) => <CalendarMatchCard key={match.matchId} match={match} />)}
        </div>
      </AppSection>
    </div>
  );
}

function GroupsTab({ groups, matches }: { groups: GroupStanding[]; matches: CalendarMatch[] }) {
  const { dateLocale, t } = useI18n();
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const [selectedFixtureDayKey, setSelectedFixtureDayKey] = useState<string | null>(null);
  const selectedGroup = getSelectedGroupStanding(groups, selectedGroupCode);
  const matchesByGroup = new Map<string, CalendarMatch[]>();
  for (const match of matches) {
    const groupCode = match.groupCode ?? match.homeTeam.groupCode ?? match.awayTeam.groupCode ?? "?";
    matchesByGroup.set(groupCode, [...(matchesByGroup.get(groupCode) ?? []), match]);
  }
  const selectedGroupMatches = selectedGroup ? (matchesByGroup.get(selectedGroup.groupCode) ?? []) : [];
  const fixtureDaySections = buildCalendarDaySections(selectedGroupMatches);
  const selectedFixtureSection = getSelectedCalendarDaySection(fixtureDaySections, selectedFixtureDayKey);
  const chipFormatter = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    timeZone: "America/Guatemala",
  });

  if (!selectedGroup) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-6 sm:px-0 lg:grid-cols-12">
        {groups.map((group) => {
          const isActive = group.groupCode === selectedGroup.groupCode;

          return (
            <button
              key={group.groupCode}
              className={cn(
                "min-h-10 shrink-0 rounded-full border px-4 text-sm font-black transition sm:rounded-[0.9rem]",
                isActive
                  ? "border-[#2A398D] bg-[#2A398D] text-white shadow-[0_14px_26px_-20px_rgba(42,57,141,0.9)]"
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
              type="button"
              onClick={() => setSelectedGroupCode(group.groupCode)}
            >
              {group.groupCode}
            </button>
          );
        })}
      </div>
      <AppSection
        eyebrow={`Grupo ${selectedGroup.groupCode}`}
        title={`Grupo ${selectedGroup.groupCode}`}
        description={t.calendar.fixtures}
        className="min-w-0 border-primary/15 bg-card/98"
      >
        <GroupTable group={selectedGroup} />
        {selectedFixtureSection ? (
          <div className="grid gap-3">
            {fixtureDaySections.length > 1 ? (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {fixtureDaySections.map((section) => {
                  const isActive = section.dayKey === selectedFixtureSection.dayKey;

                  return (
                    <button
                      key={section.dayKey}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition",
                        isActive
                          ? "border-[#2A398D] bg-[#2A398D] text-white shadow-[0_14px_26px_-20px_rgba(42,57,141,0.9)]"
                          : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                      )}
                      type="button"
                      onClick={() => setSelectedFixtureDayKey(section.dayKey)}
                    >
                      {capitalize(chipFormatter.format(new Date(section.kickoffAt)))} · {section.matches.length}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="grid gap-2">
              {selectedFixtureSection.matches.map((match) => <CompactFixture key={match.matchId} match={match} />)}
            </div>
          </div>
        ) : null}
      </AppSection>
    </div>
  );
}

function GroupTable({ group }: { group: GroupStanding }) {
  const { t } = useI18n();

  return (
    <div className="max-w-full overflow-x-auto rounded-[1.2rem] border border-border/70 bg-background/80">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-[0.68rem] font-black tracking-[0.14em] text-muted-foreground uppercase">
            <th className="px-3 py-3 text-left">Equipo</th>
            <th className="px-2 py-3 text-right">{t.calendar.played}</th>
            <th className="px-2 py-3 text-right">{t.calendar.won}</th>
            <th className="px-2 py-3 text-right">{t.calendar.drawn}</th>
            <th className="px-2 py-3 text-right">{t.calendar.lost}</th>
            <th className="px-2 py-3 text-right">{t.calendar.goalsFor}</th>
            <th className="px-2 py-3 text-right">{t.calendar.goalsAgainst}</th>
            <th className="px-2 py-3 text-right">{t.calendar.goalDifference}</th>
            <th className="px-3 py-3 text-right">{t.calendar.points}</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <tr key={row.teamCode} className="border-b border-border/60 last:border-b-0">
              <th className="px-3 py-3 text-left font-semibold text-foreground" scope="row">
                <span className="mr-2">{row.flagEmoji}</span>{row.teamName}
              </th>
              <td className="px-2 py-3 text-right font-semibold">{row.played}</td>
              <td className="px-2 py-3 text-right font-semibold">{row.won}</td>
              <td className="px-2 py-3 text-right font-semibold">{row.drawn}</td>
              <td className="px-2 py-3 text-right font-semibold">{row.lost}</td>
              <td className="px-2 py-3 text-right font-semibold">{row.goalsFor}</td>
              <td className="px-2 py-3 text-right font-semibold">{row.goalsAgainst}</td>
              <td className="px-2 py-3 text-right font-semibold">{row.goalDifference}</td>
              <td className="px-3 py-3 text-right font-display text-lg font-extrabold text-primary">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarMatchCard({ match }: { match: CalendarMatch }) {
  const { dateLocale, locale, t } = useI18n();
  const timeFormatter = new Intl.DateTimeFormat(dateLocale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Guatemala",
  });
  const isScored = match.status === "live" || match.status === "finished";

  return (
    <article className="rounded-[1.25rem] border border-border/70 bg-background/85 p-4 shadow-[0_18px_44px_-34px_rgba(42,57,141,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black tracking-[0.18em] text-primary uppercase">{localizeStageLabel(match.stageLabel, locale)}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {timeFormatter.format(new Date(match.kickoffAt))}
          </p>
        </div>
        <StatusBadge status={match.status} />
      </div>
      <div className="mt-4 grid gap-3 rounded-[1rem] border border-border/60 bg-card/70 p-3">
        <CalendarTeamLine team={match.homeTeam} score={isScored ? match.homeScore : undefined} />
        <CalendarTeamLine team={match.awayTeam} score={isScored ? match.awayScore : undefined} />
      </div>
      <p className="mt-3 line-clamp-1 text-xs font-semibold text-muted-foreground">{match.venue ?? t.calendar.venueFallback}</p>
    </article>
  );
}

function CompactFixture({ match }: { match: CalendarMatch }) {
  const { dateLocale } = useI18n();
  const formatter = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Guatemala",
  });
  const isScored = match.status === "live" || match.status === "finished";

  return (
    <div className="grid gap-2 rounded-[1rem] border border-border/70 bg-background/75 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <p className="text-xs font-black tracking-[0.14em] text-muted-foreground uppercase">{formatter.format(new Date(match.kickoffAt))}</p>
      <p className="min-w-0 truncate text-sm font-bold text-foreground">
        {match.homeTeam.name} vs {match.awayTeam.name}
      </p>
      <p className="font-display text-lg font-extrabold text-primary">
        {isScored ? `${match.homeScore}-${match.awayScore}` : "-"}
      </p>
    </div>
  );
}

function CalendarTeamLine({ score, team }: { team: CalendarMatch["homeTeam"]; score?: number }) {
  const { locale } = useI18n();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex items-center gap-2">
        <span className="text-xl">{team.flagEmoji}</span>
        <span className="truncate font-bold text-foreground">{localizeTeamName({ code: team.code, locale, name: team.name })}</span>
      </div>
      <span className="font-display text-2xl font-extrabold text-foreground">{score ?? "-"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CalendarMatch["status"] }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-black uppercase",
        status === "live" && "bg-[#18a842] text-white ring-2 ring-[#b7f7c7]",
        status === "finished" && "bg-[#2A398D]/10 text-[#2A398D]",
        status === "scheduled" && "bg-primary/10 text-primary",
      )}
    >
      {status === "live" ? t.home.statusLive : null}
      {status === "finished" ? t.home.statusFinished : null}
      {status === "scheduled" ? t.home.statusScheduled : null}
    </span>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

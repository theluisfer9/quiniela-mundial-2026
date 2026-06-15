import { api } from "@quiniela-mundial-2026/backend/convex/_generated/api";
import { AppSection } from "@quiniela-mundial-2026/ui/components/app-section";
import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { CalendarDays, ListOrdered } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  buildCalendarDaySections,
  buildGroupStandings,
  type CalendarMatch,
  type GroupStanding,
} from "@/lib/calendar-groups";
import { useI18n } from "@/lib/i18n";
import { localizeStageLabel, localizeTeamName } from "@/lib/team-i18n";

export const Route = createFileRoute("/calendario")({
  component: CalendarRoute,
});

type CalendarTab = "schedule" | "groups";

type CalendarData = {
  matches: CalendarMatch[];
};

function CalendarRoute() {
  const { t } = useI18n();
  const data = useQuery(api.matches.getPublicCalendar, {}) as CalendarData | undefined;
  const [activeTab, setActiveTab] = useState<CalendarTab>("schedule");
  const matches = data?.matches ?? [];
  const daySections = buildCalendarDaySections(matches);
  const groups = buildGroupStandings(matches);

  return (
    <div className="grid gap-5">
      <AppSection
        eyebrow={t.calendar.eyebrow}
        title={t.calendar.title}
        description={t.calendar.description}
        className="border-primary/15 bg-card/98"
      >
        <div className="grid grid-cols-2 gap-2 rounded-[1.15rem] bg-muted p-1">
          <CalendarTabButton active={activeTab === "schedule"} icon={<CalendarDays className="size-4" />} onClick={() => setActiveTab("schedule")}>
            {t.calendar.scheduleTab}
          </CalendarTabButton>
          <CalendarTabButton active={activeTab === "groups"} icon={<ListOrdered className="size-4" />} onClick={() => setActiveTab("groups")}>
            {t.calendar.groupsTab}
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
      ) : (
        <GroupsTab groups={groups} matches={matches} />
      )}
    </div>
  );
}

function CalendarTabButton({ active, children, icon, onClick }: { active: boolean; children: ReactNode; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.9rem] px-3 py-2 text-sm font-black transition",
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
  const dayFormatter = new Intl.DateTimeFormat(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guatemala",
  });

  return (
    <div className="grid gap-4">
      {daySections.map((section) => (
        <AppSection
          key={section.dayKey}
          eyebrow={section.dayKey}
          title={capitalize(dayFormatter.format(new Date(section.kickoffAt)))}
          description={`${section.matches.length} partido${section.matches.length === 1 ? "" : "s"}`}
          className="border-primary/15 bg-card/98"
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {section.matches.map((match) => <CalendarMatchCard key={match.matchId} match={match} />)}
          </div>
        </AppSection>
      ))}
    </div>
  );
}

function GroupsTab({ groups, matches }: { groups: GroupStanding[]; matches: CalendarMatch[] }) {
  const { t } = useI18n();
  const matchesByGroup = new Map<string, CalendarMatch[]>();
  for (const match of matches) {
    const groupCode = match.groupCode ?? match.homeTeam.groupCode ?? match.awayTeam.groupCode ?? "?";
    matchesByGroup.set(groupCode, [...(matchesByGroup.get(groupCode) ?? []), match]);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {groups.map((group) => (
        <AppSection
          key={group.groupCode}
          eyebrow={`Grupo ${group.groupCode}`}
          title={`Grupo ${group.groupCode}`}
          description={t.calendar.fixtures}
          className="border-primary/15 bg-card/98"
        >
          <GroupTable group={group} />
          <div className="grid gap-2">
            {(matchesByGroup.get(group.groupCode) ?? []).map((match) => <CompactFixture key={match.matchId} match={match} />)}
          </div>
        </AppSection>
      ))}
    </div>
  );
}

function GroupTable({ group }: { group: GroupStanding }) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded-[1.2rem] border border-border/70 bg-background/80">
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
            {timeFormatter.format(new Date(match.kickoffAt))} · {match.matchNumber ? t.calendar.matchNumber(match.matchNumber) : t.calendar.venueFallback}
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

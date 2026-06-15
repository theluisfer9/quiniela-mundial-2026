# Knockout Bracket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `Eliminatorias` tab that resolves the World Cup 2026 knockout bracket from the current Convex-backed group standings.

**Architecture:** Extend public calendar team summaries with `worldRanking` so web helpers can calculate direct group qualifiers and best third-place teams from the same data used by `Grupos`. Keep bracket definition as a pure frontend data model for phase 1, resolving slots like `1A`, `2B`, and third-place pools like `3 CEFHI` against current standings.

**Tech Stack:** Convex validators/query, React/TanStack Router, TypeScript helpers, Bun tests, Tailwind classes.

---

### Task 1: Expose Ranking In Calendar Data

**Files:**
- Modify: `packages/backend/convex/matches.ts`
- Test: `packages/backend/convex/publicDashboard.test.ts`
- Modify types: `apps/web/src/lib/calendar-groups.ts`

- [ ] Add `worldRanking?: number` to `calendarTeamSummary` validator and `summarizeCalendarMatch` team objects.
- [ ] Extend calendar test expectations so group calendar output includes ranking for seeded teams.
- [ ] Update `CalendarTeamSummary` type to carry ranking into web helpers.
- [ ] Run `bun test packages/backend/convex/publicDashboard.test.ts`.

### Task 2: Bracket Helpers

**Files:**
- Create: `apps/web/src/lib/knockout-bracket.ts`
- Create: `apps/web/src/lib/knockout-bracket.test.ts`
- Modify: `apps/web/src/lib/calendar-groups.ts` if standings need explicit group rank metadata.

- [ ] Define slot types for direct group rank, third-place pool, winner placeholder, and final placeholder.
- [ ] Define 16avos bracket entries from the supplied bracket image.
- [ ] Add tests for resolving `1A` and `2B` from current group standings.
- [ ] Add tests for selecting best third-place teams by points, goal difference, goals for, then lowest FIFA ranking.
- [ ] Add tests for resolving a third-place pool to the best available qualifying third from allowed groups.
- [ ] Implement minimal helper functions.
- [ ] Run `bun test apps/web/src/lib/knockout-bracket.test.ts apps/web/src/lib/calendar-groups.test.ts`.

### Task 3: Eliminatorias UI

**Files:**
- Modify: `apps/web/src/routes/calendario.tsx`
- Modify: `apps/web/src/lib/i18n.tsx`

- [ ] Add `knockout` to `CalendarTab` and render a third tab labelled `Eliminatorias`.
- [ ] Add a round selector: `16avos`, `Octavos`, `Cuartos`, `Semis`, `Final`.
- [ ] Render only the selected round as compact cards.
- [ ] Each card shows date/city, match label, resolved teams when available, otherwise slot placeholder.
- [ ] Keep mobile single-column and avoid full bracket canvas in phase 1.
- [ ] Run `bun run check-types`.

### Task 4: Verification And Deploy

**Files:**
- No new files unless generated Convex API changes.

- [ ] Run `bun test apps/web/src/lib/knockout-bracket.test.ts apps/web/src/lib/calendar-groups.test.ts packages/backend/convex/publicDashboard.test.ts`.
- [ ] Run `bun run check-types`.
- [ ] Deploy Convex backend from `packages/backend` if `matches.ts` changed.
- [ ] Deploy web with `bun run deploy`.

# Unified Public Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/dashboard` the single rich public dashboard and reduce `/` to a concise landing summary.

**Architecture:** Add one richer Convex public analytics query that exposes aggregate-only dashboard data from finished matches and safe consensus data from matches that have started or finished. Refactor web UI so `/dashboard` renders the complete board, while `/` shows a compact preview and links to `/dashboard` instead of duplicating the full board under `/#tablero`.

**Tech Stack:** Convex queries, React 19, TanStack Router, Tailwind/shadcn-style UI components, Bun tests.

---

### Task 1: Public Analytics Query

**Files:**
- Modify: `packages/backend/convex/standings.ts`
- Test: `packages/backend/convex/publicDashboard.test.ts`

- [ ] Add a `getPublicDashboardAnalytics` query returning aggregate rows only: `rank`, `name`, `points`, `exactScoreCount`, `outcomeHitCount`, `predictionCount`, `precision`, `leaderGap`, `rankDelta`, `currentStreak`, `longestStreak`, `nearMissCount`, `drawPredictionCount`, `mostCommonScore`.
- [ ] Include `awardCards` for Nostradamus, Más exactos, Mejor racha, Señor empate, Rey del 1-0, and Tragedias.
- [ ] Include `consensusMatches` only for matches with `status !== "scheduled"`, summarizing counts for home/draw/away without exposing individual private picks.
- [ ] Add tests proving inactive/no-PIN/legacy-only profiles are excluded, private scheduled predictions are not exposed, and finished-match metrics calculate correctly.

### Task 2: Dashboard Page UI

**Files:**
- Replace: `apps/web/src/routes/dashboard.tsx`
- Create: `apps/web/src/lib/dashboard-analytics.ts`
- Optional create: `apps/web/src/components/dashboard/*.tsx` if the page gets too large.

- [ ] Replace the current PIN-access `/dashboard` page with public dashboard content.
- [ ] Render hero summary cards, complete standings table, awards grid, streaks/precision panels, and consensus cards.
- [ ] Use empty states when no matches have finished yet.
- [ ] Keep visual language consistent with current rounded card/header style.

### Task 3: Home Becomes Summary Only

**Files:**
- Modify: `apps/web/src/routes/index.tsx`
- Modify: `apps/web/src/components/header.tsx` if needed.

- [ ] Remove the full `#tablero` duplication from Home.
- [ ] Keep PIN/“already inside” hero.
- [ ] Show a compact preview: top 3 standings, next matches, and a CTA button to `/dashboard`.
- [ ] Ensure existing `Tablero` nav points to `/dashboard`, not `/#tablero`.

### Task 4: Verification

**Files:**
- Modify/add tests as needed.

- [ ] Run `bun run check-types`.
- [ ] Run `bun test packages/backend/convex` or targeted Convex tests.
- [ ] Run `bun test apps/web/src/lib`.
- [ ] Build with `bun run build`.
- [ ] Manually verify: `/` is summary, `/dashboard` is rich board, no scheduled private picks leak.

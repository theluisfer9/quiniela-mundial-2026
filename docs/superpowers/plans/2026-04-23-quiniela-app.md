# Quiniela App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable version of the family World Cup 2026 quiniela: branded home screen, family standings, match-by-match prediction flow with autosave, and match-level pick privacy.

**Architecture:** Keep the backend thin and explicit in Convex: store matches, predictions, and profile metadata; compute standings from results instead of introducing premature snapshot systems. On the web app, replace the starter scaffold with a mobile-first home screen and a focused prediction flow built from small route-level sections and a shared visual token layer.

**Tech Stack:** React 19, TanStack Router, Convex, Better Auth, Tailwind CSS v4 via shared `packages/ui`, Bun test, TypeScript.

---

## File Structure

### Backend

- Modify: `packages/backend/convex/schema.ts`
  Purpose: define app tables for profiles, teams, matches, predictions, and optional match results.
- Create: `packages/backend/convex/lib/scoring.ts`
  Purpose: pure score/points helpers for exact score vs outcome scoring.
- Create: `packages/backend/convex/lib/visibility.ts`
  Purpose: pure helpers for `isMatchLocked` and `canRevealPrediction`.
- Create: `packages/backend/convex/lib/scoring.test.ts`
  Purpose: regression tests for standings math.
- Create: `packages/backend/convex/lib/visibility.test.ts`
  Purpose: regression tests for match-level lock/reveal rules.
- Create: `packages/backend/convex/profiles.ts`
  Purpose: ensure every authenticated user has a friendly profile record for standings.
- Create: `packages/backend/convex/matches.ts`
  Purpose: public queries for home screen and prediction flow plus internal/admin-safe mutations for seed data.
- Create: `packages/backend/convex/predictions.ts`
  Purpose: authenticated autosave mutation and “my predictions” query.
- Create: `packages/backend/convex/standings.ts`
  Purpose: public standings query computed from results plus hidden-pick-safe summary data.

### Web App

- Modify: `apps/web/src/routes/__root.tsx`
  Purpose: switch to light-only app shell, metadata, and global frame.
- Modify: `apps/web/src/routes/index.tsx`
  Purpose: replace scaffold home with actual quiniela landing/dashboard experience.
- Modify: `apps/web/src/routes/dashboard.tsx`
  Purpose: turn current auth route into account gate and redirect behavior instead of being the main product page.
- Create: `apps/web/src/routes/pronosticos.tsx`
  Purpose: prediction flow route.
- Create: `apps/web/src/components/home/home-hero.tsx`
  Purpose: CTA hero with pending-match summary.
- Create: `apps/web/src/components/home/standings-card.tsx`
  Purpose: visually dominant family standings block.
- Create: `apps/web/src/lib/standings-ui.ts`
  Purpose: derive current-user emphasis, rank delta indicators, and compact standings labels.
- Create: `apps/web/src/components/home/upcoming-matches.tsx`
  Purpose: pending/upcoming match preview list.
- Create: `apps/web/src/components/home/empty-tournament.tsx`
  Purpose: first-time / no-data hybrid state.
- Create: `apps/web/src/components/predictions/prediction-card.tsx`
  Purpose: one-match-at-a-time scoring card with autosave state.
- Create: `apps/web/src/components/predictions/prediction-progress.tsx`
  Purpose: remaining-match progress and next/previous navigation.
- Create: `apps/web/src/lib/home-data.ts`
  Purpose: route-level view-model shaping for home screen sections.
- Create: `apps/web/src/lib/prediction-copy.ts`
  Purpose: central microcopy helpers for pending, saved, locked, and reveal states.
- Create: `apps/web/src/lib/privacy-copy.ts`
  Purpose: central user-facing explanations for lock timing and pick reveal timing.
- Modify: `apps/web/src/components/header.tsx`
  Purpose: simplify navigation around `Inicio`, `Pronósticos`, and account state.
- Modify: `apps/web/src/components/sign-in-form.tsx`
  Purpose: align auth copy and styling with the new product language.
- Modify: `apps/web/src/components/sign-up-form.tsx`
  Purpose: same as sign-in.
- Modify: `apps/web/src/components/user-menu.tsx`
  Purpose: support product-level navigation and clearer account affordances.

### Shared UI / Styling

- Modify: `packages/ui/src/styles/globals.css`
  Purpose: replace generic dark/light starter tokens with the light-only FIFA-2026-inspired palette and rounded component tokens.
- Create: `packages/ui/src/components/app-section.tsx`
  Purpose: simple section wrapper for repeated branded blocks without over-nesting cards.
- Create: `packages/ui/src/components/score-input.tsx`
  Purpose: reusable numeric input for score entry.

## Task 1: Define The Domain Model And Pure Rules

**Files:**
- Modify: `packages/backend/convex/schema.ts`
- Create: `packages/backend/convex/lib/scoring.ts`
- Create: `packages/backend/convex/lib/visibility.ts`
- Test: `packages/backend/convex/lib/scoring.test.ts`
- Test: `packages/backend/convex/lib/visibility.test.ts`

- [ ] **Step 1: Write the failing scoring test**

```ts
import { describe, expect, test } from "bun:test";
import { calculatePredictionPoints } from "./scoring";

describe("calculatePredictionPoints", () => {
  test("gives 3 points for exact score", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 1,
      }),
    ).toBe(3);
  });

  test("gives 1 point for correct outcome only", () => {
    expect(
      calculatePredictionPoints({
        predictedHome: 1,
        predictedAway: 0,
        actualHome: 3,
        actualAway: 2,
      }),
    ).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/backend/convex/lib/scoring.test.ts`
Expected: FAIL because `./scoring` does not exist yet.

- [ ] **Step 3: Write the failing visibility test**

```ts
import { describe, expect, test } from "bun:test";
import { canRevealPrediction, isMatchLocked } from "./visibility";

describe("match visibility", () => {
  test("locks a match at kickoff", () => {
    const kickoff = new Date("2026-06-11T18:00:00.000Z");
    expect(isMatchLocked({ kickoff, now: kickoff })).toBe(true);
  });

  test("reveals picks only once the match starts", () => {
    const kickoff = new Date("2026-06-11T18:00:00.000Z");
    expect(canRevealPrediction({ kickoff, now: new Date("2026-06-11T17:59:59.000Z") })).toBe(false);
    expect(canRevealPrediction({ kickoff, now: kickoff })).toBe(true);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `bun test packages/backend/convex/lib/visibility.test.ts`
Expected: FAIL because `./visibility` does not exist yet.

- [ ] **Step 5: Implement minimal pure helpers and schema**

```ts
export function calculatePredictionPoints(input: {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
}) {
  const exact = input.predictedHome === input.actualHome && input.predictedAway === input.actualAway;
  if (exact) return 3;

  const predictedDiff = Math.sign(input.predictedHome - input.predictedAway);
  const actualDiff = Math.sign(input.actualHome - input.actualAway);
  return predictedDiff === actualDiff ? 1 : 0;
}
```

```ts
export function isMatchLocked({ kickoff, now }: { kickoff: Date; now: Date }) {
  return now >= kickoff;
}

export function canRevealPrediction({ kickoff, now }: { kickoff: Date; now: Date }) {
  return now >= kickoff;
}
```

```ts
export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    displayName: v.string(),
  }).index("by_user_id", ["userId"]),
  teams: defineTable({
    code: v.string(),
    name: v.string(),
    flagEmoji: v.optional(v.string()),
  }).index("by_code", ["code"]),
  matches: defineTable({
    kickoffAt: v.string(),
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    stageLabel: v.string(),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("finished")),
  }).index("by_kickoff", ["kickoffAt"]),
  predictions: defineTable({
    userId: v.string(),
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
    updatedAt: v.string(),
  })
    .index("by_user_match", ["userId", "matchId"])
    .index("by_match", ["matchId"]),
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun test packages/backend/convex/lib/scoring.test.ts packages/backend/convex/lib/visibility.test.ts`
Expected: PASS.

- [ ] **Step 7: Run type verification**

Run: `bun run check-types`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/backend/convex/schema.ts packages/backend/convex/lib/scoring.ts packages/backend/convex/lib/visibility.ts packages/backend/convex/lib/scoring.test.ts packages/backend/convex/lib/visibility.test.ts
git commit -m "feat: add quiniela domain model"
```

## Task 2: Build Convex Queries And Mutations For Home, Predictions, And Standings

**Files:**
- Create: `packages/backend/convex/profiles.ts`
- Create: `packages/backend/convex/matches.ts`
- Create: `packages/backend/convex/predictions.ts`
- Create: `packages/backend/convex/standings.ts`
- Modify: `packages/backend/convex/privateData.ts`

- [ ] **Step 1: Write a failing standings test against pure aggregation logic**

```ts
import { describe, expect, test } from "bun:test";
import { buildStandingsRows } from "./scoring";

describe("buildStandingsRows", () => {
  test("sorts by points descending then name", () => {
    const rows = buildStandingsRows([
      { name: "Luis", points: 3 },
      { name: "Ana", points: 6 },
      { name: "Beto", points: 3 },
    ]);

    expect(rows.map((row) => row.name)).toEqual(["Ana", "Beto", "Luis"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/backend/convex/lib/scoring.test.ts`
Expected: FAIL because `buildStandingsRows` is missing.

- [ ] **Step 3: Extend pure helpers with sorted standings rows and rank movement shape**

Implement `buildStandingsRows` so it returns:

```ts
type StandingsRow = {
  rank: number;
  name: string;
  points: number;
  rankDelta: -1 | 0 | 1;
  isCurrentUser: boolean;
};
```

- [ ] **Step 4: Run pure tests again**

Run: `bun test packages/backend/convex/lib/scoring.test.ts packages/backend/convex/lib/visibility.test.ts`
Expected: PASS with new aggregation helper covered.

- [ ] **Step 5: Add `profiles.ensureCurrentProfile` mutation**

Purpose: create a friendly profile record on first authenticated use.

- [ ] **Step 6: Add `matches.listHomeMatches` query**

Purpose: upcoming matches, pending count, and next kickoff summary for the home screen.

- [ ] **Step 7: Add `predictions.upsertPrediction` mutation**

Requirements:

- enforce match-level lock using `isMatchLocked`
- return autosave-friendly payload
- never expose another user's prediction

Use this shape for the autosave mutation result:

```ts
return {
  status: "saved",
  matchId,
  updatedAt,
};
```

- [ ] **Step 8: Add `predictions.listMyPredictions` query**

Purpose: return only the signed-in user's saved scores for the prediction flow.

- [ ] **Step 9: Add `standings.getHomeStandings` query**

Purpose: join profiles, finished matches, and predictions into rows that already include `rank`, `rankDelta`, and `isCurrentUser`.

- [ ] **Step 10: Run type verification**

Run: `bun run check-types`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add packages/backend/convex/profiles.ts packages/backend/convex/matches.ts packages/backend/convex/predictions.ts packages/backend/convex/standings.ts packages/backend/convex/privateData.ts packages/backend/convex/lib/scoring.ts packages/backend/convex/lib/scoring.test.ts
git commit -m "feat: add quiniela backend queries"
```

## Task 3: Replace Global Tokens With The World Cup Visual System

**Files:**
- Modify: `packages/ui/src/styles/globals.css`
- Create: `packages/ui/src/components/app-section.tsx`
- Create: `packages/ui/src/components/score-input.tsx`
- Modify: `apps/web/src/routes/__root.tsx`

- [ ] **Step 1: Write a failing visual token test via type/build check**

Create the new components with imports from tokens that do not exist yet, then let the build fail.

```tsx
export function AppSection({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-4xl bg-card text-card-foreground", className)} {...props} />;
}
```

- [ ] **Step 2: Run type/build check to verify it fails**

Run: `bun run check-types`
Expected: FAIL until `cn` import, new token classes, and component files are wired correctly.

- [ ] **Step 3: Update shared color and radius tokens in `globals.css`**

Update `globals.css` to:

- remove dark-mode dependence from the product shell
- set warm off-white background
- use deep navy text
- define vivid red primary, green accent, and supporting festive colors
- increase large radius tokens for friendly surfaces
- set new font variables for display/body pairing placeholders

Update `__root.tsx` to:

- default to light-only app shell
- remove theme toggle requirement from the primary UX
- set product metadata (`title`, `description`) to the actual quiniela brand

- [ ] **Step 4: Update the root app shell in `__root.tsx`**

- [ ] **Step 5: Run verification**

Run: `bun run check-types`
Expected: PASS.

- [ ] **Step 6: Manual visual smoke check**

Run: `bun run dev:web`
Expected: the app shell renders in light mode only, with warm background and no dependence on theme toggling.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/styles/globals.css packages/ui/src/components/app-section.tsx packages/ui/src/components/score-input.tsx apps/web/src/routes/__root.tsx
git commit -m "feat: add quiniela visual system"
```

## Task 4: Implement The Home Screen Skeleton And Empty State

**Files:**
- Modify: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/components/home/home-hero.tsx`
- Create: `apps/web/src/components/home/standings-card.tsx`
- Create: `apps/web/src/components/home/upcoming-matches.tsx`
- Create: `apps/web/src/components/home/empty-tournament.tsx`
- Create: `apps/web/src/lib/home-data.ts`
- Create: `apps/web/src/lib/standings-ui.ts`

- [ ] **Step 1: Write a failing view-model test**

Create `apps/web/src/lib/home-data.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { getHomeState } from "./home-data";

describe("getHomeState", () => {
  test("returns empty state when there are no matches", () => {
    expect(getHomeState({ standings: [], matches: [], predictions: [] }).kind).toBe("empty");
  });

  test("marks the current user row and movement in pending state", () => {
    const state = getHomeState({
      standings: [{ name: "Luis", points: 6, rank: 1, rankDelta: 1, isCurrentUser: true }],
      matches: [{ _id: "m1", kickoffAt: "2026-06-11T18:00:00.000Z" }],
      predictions: [],
    });

    expect(state.kind).toBe("pending");
    expect(state.standings[0].isCurrentUser).toBe(true);
    expect(state.standings[0].rankDelta).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/lib/home-data.test.ts`
Expected: FAIL because `getHomeState` is missing.

- [ ] **Step 3: Implement `getHomeState` and `standings-ui` helpers**

Helpers must derive:

- `empty`, `pending`, and `upToDate` variants
- current-user summary for the hero
- standings row emphasis metadata
- rank movement display metadata (`sube`, `baja`, `sin cambio`)

- [ ] **Step 4: Create `EmptyTournament` and `HomeHero`**

Ensure the empty state combines welcome guidance with tournament-not-started messaging, and the hero keeps `Pronosticar ahora` visually dominant.

- [ ] **Step 5: Create `StandingsCard` with row emphasis and movement indicators**

Requirements:

- current user row must be obvious at a glance
- rank movement must be visible but lightweight
- table must feel celebratory, not dashboard-heavy

- [ ] **Step 6: Create `UpcomingMatches` and wire `index.tsx`**

Render three home variants:

- `empty`: welcome/onboarding plus tournament-not-started messaging
- `pending`: hero CTA, dominant standings card, urgency, upcoming matches
- `upToDate`: softer CTA, standings, upcoming matches

Use a route component pattern like:

```tsx
const state = getHomeState({ standings, matches, predictions });

if (state.kind === "empty") {
  return <EmptyTournament />;
}

return (
  <main>
    <HomeHero state={state} />
      <StandingsCard rows={state.standings} currentUserSummary={state.currentUserSummary} />
      <UpcomingMatches matches={state.matches} />
  </main>
);
```

- [ ] **Step 7: Run tests and type verification**

Run: `bun test apps/web/src/lib/home-data.test.ts && bun run check-types`
Expected: PASS.

- [ ] **Step 8: Manual home-screen QA**

Run: `bun run dev:web`
Expected: on a mobile-width viewport, the CTA reads first, the standings block is visibly dominant, and the current user's row is immediately identifiable.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/routes/index.tsx apps/web/src/components/home/home-hero.tsx apps/web/src/components/home/standings-card.tsx apps/web/src/components/home/upcoming-matches.tsx apps/web/src/components/home/empty-tournament.tsx apps/web/src/lib/home-data.ts apps/web/src/lib/home-data.test.ts apps/web/src/lib/standings-ui.ts
git commit -m "feat: add quiniela home screen"
```

## Task 5: Build The Match-Card Prediction Flow With Autosave

**Files:**
- Create: `apps/web/src/routes/pronosticos.tsx`
- Create: `apps/web/src/components/predictions/prediction-card.tsx`
- Create: `apps/web/src/components/predictions/prediction-progress.tsx`
- Create: `apps/web/src/lib/prediction-copy.ts`
- Create: `apps/web/src/lib/privacy-copy.ts`
- Modify: `packages/ui/src/components/score-input.tsx`

- [ ] **Step 1: Write the failing copy/state test**

Create `apps/web/src/lib/prediction-copy.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { getPredictionStatusCopy } from "./prediction-copy";
import { getPrivacyStatusCopy } from "./privacy-copy";

describe("getPredictionStatusCopy", () => {
  test("shows saved copy", () => {
    expect(getPredictionStatusCopy("saved")).toBe("Pronóstico guardado");
  });

  test("explains reveal timing before kickoff", () => {
    expect(getPrivacyStatusCopy("hiddenUntilKickoff")).toBe(
      "Los pronósticos de los demás se muestran cuando empieza el partido",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/lib/prediction-copy.test.ts`
Expected: FAIL because helper does not exist yet.

- [ ] **Step 3: Implement copy helpers for autosave, lock, and privacy messaging**

Include at least these labels:

- `Pronóstico guardado`
- `Guardando...`
- `No se pudo guardar`
- `Este partido ya empezó`
- `Los pronósticos de los demás se muestran cuando empieza el partido`

- [ ] **Step 4: Create `prediction-progress.tsx`**

Requirements:

- show remaining match count
- show next/previous controls
- show concise lock/reveal helper text

- [ ] **Step 5: Create `prediction-card.tsx` and wire autosave states**

Requirements:

- one match visible at a time on mobile
- score inputs large and numeric
- autosave mutation triggered on explicit score change completion
- save states: `idle`, `saving`, `saved`, `error`, `locked`
- next/previous controls and progress summary
- locked matches render read-only with explicit reveal-safe language

Recommended route shape:

```tsx
export const Route = createFileRoute("/pronosticos")({
  component: PredictionsRoute,
});
```

- [ ] **Step 6: Wire `pronosticos.tsx` to Convex queries and mutations**

The route must load only the current user's predictions and must never request another user's picks for pre-kickoff display.

- [ ] **Step 7: Run tests and type verification**

Run: `bun test apps/web/src/lib/prediction-copy.test.ts && bun run check-types`
Expected: PASS.

- [ ] **Step 8: Manual prediction-flow QA**

Run: `bun run dev:web`
Expected: autosave states are understandable, locked matches cannot be edited, and privacy messaging clearly explains reveal timing.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/routes/pronosticos.tsx apps/web/src/components/predictions/prediction-card.tsx apps/web/src/components/predictions/prediction-progress.tsx apps/web/src/lib/prediction-copy.ts apps/web/src/lib/prediction-copy.test.ts apps/web/src/lib/privacy-copy.ts packages/ui/src/components/score-input.tsx
git commit -m "feat: add prediction card flow"
```

## Task 6: Integrate Auth, Navigation, And Product Copy

**Files:**
- Modify: `apps/web/src/components/header.tsx`
- Modify: `apps/web/src/routes/dashboard.tsx`
- Modify: `apps/web/src/components/sign-in-form.tsx`
- Modify: `apps/web/src/components/sign-up-form.tsx`
- Modify: `apps/web/src/components/user-menu.tsx`

- [ ] **Step 1: Write a failing navigation smoke test in a pure helper**

Create `apps/web/src/lib/navigation.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { getPrimaryNavItems } from "./navigation";

describe("getPrimaryNavItems", () => {
  test("includes inicio and pronosticos", () => {
    expect(getPrimaryNavItems().map((item) => item.label)).toEqual(["Inicio", "Pronósticos"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/lib/navigation.test.ts`
Expected: FAIL because helper is missing.

- [ ] **Step 3: Create `apps/web/src/lib/navigation.ts` helper**

Return the main nav model from one place so header and account surfaces stay consistent.

- [ ] **Step 4: Update `header.tsx` and `dashboard.tsx`**

Make `dashboard.tsx` an auth gate / redirect shell instead of a second product home.

- [ ] **Step 5: Update auth forms and user menu**

Make these changes:

- `header.tsx`: product logo/title, `Inicio`, `Pronósticos`, authenticated account affordance
- `dashboard.tsx`: auth gate / redirect shell rather than the main product experience
- auth forms: rewrite copy in warm, family-friendly Spanish and align styling to the new surface tokens
- `user-menu.tsx`: friendly account summary and sign-out action

- [ ] **Step 6: Run tests and type verification**

Run: `bun test apps/web/src/lib/navigation.test.ts && bun run check-types`
Expected: PASS.

- [ ] **Step 7: Manual auth/navigation QA**

Run: `bun run dev:web`
Expected: `Inicio` and `Pronósticos` are obvious, auth screens match the branded system, and account actions remain straightforward.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/header.tsx apps/web/src/routes/dashboard.tsx apps/web/src/components/sign-in-form.tsx apps/web/src/components/sign-up-form.tsx apps/web/src/components/user-menu.tsx apps/web/src/lib/navigation.ts apps/web/src/lib/navigation.test.ts
git commit -m "feat: align auth and navigation with quiniela app"
```

## Task 7: Final Verification And Manual QA Pass

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README with product-specific setup notes**

Add short sections for:

- required Convex seed data for teams and matches
- how match locking works
- how pick visibility works

- [ ] **Step 2: Run full verification**

Run: `bun test && bun run check-types && bun run build`
Expected: PASS.

- [ ] **Step 3: Manual QA checklist**

Verify in browser:

- home screen reads clearly on mobile width
- standings table is visually dominant but readable
- `Pronosticar ahora` is always obvious
- autosave feedback is visible and trustworthy
- locked matches cannot be edited
- other users' picks are hidden before kickoff

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add quiniela product setup notes"
```

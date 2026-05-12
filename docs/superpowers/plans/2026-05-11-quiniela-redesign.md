# Quiniela Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the quiniela app so the full experience feels lively, sporty, and unmistakably tied to the World Cup 2026, while preserving the existing product flow.

**Architecture:** Keep the existing app structure and data flow, but replace the visual system, home composition, and prediction card treatment with a stronger design language. The redesign should be implemented as a series of focused UI tasks: tokens and typography first, then home/leaderboard treatment, then prediction cards, then auth and shell polish.

**Tech Stack:** React 19, TanStack Router, Convex, Tailwind CSS v4, shared `packages/ui`, Bun test, TypeScript.

---

## File Structure

- Modify: `packages/ui/src/styles/globals.css`
  Purpose: replace current visual tokens with the approved World Cup palette and typography setup.
- Modify: `apps/web/src/routes/__root.tsx`
  Purpose: load font classes and keep the shell coherent with the redesign.
- Modify: `apps/web/src/components/header.tsx`
  Purpose: stronger branded navigation treatment.
- Modify: `apps/web/src/components/home/home-hero.tsx`
  Purpose: redesign hero with stronger event identity and CTA treatment.
- Modify: `apps/web/src/components/home/standings-card.tsx`
  Purpose: convert standings into hybrid leaderboard with special top 3 treatment.
- Modify: `apps/web/src/components/home/upcoming-matches.tsx`
  Purpose: make fixtures block feel more event-driven and less generic.
- Modify: `apps/web/src/components/home/empty-tournament.tsx`
  Purpose: align no-data state with the new identity.
- Modify: `apps/web/src/components/predictions/prediction-card.tsx`
  Purpose: make prediction cards feel like match pieces instead of forms.
- Modify: `apps/web/src/components/predictions/prediction-progress.tsx`
  Purpose: strengthen progress/navigation rhythm.
- Modify: `apps/web/src/components/sign-in-form.tsx`
  Purpose: redesign auth surface to match the app.
- Modify: `apps/web/src/components/sign-up-form.tsx`
  Purpose: same as sign-in.
- Modify: `apps/web/src/components/user-menu.tsx`
  Purpose: align account affordance with the new shell.
- Modify: `apps/web/src/lib/standings-ui.ts`
  Purpose: support top-3 treatment and movement semantics.
- Add or update tests in:
  - `apps/web/src/lib/standings-ui.test.ts`
  - `apps/web/src/lib/home-data.test.ts`
  - any minimal visual-state helpers needed

## Task 1: Install The Final Typography And Color System

**Files:**
- Modify: `packages/ui/src/styles/globals.css`
- Modify: `apps/web/src/routes/__root.tsx`

- [ ] **Step 1: Write a small failing token/typography test or assertion target**

Add a focused test or static assertion helper for the approved font names / color role exports if you choose to expose them from a helper. If no helper exists, use `bun run check-types` as the red/green gate for this task.

- [ ] **Step 2: Verify current state fails the approved design direction**

Run: `bun run --filter web check-types`
Expected: PASS technically, but current token values still use the older system and no approved font pairing is wired.

- [ ] **Step 3: Update global tokens**

Implement the approved palette mapping:

- structural blue: `#2A398D`
- action red: `#E61D25`
- progress green: `#3CAC3B`
- supporting neutrals: `#D1D4D1`, `#474A4A`

Use these as the actual semantic roles for:

- `--foreground`: dark neutral / deep structural ink close to `#474A4A`
- `--primary`: CTA red `#E61D25`
- `--accent`: progress green `#3CAC3B`
- shell / structural emphasis / branded surfaces: blue `#2A398D`
- `--muted`, borders, and low-emphasis surfaces: light neutral `#D1D4D1` family
- rings and focus states must remain highly visible against the light shell

Gray must never become the dominant emotional color of the screen.

- [ ] **Step 4: Wire the approved font pairing**

Implement:

- `Bricolage Grotesque` for display/headings/rank emphasis
- `Manrope` for body/UI text

Do this in the app shell so the pairing is available throughout the product.

- [ ] **Step 5: Run verification**

Run: `bun run check-types`
Expected: PASS.

- [ ] **Step 6: Manual shell QA**

Verify in browser:

- shell is unmistakably light-only
- blue feels structurally dominant
- red is reserved for CTA/urgency
- green reads as progress/success only
- Bricolage Grotesque and Manrope both visibly apply

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/styles/globals.css apps/web/src/routes/__root.tsx
git commit -m "feat: apply World Cup typography and palette"
```

## Task 2: Redesign The Home Hero And Global Home Rhythm

**Files:**
- Modify: `apps/web/src/components/home/home-hero.tsx`
- Modify: `apps/web/src/components/home/upcoming-matches.tsx`
- Modify: `apps/web/src/components/home/empty-tournament.tsx`
- Modify if needed: `apps/web/src/lib/home-data.ts`

- [ ] **Step 1: Write/update a failing view-model test for redesigned hero assumptions**

Add a test ensuring the home model still exposes enough information for:

- current-user summary
- pending prediction urgency
- next kickoff summary

- [ ] **Step 2: Run the helper test to verify the current assumptions are explicit**

Run: `bun test apps/web/src/lib/home-data.test.ts`
Expected: FAIL if you added a new expectation.

- [ ] **Step 3: Redesign `home-hero.tsx`**

Requirements:

- stronger display typography
- more event-like visual treatment
- blue-led structure with red CTA emphasis
- current-user summary still obvious

- [ ] **Step 4: Redesign `upcoming-matches.tsx` and `empty-tournament.tsx`**

Requirements:

- fixtures feel sporty and alive
- empty state feels like event onboarding, not placeholder UI
- maintain warm Spanish copy

- [ ] **Step 5: Run verification**

Run: `bun test apps/web/src/lib/home-data.test.ts && bun run --filter web check-types`
Expected: PASS.

- [ ] **Step 6: Manual home hierarchy QA**

Verify the home order is still explicit and correct:

1. hero CTA
2. personal summary
3. leaderboard emphasis
4. closings / urgency
5. upcoming matches
6. direct access to continue predictions

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/home/home-hero.tsx apps/web/src/components/home/upcoming-matches.tsx apps/web/src/components/home/empty-tournament.tsx apps/web/src/lib/home-data.ts apps/web/src/lib/home-data.test.ts
git commit -m "feat: redesign home hero and fixtures"
```

## Task 3: Turn Standings Into A Hybrid Leaderboard

**Files:**
- Modify: `apps/web/src/components/home/standings-card.tsx`
- Modify: `apps/web/src/lib/standings-ui.ts`
- Modify: `apps/web/src/lib/standings-ui.test.ts`

- [ ] **Step 1: Add a failing `standings-ui` test for top-3 treatment metadata**

Add tests for:

- identifying top 3 rows
- preserving current-user highlight outside top 3
- movement labels staying lightweight

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/lib/standings-ui.test.ts`
Expected: FAIL with missing top-3 metadata or new expectations.

- [ ] **Step 3: Extend `standings-ui.ts`**

Add the minimal view metadata needed to render:

- top 3 special cards or podium treatment
- current-user emphasis
- movement chip semantics

- [ ] **Step 4: Redesign `standings-card.tsx`**

Requirements:

- top 3 visually special and memorable
- rest of standings compact and easy to scan
- table/list remains accessible
- current user still obvious at a glance
- row/column relationships remain semantic and screen-reader-friendly
- movement cannot rely on color alone

- [ ] **Step 5: Run verification**

Run: `bun test apps/web/src/lib/standings-ui.test.ts && bun run --filter web check-types`
Expected: PASS.

- [ ] **Step 6: Manual leaderboard QA**

Verify:

- top 3 stands out without overwhelming the screen
- current user is easy to find outside top 3
- table headers remain clear
- movement is still understandable without depending only on color

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/home/standings-card.tsx apps/web/src/lib/standings-ui.ts apps/web/src/lib/standings-ui.test.ts
git commit -m "feat: redesign family leaderboard"
```

## Task 4: Redesign Prediction Cards And Progress

**Files:**
- Modify: `apps/web/src/components/predictions/prediction-card.tsx`
- Modify: `apps/web/src/components/predictions/prediction-progress.tsx`
- Modify if needed: `apps/web/src/lib/prediction-copy.ts`
- Modify if needed: `apps/web/src/lib/privacy-copy.ts`
- Modify if needed: `packages/ui/src/components/score-input.tsx`

- [ ] **Step 1: Add a failing helper or state test if copy/state contracts change**

Focus on any new state labels or route-truthful helper text introduced by the redesign.

- [ ] **Step 2: Verify RED**

Run: `bun test apps/web/src/lib/prediction-copy.test.ts apps/web/src/lib/privacy-copy.test.ts`
Expected: FAIL if expectations changed.

- [ ] **Step 3: Redesign `score-input.tsx` and `prediction-card.tsx`**

Requirements:

- teams read as the main object
- score entry feels large and touch-friendly
- stronger event identity without clutter
- locked / saving / saved states remain very clear

- [ ] **Step 4: Redesign `prediction-progress.tsx`**

Requirements:

- more momentum / game-like progress
- next/previous controls feel deliberate
- route-truthful helper text remains intact

- [ ] **Step 5: Run verification**

Run: `bun test apps/web/src/lib/prediction-copy.test.ts apps/web/src/lib/privacy-copy.test.ts && bun run --filter web check-types`
Expected: PASS.

- [ ] **Step 6: Manual prediction-flow QA**

Verify:

- one match stays visible at a time on mobile
- score inputs feel large enough to tap comfortably
- save / locked / error states are still obvious without relying on color alone
- card remains route-truthful about showing only the current user’s predictions

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/predictions/prediction-card.tsx apps/web/src/components/predictions/prediction-progress.tsx apps/web/src/lib/prediction-copy.ts apps/web/src/lib/privacy-copy.ts packages/ui/src/components/score-input.tsx
git commit -m "feat: redesign prediction experience"
```

## Task 5: Align Header, Auth Surfaces, And Account UI

**Files:**
- Modify: `apps/web/src/components/header.tsx`
- Modify: `apps/web/src/components/sign-in-form.tsx`
- Modify: `apps/web/src/components/sign-up-form.tsx`
- Modify: `apps/web/src/components/user-menu.tsx`
- Modify if needed: `apps/web/src/routes/dashboard.tsx`

- [ ] **Step 1: Add or update a failing navigation helper test if needed**

Keep the navigation contract explicit if any surface behavior changes.

- [ ] **Step 2: Verify RED**

Run: `bun test apps/web/src/lib/navigation.test.ts`
Expected: FAIL only if you updated the nav contract.

- [ ] **Step 3: Redesign `header.tsx`**

Requirements:

- more branded, still simple
- clearer tournament feel
- preserve accessibility and loading-state correctness
- `Inicio` and `Pronósticos` remain explicit and easy to tap
- account entry remains obvious in loading, signed-out, and signed-in states

- [ ] **Step 4: Redesign auth forms and user menu**

Requirements:

- keep warm Spanish copy
- no generic SaaS look
- consistent with the World Cup palette and new typography

- [ ] **Step 5: Run verification**

Run: `bun test apps/web/src/lib/navigation.test.ts && bun run --filter web check-types`
Expected: PASS.

- [ ] **Step 6: Manual navigation/auth QA**

Verify:

- `Inicio` and `Pronósticos` are always easy to find
- auth loading state does not flash the wrong CTA
- account entry remains obvious on mobile
- auth screens visually belong to the same product family

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/header.tsx apps/web/src/components/sign-in-form.tsx apps/web/src/components/sign-up-form.tsx apps/web/src/components/user-menu.tsx apps/web/src/routes/dashboard.tsx apps/web/src/lib/navigation.test.ts apps/web/src/lib/navigation.ts
git commit -m "feat: redesign shell and auth surfaces"
```

## Task 6: Final Visual QA And Documentation Notes

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README if the redesign introduces font/setup notes**

Add a short note only if needed for fonts, visual references, or design-system setup.

- [ ] **Step 2: Run full verification**

Run: `bun test apps/web/src/lib/home-data.test.ts apps/web/src/lib/standings-ui.test.ts apps/web/src/lib/prediction-copy.test.ts apps/web/src/lib/privacy-copy.test.ts apps/web/src/lib/navigation.test.ts && bun run check-types && bun run build`
Expected: PASS.

- [ ] **Step 3: Manual design QA checklist**

Verify in browser:

- the app no longer feels gray or lifeless
- blue is the structural dominant color
- red actions feel energetic but controlled
- green reads as progress/success, not noise
- top 3 leaderboard is memorable without breaking clarity
- prediction cards feel like match surfaces, not forms
- typography pairing is visible and coherent across home, auth, and prediction flow
- touch targets remain comfortable on mobile
- standings remain semantic and understandable for assistive tech
- focus states and skip-nav still work after the redesign

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: note redesign setup details"
```

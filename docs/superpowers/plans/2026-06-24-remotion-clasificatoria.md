# Remotion Clasificatoria Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Remotion video that animates the quiniela standings by day from a static snapshot.

**Architecture:** Add an isolated `apps/video` workspace. The composition reads `public/standings-snapshot.json`, computes per-frame day progress, and renders a visually rich race chart with podium, date ticker, motion accents, and rank movement.

**Tech Stack:** Remotion, React, TypeScript, Bun workspaces.

---

### Task 1: Snapshot Helpers

**Files:**
- Create: `apps/video/src/standings.ts`
- Create: `apps/video/src/standings.test.ts`

- [ ] Write tests for `getCurrentDay`, `getPreviousDay`, and `getBiggestMover`.
- [ ] Run `bun test apps/video/src/standings.test.ts` and confirm it fails because helpers do not exist.
- [ ] Implement the smallest helpers needed by the composition.
- [ ] Re-run the test and confirm it passes.

### Task 2: Remotion App

**Files:**
- Create: `apps/video/package.json`
- Create: `apps/video/tsconfig.json`
- Create: `apps/video/remotion.config.ts`
- Create: `apps/video/src/index.ts`
- Create: `apps/video/src/Root.tsx`
- Create: `apps/video/src/ClasificatoriaPorDia.tsx`
- Create: `apps/video/public/standings-snapshot.json`

- [ ] Add Remotion package scripts and dependencies.
- [ ] Register composition `ClasificatoriaPorDia` at 1920x1080, 30fps.
- [ ] Build the animated race chart from the snapshot JSON.
- [ ] Run `bun install` if dependencies are missing.
- [ ] Run `bun --filter video check-types`.
- [ ] Run a still render: `bun --filter video remotion still ClasificatoriaPorDia --frame=90 --scale=0.25`.

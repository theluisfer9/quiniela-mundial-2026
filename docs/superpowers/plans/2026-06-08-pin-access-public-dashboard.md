# PIN Access and Public Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email/password player access with pre-assigned PIN access and expose a public quiniela dashboard while preserving confidence through automated tests.

**Architecture:** Reuse `profiles` as the explicit Convex player table, add session/attempt tables, and move predictions from Better Auth `userId` to `playerId`. Private APIs validate a server-issued session token on every request; public APIs expose standings, match groups, and finished-match stats without auth. The web app stores the raw session token plus non-authoritative display cache locally for immediate UI, derives trusted player state through Convex, and keeps the existing prediction card flow.

**Tech Stack:** Bun, TypeScript, Convex, convex-test, React 19, TanStack Router, Vite, shadcn-style UI package.

---

## Scope And Constraints

- Source spec: `docs/superpowers/specs/2026-06-08-pin-access-public-dashboard-design.md`.
- Treat current prediction data as development/test data and reset it during seed/migration work unless the admin explicitly changes this before execution.
- Do not build an admin UI in this pass.
- Do not remove Better Auth packages in this pass; remove visible Better Auth usage from player flows.
- Keep edits minimal and follow current file organization.
- Use TDD for behavior and security-sensitive paths.
- Verify with backend tests, frontend helper tests, workspace type checks, build, and manual smoke checklist.

## File Structure

### Backend

- Create `packages/backend/convex/lib/pinAccess.ts`: pure helpers for PIN normalization, token generation, token hashing, PIN hashing, expiration, shared `PIN_PEPPER` access, and safe constants.
- Create `packages/backend/convex/lib/pinAccess.test.ts`: pure helper tests.
- Create `packages/backend/convex/players.ts`: Convex mutations/queries for `loginWithPin`, `getCurrentPlayer`, and `logout`.
- Create `packages/backend/convex/players.test.ts`: Convex handler tests for login/session/security behavior.
- Modify `packages/backend/convex/schema.ts`: adapt `profiles` into the player table, add `playerSessions`, `pinLoginAttempts`; change `predictions.userId` to `predictions.playerId`; add indexes.
- Modify `packages/backend/convex/profiles.ts`: remove or rewrite Better Auth profile creation so the backend compiles after `profiles.userId` is removed.
- Modify `packages/backend/convex/predictions.ts`: accept `sessionToken`, resolve player server-side, upsert/list by `playerId`.
- Modify `packages/backend/convex/matches.ts`: add public dashboard query and private player-aware home matches query.
- Modify `packages/backend/convex/standings.ts`: add public standings query and switch private standings to player identity if still needed.
- Modify `packages/backend/convex/lib/scoring.ts`: migrate scoring input from `userId` to `playerId` and support public rows with no current player.
- Modify `packages/backend/convex/seed.ts`: seed players and reset predictions/sessions/attempts when confirmed.
- Modify `packages/backend/convex/seed.test.ts`: assert player seed behavior and no plaintext PIN storage.
- Modify or replace `packages/backend/convex/task2.handlers.test.ts`: update old auth tests to PIN/session tests.

### Frontend

- Create `apps/web/src/lib/player-session.ts`: localStorage key, parse/store/clear session helpers, session token normalization, non-authoritative display-name cache.
- Create `apps/web/src/lib/player-session.test.ts`: helper tests with mocked storage.
- Create `apps/web/src/lib/pin-entry.ts`: PIN normalization and form copy helpers.
- Create `apps/web/src/lib/pin-entry.test.ts`: PIN validation/copy tests.
- Create `apps/web/src/lib/predictions-access.ts`: pure helper for private route access state from local session and server validation result.
- Create `apps/web/src/lib/predictions-access.test.ts`: tests for missing, valid, and invalid private session states.
- Create `apps/web/src/components/pin-entry-form.tsx`: reusable PIN form for `/` and private route fallback.
- Modify `apps/web/src/components/header.tsx`: use player session/current player instead of Better Auth current user for nav/account affordance.
- Modify `apps/web/src/components/user-menu.tsx`: replace account menu semantics with player menu and logout/change-player behavior.
- Modify `apps/web/src/lib/navigation.ts` and `apps/web/src/lib/navigation.test.ts`: replace auth account state with player session state.
- Modify `apps/web/src/routes/index.tsx`: render public dashboard and PIN entry, no auth-gated home.
- Modify `apps/web/src/routes/pronosticos.tsx`: require valid player session token and pass it to prediction APIs.
- Modify `apps/web/src/lib/home-data.ts` and `apps/web/src/lib/home-data.test.ts`: split public dashboard view model from private player progress if needed.
- Remove visible usage of `apps/web/src/components/sign-in-form.tsx` and `apps/web/src/components/sign-up-form.tsx` from active routes. Delete only if no imports remain and tests/build pass.
- Modify `apps/web/src/routes/dashboard.tsx`: either redirect to `/` or replace with a simple PIN entry compatibility page so old links do not break.

---

## Task 1: Backend PIN Helper Foundation

**Files:**
- Create: `packages/backend/convex/lib/pinAccess.ts`
- Create: `packages/backend/convex/lib/pinAccess.test.ts`

- [ ] **Step 1: Write failing helper tests**

Add tests covering normalization, invalid input, token expiration, non-plaintext hashing, deterministic hashing with pepper, and token hash separation.

```ts
import { describe, expect, it } from "bun:test";

import {
  PIN_LOCKOUT_AFTER_FAILURES,
  PIN_LOCKOUT_MS,
  PLAYER_SESSION_TTL_MS,
  hashPin,
  hashSessionToken,
  isSessionExpired,
  normalizePin,
  getPinPepper,
} from "./pinAccess";

describe("pinAccess", () => {
  it("normalizes PINs by trimming and uppercasing", () => {
    expect(normalizePin(" a1b2 ")).toBe("A1B2");
  });

  it("rejects non-alphanumeric or wrong-length PINs", () => {
    expect(() => normalizePin("ABC")).toThrow("PIN must be 4 alphanumeric characters");
    expect(() => normalizePin("AB-1")).toThrow("PIN must be 4 alphanumeric characters");
  });

  it("hashes PINs with a pepper without storing plaintext", async () => {
    const hash = await hashPin("A1B2", "test-pepper");
    expect(hash).not.toBe("A1B2");
    expect(hash).toBe(await hashPin("A1B2", "test-pepper"));
    expect(hash).not.toBe(await hashPin("A1B2", "other-pepper"));
  });

  it("hashes session tokens separately from PINs", async () => {
    expect(await hashSessionToken("token-value")).not.toBe(await hashPin("A1B2", "test-pepper"));
  });

  it("uses approved session and lockout constants", () => {
    expect(PLAYER_SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(PIN_LOCKOUT_AFTER_FAILURES).toBe(5);
    expect(PIN_LOCKOUT_MS).toBe(10 * 60 * 1000);
  });

  it("detects expired sessions", () => {
    expect(isSessionExpired({ expiresAt: 1000, now: 1000 })).toBe(true);
    expect(isSessionExpired({ expiresAt: 1001, now: 1000 })).toBe(false);
  });

  it("requires a PIN pepper", () => {
    const originalPepper = process.env.PIN_PEPPER;
    delete process.env.PIN_PEPPER;
    expect(() => getPinPepper()).toThrow("PIN access is not configured");
    if (originalPepper !== undefined) process.env.PIN_PEPPER = originalPepper;
  });
});
```

- [ ] **Step 2: Run helper tests and confirm failure**

Run: `bun test packages/backend/convex/lib/pinAccess.test.ts`

Expected: FAIL because `pinAccess.ts` does not exist.

- [ ] **Step 3: Implement minimal helper module**

```ts
export const PLAYER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const PIN_LOCKOUT_AFTER_FAILURES = 5;
export const PIN_LOCKOUT_MS = 10 * 60 * 1000;

const PIN_PATTERN = /^[A-Z0-9]{4}$/;

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizePin(pin: string) {
  const normalized = pin.trim().toUpperCase();
  if (!PIN_PATTERN.test(normalized)) {
    throw new Error("PIN must be 4 alphanumeric characters");
  }
  return normalized;
}

export async function hashPin(normalizedPin: string, pepper: string) {
  return await sha256Hex(`pin:${pepper}:${normalizedPin}`);
}

export async function hashSessionToken(token: string) {
  return await sha256Hex(`session:${token}`);
}

export function getPinPepper() {
  const pepper = process.env.PIN_PEPPER;
  if (!pepper) {
    throw new Error("PIN access is not configured");
  }
  return pepper;
}

export function createSessionExpiration(now: number) {
  return now + PLAYER_SESSION_TTL_MS;
}

export function isSessionExpired({ expiresAt, now }: { expiresAt: number; now: number }) {
  return now >= expiresAt;
}

export function createSessionToken() {
  return crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
}
```

- [ ] **Step 4: Run helper tests and confirm pass**

Run: `bun test packages/backend/convex/lib/pinAccess.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add packages/backend/convex/lib/pinAccess.ts packages/backend/convex/lib/pinAccess.test.ts && git commit -m "feat: add pin access helpers"`

---

## Task 2: Convex Schema For Players And Sessions

**Files:**
- Modify: `packages/backend/convex/schema.ts`
- Test indirectly in later Convex handler tests.

- [ ] **Step 1: Update schema**

Replace `profiles` auth ownership and `predictions.userId` ownership with explicit player ownership.

```ts
profiles: defineTable({
  displayName: v.string(),
  pinHash: v.string(),
  active: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_pin_hash", ["pinHash"])
  .index("by_active", ["active"]),

playerSessions: defineTable({
  playerId: v.id("profiles"),
  tokenHash: v.string(),
  createdAt: v.number(),
  lastUsedAt: v.number(),
  expiresAt: v.number(),
  revokedAt: v.optional(v.number()),
})
  .index("by_token_hash", ["tokenHash"])
  .index("by_player_id", ["playerId"]),

pinLoginAttempts: defineTable({
  pinHash: v.string(),
  failureCount: v.number(),
  lockedUntil: v.optional(v.number()),
  updatedAt: v.number(),
})
  .index("by_pin_hash", ["pinHash"]),

predictions: defineTable({
  playerId: v.id("profiles"),
  matchId: v.id("matches"),
  homeScore: persistedScore,
  awayScore: persistedScore,
  updatedAt: v.number(),
})
  .index("by_player_id_match_id", ["playerId", "matchId"])
  .index("by_match_id", ["matchId"]),
```

- [ ] **Step 2: Run typecheck and expect generated API/schema fallout**

Run: `bun run --filter @quiniela-mundial-2026/backend check-types`

Expected: FAIL in code/tests still referencing `userId`, `by_user_id`, or old profile shape.

- [ ] **Step 3: Commit schema change only after later tasks compile**

Do not commit this task independently if it leaves the repo uncompilable. Include it in the first backend compile-safe commit after Tasks 3-7 update all old `userId` consumers.

---

## Task 3: Player Login, Session Validation, Logout

**Files:**
- Create: `packages/backend/convex/players.ts`
- Create: `packages/backend/convex/players.test.ts`
- Modify: `packages/backend/convex/task2.handlers.test.ts` test module list later to include `players.ts` if keeping shared handler tests.

- [ ] **Step 1: Create a temporary throwing `players.ts` shell and refresh generated API**

Create `packages/backend/convex/players.ts` with the exported function names throwing `Not implemented`, then run the normal Convex generation/type path used by this repo if `api.players.*` is missing. This makes the intended failing tests behavior-level instead of stale-generated-type failures.

```ts
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const loginWithPin = mutation({ args: { pin: v.string() }, handler: async () => { throw new ConvexError("Not implemented"); } });
export const getCurrentPlayer = query({ args: { sessionToken: v.string() }, handler: async () => { throw new ConvexError("Not implemented"); } });
export const logout = mutation({ args: { sessionToken: v.string() }, handler: async () => ({ status: "ok" as const }) });
```

Run: `bun run --filter @quiniela-mundial-2026/backend check-types`

Expected: may still fail from old schema consumers, but generated `api.players.*` references should now exist.

- [ ] **Step 2: Write failing Convex handler tests**

Cover valid login, normalized PIN login, invalid PIN, inactive player, lockout after 5 failures, session validation, expiry, revocation, and no plaintext PIN return.

Use helper setup like current `task2.handlers.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { convexTest } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { hashPin } from "./lib/pinAccess";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();
const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./players.ts": async () => await import("./players"),
} satisfies Record<string, () => Promise<unknown>>;

describe("players PIN sessions", () => {
  const realNow = Date.now;
  const originalPepper = process.env.PIN_PEPPER;

  beforeEach(() => {
    Date.now = () => NOW;
    process.env.PIN_PEPPER = "test-pepper";
  });

  afterEach(() => {
    Date.now = realNow;
    if (originalPepper === undefined) delete process.env.PIN_PEPPER;
    else process.env.PIN_PEPPER = originalPepper;
  });

  async function seedPlayer(t: ReturnType<typeof convexTest>, displayName = "Boris", pin = "A1B2") {
    const pinHash = await hashPin(pin, "test-pepper");
    return await t.run((ctx) => ctx.db.insert("profiles", {
      displayName,
      pinHash,
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    }));
  }

  it("logs in with a normalized PIN and creates a server session", async () => {
    const t = convexTest(schema, testModules);
    const playerId = await seedPlayer(t);

    const result = await t.mutation(api.players.loginWithPin, { pin: " a1b2 " });

    expect(result.player).toEqual({ playerId, displayName: "Boris" });
    expect(result.sessionToken).toEqual(expect.any(String));
    expect(result.sessionToken.length).toBeGreaterThan(32);

    const sessions = await t.run((ctx) => ctx.db.query("playerSessions").collect());
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.tokenHash).not.toBe(result.sessionToken);
  });

  it("rejects invalid PINs and locks after repeated failures", async () => {
    const t = convexTest(schema, testModules);
    await seedPlayer(t);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(t.mutation(api.players.loginWithPin, { pin: "ZZ99" })).rejects.toThrow("PIN no reconocido");
    }

    await expect(t.mutation(api.players.loginWithPin, { pin: "ZZ99" })).rejects.toThrow("Demasiados intentos");
  });

  it("rejects revoked sessions", async () => {
    const t = convexTest(schema, testModules);
    await seedPlayer(t);
    const login = await t.mutation(api.players.loginWithPin, { pin: "A1B2" });

    await t.mutation(api.players.logout, { sessionToken: login.sessionToken });

    await expect(t.query(api.players.getCurrentPlayer, { sessionToken: login.sessionToken })).rejects.toThrow("Not authenticated");
  });
});
```

- [ ] **Step 3: Run tests and confirm behavior failure**

Run: `bun test packages/backend/convex/players.test.ts`

Expected: FAIL with `Not implemented` or missing session behavior, not with generated API/type errors.

- [ ] **Step 4: Implement `players.ts`**

Required API shape:

```ts
import { ConvexError, v } from "convex/values";

import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  PIN_LOCKOUT_AFTER_FAILURES,
  PIN_LOCKOUT_MS,
  createSessionExpiration,
  createSessionToken,
  hashPin,
  hashSessionToken,
  isSessionExpired,
  normalizePin,
  getPinPepper,
} from "./lib/pinAccess";

const playerSessionArgs = { sessionToken: v.string() };

export async function requirePlayerBySessionToken(ctx: QueryCtx | MutationCtx, sessionToken: string) {
  const tokenHash = await hashSessionToken(sessionToken);
  const session = await ctx.db.query("playerSessions").withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash)).unique();
  if (!session || session.revokedAt !== undefined || isSessionExpired({ expiresAt: session.expiresAt, now: Date.now() })) {
    throw new ConvexError("Not authenticated");
  }

  const player = await ctx.db.get(session.playerId);
  if (!player || !player.active) {
    throw new ConvexError("Not authenticated");
  }

  if ("patch" in ctx.db) {
    await ctx.db.patch(session._id, { lastUsedAt: Date.now() });
  }

  return { playerId: player._id, displayName: player.displayName };
}

export const loginWithPin = mutation({
  args: { pin: v.string() },
  returns: v.object({
    sessionToken: v.string(),
    player: v.object({ playerId: v.id("profiles"), displayName: v.string() }),
  }),
  handler: async (ctx, args) => {
    const normalizedPin = normalizePin(args.pin);
    const now = Date.now();
    const pinHash = await hashPin(normalizedPin, getPinPepper());
    const attempt = await ctx.db.query("pinLoginAttempts").withIndex("by_pin_hash", (q) => q.eq("pinHash", pinHash)).unique();

    if (attempt?.lockedUntil !== undefined && attempt.lockedUntil > now) {
      throw new ConvexError("Demasiados intentos. Prueba de nuevo en unos minutos.");
    }

    const player = await ctx.db.query("profiles").withIndex("by_pin_hash", (q) => q.eq("pinHash", pinHash)).unique();
    if (!player || !player.active) {
      const failureCount = (attempt?.failureCount ?? 0) + 1;
      const lockedUntil = failureCount >= PIN_LOCKOUT_AFTER_FAILURES ? now + PIN_LOCKOUT_MS : undefined;
      if (attempt) await ctx.db.patch(attempt._id, { failureCount, lockedUntil, updatedAt: now });
      else await ctx.db.insert("pinLoginAttempts", { pinHash, failureCount, lockedUntil, updatedAt: now });
      throw new ConvexError("PIN no reconocido. Revisa el codigo que te compartieron.");
    }

    if (attempt) await ctx.db.patch(attempt._id, { failureCount: 0, lockedUntil: undefined, updatedAt: now });

    const sessionToken = createSessionToken();
    await ctx.db.insert("playerSessions", {
      playerId: player._id,
      tokenHash: await hashSessionToken(sessionToken),
      createdAt: now,
      lastUsedAt: now,
      expiresAt: createSessionExpiration(now),
    });

    return { sessionToken, player: { playerId: player._id, displayName: player.displayName } };
  },
});

export const getCurrentPlayer = query({
  args: playerSessionArgs,
  returns: v.object({ playerId: v.id("profiles"), displayName: v.string() }),
  handler: async (ctx, args) => await requirePlayerBySessionToken(ctx, args.sessionToken),
});

export const logout = mutation({
  args: playerSessionArgs,
  returns: v.object({ status: v.literal("ok") }),
  handler: async (ctx, args) => {
    const tokenHash = await hashSessionToken(args.sessionToken);
    const session = await ctx.db.query("playerSessions").withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash)).unique();
    if (session && session.revokedAt === undefined) await ctx.db.patch(session._id, { revokedAt: Date.now() });
    return { status: "ok" as const };
  },
});
```

- [ ] **Step 5: Run player tests and iterate**

Run: `bun test packages/backend/convex/players.test.ts`

Expected: PASS.

- [ ] **Step 6: Run backend typecheck and note remaining old-auth failures**

Run: `bun run --filter @quiniela-mundial-2026/backend check-types`

Expected: May still FAIL in `profiles.ts`, predictions, matches, standings, scoring, and tests that reference old `userId`. Continue to Tasks 4-7 before committing backend schema/API work.

---

## Task 3.5: Retire Better Auth Profile Creation API

**Files:**
- Modify: `packages/backend/convex/profiles.ts`
- Modify: `packages/backend/convex/task2.handlers.test.ts` or remove old profile-auth tests

- [ ] **Step 1: Remove old `ensureCurrentProfile` expectations**

Delete or replace tests that assert `profiles.userId` and `by_user_id`. The new player list is seed/admin-owned, not self-created from Better Auth.

- [ ] **Step 2: Replace `profiles.ts` with a small player-safe query or remove active exports**

If no frontend/backend code needs `api.profiles.ensureCurrentProfile`, remove the mutation export. If keeping a module avoids generated API churn, expose only a public-safe list for admin/debug tests:

```ts
import { v } from "convex/values";
import { query } from "./_generated/server";

export const listActivePlayers = query({
  args: {},
  returns: v.array(v.object({ playerId: v.id("profiles"), displayName: v.string() })),
  handler: async (ctx) => {
    const players = await ctx.db.query("profiles").withIndex("by_active", (q) => q.eq("active", true)).collect();
    return players.map((player) => ({ playerId: player._id, displayName: player.displayName }));
  },
});
```

- [ ] **Step 3: Run targeted backend tests**

Run: `bun test packages/backend/convex/players.test.ts packages/backend/convex/task2.handlers.test.ts`

Expected: old profile-auth tests are gone or updated; remaining failures should be from predictions/matches/standings migration.

---

## Task 4: Predictions By Player Session

**Files:**
- Modify: `packages/backend/convex/predictions.ts`
- Create or modify: `packages/backend/convex/predictions.test.ts`
- Modify: `packages/backend/convex/task2.handlers.test.ts` if consolidating old tests.

- [ ] **Step 1: Write failing prediction session tests**

Cover missing session, forged playerId cannot be supplied, valid save/list, cross-player isolation, invalid score, locked match.

```ts
it("lists only predictions for the session player", async () => {
  const t = createTest();
  const boris = await seedLoggedInPlayer(t, { displayName: "Boris", pin: "A1B2" });
  const q = await seedLoggedInPlayer(t, { displayName: "Q", pin: "Q222" });
  const matchId = await seedFutureMatch(t);

  await t.mutation(api.predictions.upsertPrediction, {
    sessionToken: boris.sessionToken,
    matchId,
    homeScore: 1n,
    awayScore: 0n,
  });
  await t.mutation(api.predictions.upsertPrediction, {
    sessionToken: q.sessionToken,
    matchId,
    homeScore: 0n,
    awayScore: 2n,
  });

  await expect(t.query(api.predictions.listMyPredictions, { sessionToken: "fake" })).rejects.toThrow("Not authenticated");
  expect(await t.query(api.predictions.listMyPredictions, { sessionToken: boris.sessionToken })).toEqual([
    { matchId, homeScore: 1n, awayScore: 0n, updatedAt: expect.any(Number) },
  ]);
});
```

- [ ] **Step 2: Run prediction tests and confirm failure**

Run: `bun test packages/backend/convex/predictions.test.ts`

Expected: FAIL because API still uses auth user.

- [ ] **Step 3: Update `predictions.ts`**

Change args and indexes:

```ts
args: {
  sessionToken: v.string(),
  matchId: v.id("matches"),
  homeScore: v.int64(),
  awayScore: v.int64(),
}
```

Resolve current player with:

```ts
const player = await requirePlayerBySessionToken(ctx, args.sessionToken);
```

Use `.withIndex("by_player_id_match_id", (q) => q.eq("playerId", player.playerId).eq("matchId", args.matchId))` and insert `playerId: player.playerId`.

- [ ] **Step 4: Run prediction tests**

Run: `bun test packages/backend/convex/predictions.test.ts`

Expected: PASS.

- [ ] **Step 5: Do not commit yet if backend still references old `userId` APIs**

Run: `bun run --filter @quiniela-mundial-2026/backend check-types`

Expected: May still FAIL until Tasks 5-7 update seed/matches/standings/scoring. Defer commit until Task 7 produces a compile-safe backend.

---

## Task 5: Seed Pre-Created Players

**Files:**
- Modify: `packages/backend/convex/seed.ts`
- Modify: `packages/backend/convex/seed.test.ts`
- Optionally create: `packages/backend/convex/lib/seedPlayers.ts`

- [ ] **Step 1: Write failing seed tests**

Assert all approved players are created active, PIN hashes are unique, no plaintext PIN field exists, predictions/sessions/attempts reset.

```ts
expect(players.map((player) => player.displayName)).toEqual([
  "Boris", "Q", "Pucho", "Lester", "Ale", "Otto", "Profe", "LF", "Sofi", "Sergio", "Chata", "Fer", "Teto", "Marianne", "Coco", "Estuardo", "Lily", "Tesoro", "Rolando", "Rocio", "Eve", "Rob",
]);
expect(new Set(players.map((player) => player.pinHash)).size).toBe(22);
expect(JSON.stringify(players)).not.toContain("A1B2");
```

- [ ] **Step 2: Run seed tests and confirm failure**

Run: `bun test packages/backend/convex/seed.test.ts`

Expected: FAIL because seed does not create players.

- [ ] **Step 3: Implement player seed**

Add a static player/PIN assignment in code. Use unique 4-character alphanumeric PINs and store only hashes. Example placeholder assignment, replace with final generated values if desired before sharing with players:

```ts
const seededPlayers = [
  { displayName: "Boris", pin: "B0R1" },
  { displayName: "Q", pin: "Q026" },
  { displayName: "Pucho", pin: "PU26" },
  { displayName: "Lester", pin: "LE26" },
  { displayName: "Ale", pin: "AL26" },
  { displayName: "Otto", pin: "OT26" },
  { displayName: "Profe", pin: "PR26" },
  { displayName: "LF", pin: "LF26" },
  { displayName: "Sofi", pin: "SO26" },
  { displayName: "Sergio", pin: "SE26" },
  { displayName: "Chata", pin: "CH26" },
  { displayName: "Fer", pin: "FE26" },
  { displayName: "Teto", pin: "TE26" },
  { displayName: "Marianne", pin: "MA26" },
  { displayName: "Coco", pin: "CO26" },
  { displayName: "Estuardo", pin: "ES26" },
  { displayName: "Lily", pin: "LI26" },
  { displayName: "Tesoro", pin: "TS26" },
  { displayName: "Rolando", pin: "RO26" },
  { displayName: "Rocio", pin: "RC26" },
  { displayName: "Eve", pin: "EV26" },
  { displayName: "Rob", pin: "RB26" },
] as const;
```

Extend `seedGroupStage` deletion to clear `playerSessions`, `pinLoginAttempts`, `predictions`, and existing `profiles`. Insert players with `hashPin(normalizePin(pin), getPinPepper())` imported from `lib/pinAccess`.

- [ ] **Step 4: Return seed counts**

Update return shape to include deleted/inserted players, sessions, and attempts.

- [ ] **Step 5: Run seed tests**

Run: `bun test packages/backend/convex/seed.test.ts`

Expected: PASS.

- [ ] **Step 6: Do not commit yet if standings/matches still fail typecheck**

Run: `bun run --filter @quiniela-mundial-2026/backend check-types`

Expected: May still FAIL until public/private match and standings tasks are complete. Defer commit until Task 7.

---

## Task 6: Public Dashboard APIs

**Files:**
- Modify: `packages/backend/convex/matches.ts`
- Modify: `packages/backend/convex/standings.ts`
- Create: `packages/backend/convex/publicDashboard.test.ts`

- [ ] **Step 1: Write failing public dashboard tests**

Cover unauthenticated access, today/upcoming/history grouping, public standings from finished matches only, current leader from public standings, exact-score counts from finished matches only, and no raw unfinished predictions.

```ts
const dashboard = await t.query(api.matches.getPublicDashboardMatches, {});
expect(dashboard.todayMatches).toHaveLength(1);
expect(dashboard.upcomingMatches).toHaveLength(1);
expect(dashboard.finishedMatches).toHaveLength(1);
expect(JSON.stringify(dashboard)).not.toContain("pinHash");
expect(JSON.stringify(dashboard)).not.toContain("homeScorePrediction");
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test packages/backend/convex/publicDashboard.test.ts`

Expected: FAIL because public queries do not exist.

- [ ] **Step 3: Add `matches.getPublicDashboardMatches`**

Return:

```ts
{
  todayMatches: PublicMatchSummary[],
  upcomingMatches: PublicMatchSummary[],
  finishedMatches: PublicFinishedMatchSummary[],
  stats: {
    leaderName: string | null,
    finishedMatchCount: number,
    totalPredictionCountForFinishedMatches: number,
    bestExactScoreCount: number,
  }
}
```

Use local date grouping based on `Date` boundaries. If timezone requirements are unclear, document UTC grouping in code and tests.

- [ ] **Step 4: Add `standings.getPublicStandings`**

Migrate `buildStandingsRows` inputs from `userId` to `playerId`. Let `currentPlayerId` be optional or `null`; public standings pass `null` and every row returns `isCurrentUser: false`. Update `packages/backend/convex/lib/scoring.test.ts` to cover both private current-player marking and public no-current-player behavior.

- [ ] **Step 5: Run public dashboard tests**

Run: `bun test packages/backend/convex/publicDashboard.test.ts`

Expected: PASS.

- [ ] **Step 6: Do not commit yet if private match API still fails typecheck**

Run: `bun run --filter @quiniela-mundial-2026/backend check-types`

Expected: May still FAIL until Task 7 updates `listHomeMatches` and remaining tests. Defer commit until Task 7.

---

## Task 7: Private Match Queries By Session

**Files:**
- Modify: `packages/backend/convex/matches.ts`
- Modify: backend tests that call `api.matches.listHomeMatches`

- [ ] **Step 1: Write failing private match tests**

Cover missing/fake session rejection and `hasPrediction` scoped to current player.

- [ ] **Step 2: Update `listHomeMatches` args**

Change from no args/auth user to:

```ts
args: { sessionToken: v.string() }
```

Resolve player with `requirePlayerBySessionToken` and query predictions by `by_player_id_match_id` or `by_player_id`.

- [ ] **Step 3: Run private match tests**

Run: `bun test packages/backend/convex/*matches*.test.ts packages/backend/convex/task2.handlers.test.ts`

Expected: PASS after updating old tests.

- [ ] **Step 4: Commit private match API**

First run: `bun test packages/backend/convex && bun run --filter @quiniela-mundial-2026/backend check-types`

Expected: PASS for backend tests and backend typecheck.

Then commit the compile-safe backend slice:

Run: `git add packages/backend/convex && git commit -m "feat: add pin-based player backend"`

---

## Task 8: Frontend Session And PIN Helpers

**Files:**
- Create: `apps/web/src/lib/player-session.ts`
- Create: `apps/web/src/lib/player-session.test.ts`
- Create: `apps/web/src/lib/pin-entry.ts`
- Create: `apps/web/src/lib/pin-entry.test.ts`
- Create: `apps/web/src/lib/predictions-access.ts`
- Create: `apps/web/src/lib/predictions-access.test.ts`

- [ ] **Step 1: Write failing frontend helper tests**

Cover storage read/write/clear, malformed storage fallback, PIN normalization, PIN error copy.

```ts
import { beforeEach, describe, expect, it } from "bun:test";

import { clearPlayerSession, getStoredPlayerSession, storePlayerSession } from "./player-session";

describe("player-session", () => {
  beforeEach(() => localStorage.clear());

  it("stores and reads the session token with non-authoritative display cache", () => {
    storePlayerSession({ sessionToken: "abc", displayName: "Boris" });
    expect(getStoredPlayerSession()).toEqual({ sessionToken: "abc", displayName: "Boris" });
  });

  it("clears malformed sessions", () => {
    localStorage.setItem("quiniela.playerSession", "not-json");
    expect(getStoredPlayerSession()).toBeNull();
  });

  it("clears sessions", () => {
    storePlayerSession({ sessionToken: "abc", displayName: "Boris" });
    clearPlayerSession();
    expect(getStoredPlayerSession()).toBeNull();
  });
});
```

Add `predictions-access.test.ts`:

```ts
import { describe, expect, it } from "bun:test";
import { getPredictionsAccessState } from "./predictions-access";

describe("getPredictionsAccessState", () => {
  it("requires PIN login when no local session exists", () => {
    expect(getPredictionsAccessState({ storedSession: null, currentPlayer: undefined })).toEqual({ state: "needsPin" });
  });

  it("allows predictions when the server validates the session", () => {
    expect(getPredictionsAccessState({ storedSession: { sessionToken: "abc", displayName: "Boris" }, currentPlayer: { displayName: "Boris" } })).toEqual({ state: "ready", displayName: "Boris" });
  });

  it("clears invalid sessions when the server rejects them", () => {
    expect(getPredictionsAccessState({ storedSession: { sessionToken: "abc", displayName: "Boris" }, currentPlayer: null })).toEqual({ state: "invalidSession" });
  });
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `bun test apps/web/src/lib/player-session.test.ts apps/web/src/lib/pin-entry.test.ts apps/web/src/lib/predictions-access.test.ts`

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement helpers**

Keep helpers browser-safe by checking `typeof window === "undefined"` before touching localStorage.

```ts
export const PLAYER_SESSION_STORAGE_KEY = "quiniela.playerSession";

export type StoredPlayerSession = { sessionToken: string; displayName: string };

export function getStoredPlayerSession(): StoredPlayerSession | null { /* parse safely */ }
export function storePlayerSession(session: StoredPlayerSession) { /* JSON stringify */ }
export function clearPlayerSession() { /* remove item */ }
```

- [ ] **Step 4: Run helper tests**

Run: `bun test apps/web/src/lib/player-session.test.ts apps/web/src/lib/pin-entry.test.ts apps/web/src/lib/predictions-access.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit frontend helpers**

Run: `git add apps/web/src/lib/player-session.ts apps/web/src/lib/player-session.test.ts apps/web/src/lib/pin-entry.ts apps/web/src/lib/pin-entry.test.ts apps/web/src/lib/predictions-access.ts apps/web/src/lib/predictions-access.test.ts && git commit -m "feat: add player session helpers"`

---

## Task 9: PIN Entry Form Component

**Files:**
- Create: `apps/web/src/components/pin-entry-form.tsx`
- Modify: route files in later tasks.

- [ ] **Step 1: Implement reusable form**

Use existing UI components: `Button`, `Input`, `AppSection` if useful. Props:

```ts
type PinEntryFormProps = {
  title?: string;
  description?: string;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (pin: string) => void;
};
```

The component should uppercase visible input, set `maxLength={4}`, use `inputMode="text"`, and submit only 4 alphanumeric characters.

- [ ] **Step 2: Add component-level or helper tests if a component test setup exists**

If no React component test setup exists, keep logic in `pin-entry.ts` covered and manually verify component in smoke checklist.

- [ ] **Step 3: Commit form**

Run: `git add apps/web/src/components/pin-entry-form.tsx && git commit -m "feat: add pin entry form"`

---

## Task 10: Public Home Dashboard UI

**Files:**
- Modify: `apps/web/src/routes/index.tsx`
- Modify or create: `apps/web/src/lib/home-data.ts`
- Modify or create: `apps/web/src/lib/public-dashboard.ts`
- Modify tests: `apps/web/src/lib/home-data.test.ts` or new `public-dashboard.test.ts`

- [ ] **Step 1: Write failing view-model tests**

Cover empty dashboard, today/upcoming/history counts, stat labels, and primary PIN CTA copy.

- [ ] **Step 2: Implement public dashboard view model**

Keep it pure and testable. Example output:

```ts
export type PublicDashboardViewModel = {
  hasTournamentData: boolean;
  heroTitle: string;
  stats: Array<{ label: string; value: string }>;
};
```

- [ ] **Step 3: Update `/` route**

Remove `api.auth.getCurrentUser` gating. Query:

```ts
const dashboard = useQuery(api.matches.getPublicDashboardMatches);
const standings = useQuery(api.standings.getPublicStandings);
```

Render PIN form at top. On successful `api.players.loginWithPin`, call `storePlayerSession` and navigate to `/pronosticos`.

- [ ] **Step 4: Run frontend helper tests**

Run: `bun test apps/web/src/lib/home-data.test.ts apps/web/src/lib/public-dashboard.test.ts apps/web/src/lib/pin-entry.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit public home UI**

Run: `git add apps/web/src/routes/index.tsx apps/web/src/lib/home-data.ts apps/web/src/lib/home-data.test.ts apps/web/src/lib/public-dashboard.ts apps/web/src/lib/public-dashboard.test.ts && git commit -m "feat: add public dashboard home"`

---

## Task 11: Private Predictions UI With Session Token

**Files:**
- Modify: `apps/web/src/routes/pronosticos.tsx`
- Modify: `apps/web/src/lib/player-session.ts` if route needs subscription helper.

- [ ] **Step 1: Update route behavior**

Read session with `getStoredPlayerSession()` in state on mount. If missing, show `PinEntryForm` with copy `Ingresa tu PIN para cargar marcadores`.

- [ ] **Step 2: Pass `sessionToken` to Convex APIs**

Change queries:

```ts
const matches = useQuery(api.matches.listHomeMatches, session ? { sessionToken: session.sessionToken } : "skip");
const predictions = useQuery(api.predictions.listMyPredictions, session ? { sessionToken: session.sessionToken } : "skip");
```

Change mutation args:

```ts
await savePrediction({ sessionToken: session.sessionToken, matchId, homeScore, awayScore });
```

- [ ] **Step 3: Handle invalid session errors with `predictions-access.ts`**

If `api.players.getCurrentPlayer` returns null-equivalent error state or a private query/mutation returns `Not authenticated`, call `clearPlayerSession()`, clear route state, and show PIN entry again. Keep the route decision logic aligned with `getPredictionsAccessState` tests.

- [ ] **Step 3.5: Run prediction access tests**

Run: `bun test apps/web/src/lib/predictions-access.test.ts`

Expected: PASS.

- [ ] **Step 4: Run frontend typecheck for route issues**

Run: `bun run --filter web check-types`

Expected: PASS or only known route generation issue. If routeTree changes are generated, inspect before staging.

- [ ] **Step 5: Commit predictions UI**

Run: `git add apps/web/src/routes/pronosticos.tsx apps/web/src/routeTree.gen.ts && git commit -m "feat: use pin sessions for predictions"`

---

## Task 12: Header, Navigation, And Dashboard Compatibility

**Files:**
- Modify: `apps/web/src/components/header.tsx`
- Modify: `apps/web/src/components/user-menu.tsx`
- Modify: `apps/web/src/lib/navigation.ts`
- Modify: `apps/web/src/lib/navigation.test.ts`
- Modify: `apps/web/src/routes/dashboard.tsx`

- [ ] **Step 1: Write failing navigation tests**

Update expectations:

```ts
expect(AUTH_ENTRY_PATH).toBe("/");
expect(shouldShowPrimaryNav("unknown")).toBe(true);
expect(getHeaderPlayerAffordance(null)).toEqual({ eyebrow: "PIN", label: "Entrar" });
```

- [ ] **Step 2: Update navigation helpers**

Replace auth state with player-aware state: `unknown`, `signedOut`, `signedIn` or simpler helpers that only need stored/current player.

- [ ] **Step 3: Update header**

Use `getStoredPlayerSession()` for immediate display and `api.players.getCurrentPlayer` for validation when token exists. Show primary nav publicly, because `/` and `/pronosticos` should remain visible. Show `Pin` CTA if no player; show `UserMenu` if player.

- [ ] **Step 4: Update user menu**

Rename copy from account to player:

- `Mi jugador`
- `Hola, Boris`
- `Cambiar jugador`

On click, call `api.players.logout` if token exists, clear local session, navigate to `/`.

- [ ] **Step 5: Update `/dashboard`**

Replace old sign-in/sign-up shell with a compatibility route that redirects to `/` or renders PIN entry and says `Ahora entras con tu PIN`.

- [ ] **Step 6: Run navigation tests and web typecheck**

Run: `bun test apps/web/src/lib/navigation.test.ts && bun run --filter web check-types`

Expected: PASS.

- [ ] **Step 7: Commit navigation work**

Run: `git add apps/web/src/components/header.tsx apps/web/src/components/user-menu.tsx apps/web/src/lib/navigation.ts apps/web/src/lib/navigation.test.ts apps/web/src/routes/dashboard.tsx apps/web/src/routeTree.gen.ts && git commit -m "feat: simplify navigation for pin players"`

---

## Task 13: Clean Old Auth Flow From Active UI

**Files:**
- Check: `apps/web/src/components/sign-in-form.tsx`
- Check: `apps/web/src/components/sign-up-form.tsx`
- Check: `apps/web/src/lib/auth-client.ts`
- Check: `apps/web/src/routes/dashboard.tsx`
- Check: `apps/web/src/components/header.tsx`

- [ ] **Step 1: Search for old auth UI imports**

Use Grep for `SignInForm|SignUpForm|authClient|api.auth.getCurrentUser|Authenticated|Unauthenticated|AuthLoading`.

- [ ] **Step 2: Remove unused old auth components if safe**

Delete `sign-in-form.tsx` and `sign-up-form.tsx` only if no imports remain. Keep Better Auth backend files/packages for now.

- [ ] **Step 3: Run web typecheck**

Run: `bun run --filter web check-types`

Expected: PASS.

- [ ] **Step 4: Commit cleanup**

Run: `git add apps/web/src && git commit -m "refactor: remove visible password auth flow"`

---

## Task 14: Update Generated Convex API And Route Tree

**Files:**
- Modify generated files as produced by tooling: `packages/backend/convex/_generated/*`, `apps/web/src/routeTree.gen.ts`

- [ ] **Step 1: Run Convex codegen if required**

If typecheck complains about missing generated API entries, run the project’s normal Convex dev/codegen command. Prefer existing scripts first:

Run: `bun run --filter @quiniela-mundial-2026/backend check-types`

If generated API is stale, run the minimal Convex codegen command available in the repo environment.

- [ ] **Step 2: Run web route generation/build path**

Run: `bun run --filter web check-types`

Expected: PASS and update `apps/web/src/routeTree.gen.ts` if routes changed.

- [ ] **Step 3: Inspect generated diffs**

Run: `git diff -- packages/backend/convex/_generated apps/web/src/routeTree.gen.ts`

Expected: only generated API/route updates from this refactor.

- [ ] **Step 4: Commit generated updates**

Run: `git add packages/backend/convex/_generated apps/web/src/routeTree.gen.ts && git commit -m "chore: update generated routes and convex api"`

---

## Task 15: Full Verification And Manual Smoke

**Files:**
- Modify docs only if smoke checklist needs notes.

- [ ] **Step 1: Run backend tests**

Before running deployed/local smoke against real Convex, verify `PIN_PEPPER` exists in the target Convex environment. If it is missing, set it through the existing Convex environment workflow before seeding or attempting login. Do not print the secret in logs.

Run: `bun test packages/backend/convex`

Expected: PASS.

- [ ] **Step 2: Run frontend tests**

Run: `bun test apps/web/src/lib`

Expected: PASS.

- [ ] **Step 3: Run workspace typecheck**

Run: `bun run check-types`

Expected: PASS.

- [ ] **Step 4: Run build**

Run: `bun run build`

Expected: PASS.

- [ ] **Step 5: Manual smoke checklist**

Run app locally using existing dev scripts as appropriate, then verify:

- Public dashboard loads without a player session.
- Valid PIN logs in and redirects to `/pronosticos`.
- Invalid PIN shows a clear error.
- Repeated invalid PIN attempts trigger lockout behavior.
- A logged-in player can save and revisit a prediction.
- One player cannot read or overwrite another player's predictions by changing local client data/session assumptions.
- Locked matches cannot be edited.
- `Salir` or `Cambiar jugador` clears the session and blocks private access until PIN login happens again.

- [ ] **Step 6: Final git inspection**

Run: `git status --short && git diff --stat`

Expected: only intended files changed; no secrets or plaintext player PINs stored in DB-facing documents except the seed source assignment if deliberately kept for admin distribution.

---

## Risks And Notes For Implementers

- `PIN_PEPPER` must exist in Convex environment before real login works. Tests set it locally.
- A 4-character PIN is intentionally simple UX, not strong authentication. Lockout and hashed storage reduce accidental abuse but do not make it equivalent to full auth.
- If real predictions exist before implementation, stop before Task 5 and ask for a `userId -> player` mapping.
- The existing untracked `apps/web/src/routeTree.gen.ts` may predate this work. Inspect diffs carefully and do not overwrite unrelated changes.
- Prefer a new `players` table only if it clearly reduces migration complexity. This plan uses `profiles` as the player table to minimize frontend/backend churn.

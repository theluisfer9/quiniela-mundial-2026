# PIN Access and Public Dashboard Refactor

Date: 2026-06-08

## Goal

Simplify the quiniela flow by replacing email/password authentication with a pre-assigned 4-character alphanumeric PIN per player. Players should enter their PIN from the initial page and go directly to predictions. The public experience should become a dashboard with standings, today's matches, historical results, and tournament statistics.

## Approved Direction

Use backend-validated PIN access with a server-issued session token stored locally by the browser.

This avoids the visible complexity of Better Auth while keeping the app closed to pre-created players. Better Auth can remain installed during the first pass, but it should no longer be part of the player prediction flow.

## Players

The app starts with a closed list of pre-created players:

- Boris
- Q
- Pucho
- Lester
- Ale
- Otto
- Profe
- LF
- Sofi
- Sergio
- Chata
- Fer
- Teto
- Marianne
- Coco
- Estuardo
- Lily
- Tesoro
- Rolando
- Rocio
- Eve
- Rob

Each player receives a unique 4-character alphanumeric PIN generated and assigned by the admin before the quiniela starts.

## Access Flow

The initial page includes a prominent PIN form.

When a visitor submits a PIN:

- The frontend normalizes the PIN by trimming whitespace and uppercasing characters.
- Convex validates the PIN against active pre-created players.
- If the PIN matches, Convex creates a revocable player session and returns a session token plus the display data needed by the frontend.
- The frontend stores the session token locally and redirects to `/pronosticos`.
- If the PIN does not match, the form shows a clear error: `PIN no reconocido. Revisa el codigo que te compartieron.`

The session should be easy to leave. The header should show a simple player affordance such as `Hola, Boris` with `Cambiar jugador` or `Salir`. Leaving clears the local token and should revoke the server session when possible.

## Private Prediction Flow

`/pronosticos` is private to a validated player session.

If there is no local session token, the route should show the PIN form or redirect back to `/` with a clear entry point. Once a player token is present, each private query or mutation validates the token server-side before returning or changing data.

Saving predictions uses the server-resolved player identity from the session token, not a Better Auth user and not a client-provided `playerId`. Existing lock behavior stays the same: predictions cannot be changed after kickoff.

The current prediction UX should remain mostly intact: focused match navigation, saved state, locked state, progress, and score cards continue to work.

## Public Dashboard

`/` becomes a public dashboard and landing page.

The public page should include:

- PIN entry as the primary action.
- Public standings.
- Today's matches.
- Upcoming matches.
- Historical finished matches.
- Basic stats, such as current leader, number of finished matches, total predictions submitted, and best exact-score counts where feasible.

The public dashboard must not expose PINs, session tokens, PIN hashes, or raw future predictions. Public prediction-derived stats should only include matches that have finished. This avoids leaking participation patterns, prediction quality, or likely picks before results are known.

## Backend Model

The backend should move from Better Auth `userId` ownership to explicit player ownership.

Recommended schema shape:

- `profiles` or a new `players` table stores `displayName`, `pinHash`, `active`, and optional timestamps.
- `playerSessions` stores a hashed session token, `playerId`, `createdAt`, `lastUsedAt`, optional `expiresAt`, and optional `revokedAt`.
- `pinLoginAttempts` or equivalent lightweight tracking stores normalized PIN-attempt hashes, failure counts, and lockout timestamps.
- `predictions` stores `playerId` instead of `userId` and has a unique lookup path for `playerId + matchId`.

Using a new `players` table is cleaner, but adapting `profiles` is acceptable if it minimizes migration risk. The implementation plan should choose the smallest safe path after checking current tests and generated Convex types.

PINs must not be stored in plain text. Store a hash derived from the normalized PIN plus a server-side secret pepper. A seeded development dataset may include source PINs in the seed input or output for distribution, but the database should store only hashed values.

Because a 4-character PIN has a small search space, the login endpoint must include basic abuse protection. The first implementation should lock attempts for the same normalized PIN hash for 10 minutes after 5 failed attempts, reset failures after a successful login, and avoid error messages that distinguish inactive players from invalid PINs. If Convex request metadata exposes a reliable client identifier later, the same lockout can be extended by client context.

Session tokens should expire after 30 days. Valid private requests may extend `lastUsedAt`, but they should not silently extend `expiresAt` beyond 30 days from the latest successful PIN login. The user can always re-enter the PIN to create a fresh session.

## Convex API Changes

Add private player access APIs:

- `players.loginWithPin` validates a PIN and returns player session data plus a raw session token shown only once to the client.
- `players.getCurrentPlayer` validates a session token and returns the active player.
- `players.logout` revokes the current session token.
- Prediction queries and mutations accept the session token and resolve the player server-side.

Add public dashboard APIs:

- Public standings query.
- Public match dashboard query for today, upcoming, and historical matches.
- Public stats query if the stats become complex enough to separate.

Existing authenticated queries should be replaced or wrapped so the UI no longer depends on `api.auth.getCurrentUser` for player features. Any request with a missing, expired, revoked, or deactivated session must fail as unauthenticated and the frontend should clear its local token.

## Migration

Default migration path: treat current predictions as development/test data, reset predictions, and seed the new player list.

If the admin confirms that existing real predictions matter before implementation, switch to a preservation migration where each existing prediction maps from `userId` to the matching `playerId` through an explicit mapping reviewed by the admin.

The migration must update indexes and tests that currently assume `predictions.userId`.

## Error Handling

PIN login errors should be specific but not leak information beyond invalid access.

Prediction save errors should preserve existing user-facing states:

- Saving
- Saved
- Locked
- Error

If the local player session becomes invalid because it is expired, revoked, or belongs to a deactivated/removed player, the frontend should clear the local token and ask for the PIN again.

## Testing

Testing is a first-class requirement for this refactor. The goal is not only to satisfy type checks, but to build enough automated coverage to trust that the simplified app works end to end for players and public visitors.

Prefer focused tests around behavior and failure modes over snapshot-heavy tests. Every security-sensitive path should have at least one negative test.

Backend tests should cover:

- PIN normalization and successful login.
- Invalid PIN rejection.
- Inactive player rejection.
- Backoff or rate limiting for repeated invalid PIN attempts.
- PINs are not stored in plain text.
- Forged `playerId` values cannot access or mutate predictions.
- Missing, expired, revoked, or deactivated sessions are rejected.
- Listing only the current player's predictions.
- Upserting predictions by player.
- Locked match rejection.
- Public standings without authentication.
- Public dashboard match grouping.
- Public APIs do not expose PINs, PIN hashes, session tokens, or raw unfinished-match predictions.

Frontend tests should cover helper-level logic where present:

- PIN form validation/copy.
- Local player session parsing/clearing.
- Public dashboard view model derivation.
- Prediction route behavior for missing player session.

Verification before completion should include:

- Backend unit tests for Convex domain logic and handlers.
- Frontend helper/component tests where the codebase supports them.
- Type checks for the whole workspace.
- Build or route generation checks required by the current app setup.
- A manual smoke checklist for the core flows if a browser-based automated E2E suite is not already available.

Manual smoke checklist:

- Public dashboard loads without a player session.
- Valid PIN logs in and redirects to `/pronosticos`.
- Invalid PIN shows a clear error.
- Repeated invalid PIN attempts trigger lockout behavior.
- A logged-in player can save and revisit a prediction.
- One player cannot read or overwrite another player's predictions by changing client data.
- Locked matches cannot be edited.
- `Salir` or `Cambiar jugador` clears the session and blocks private access until PIN login happens again.

## Non-Goals

- Building a full admin UI in the first pass.
- Supporting self-registration.
- Supporting email/password player login.
- Revealing future private predictions publicly.
- Removing all Better Auth dependencies before the new PIN flow is stable.

## Chosen Defaults For Implementation

- Whether to use a new `players` table or adapt `profiles`.
- Exact public stats included in the first release.
- Use 30-day session expiration from latest successful PIN login.
- Lock the same normalized PIN hash for 10 minutes after 5 failed attempts.
- Reset existing predictions as development/test data unless the admin explicitly asks to preserve real predictions before implementation.

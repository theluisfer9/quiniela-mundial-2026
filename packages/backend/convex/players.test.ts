import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { convexTest, type TestConvex } from "convex-test";
import { anyApi } from "convex/server";

import { hashPin, hashSessionToken } from "./lib/pinAccess";
import schema from "./schema";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();
const TEST_PEPPER = "test-pepper";
const INVALID_PIN_ERROR = "PIN no reconocido. Revisa el codigo que te compartieron.";
const LOCKED_PIN_ERROR = "Demasiados intentos. Prueba de nuevo en unos minutos.";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type TestInstance = TestConvex<typeof schema>;

const api = anyApi as any;

const testModules = {
  "./_generated/api.ts": async () => ({}),
  "./players.ts": async () => await import("./players"),
} satisfies Record<string, () => Promise<unknown>>;

function createTest() {
  return convexTest(schema, testModules);
}

async function seedPlayer(
  t: TestInstance,
  { displayName = "Ana", pin = "A1B2", active = true } = {},
) {
  const pinHash = await hashPin(pin, TEST_PEPPER);

  const playerId = await t.run((ctx) =>
    ctx.db.insert("profiles", {
      userId: `player|${displayName.toLowerCase()}`,
      displayName,
      pinHash,
      active,
      createdAt: NOW,
      updatedAt: NOW,
    }),
  );

  return { playerId, displayName, pinHash };
}

describe("players", () => {
  const realNow = Date.now;
  const originalPinPepper = process.env.PIN_PEPPER;

  beforeEach(() => {
    process.env.PIN_PEPPER = TEST_PEPPER;
    Date.now = () => NOW;
  });

  afterEach(() => {
    if (originalPinPepper === undefined) {
      delete process.env.PIN_PEPPER;
    } else {
      process.env.PIN_PEPPER = originalPinPepper;
    }
    Date.now = realNow;
  });

  it("successful login with normalized PIN creates server session and returns player display data", async () => {
    const t = createTest();
    const player = await seedPlayer(t);

    const result = await t.mutation(api.players.loginWithPin, { pin: " a1b2 " });

    expect(result.status).toBe("ok");
    expect(result.player).toEqual({ playerId: player.playerId, displayName: "Ana" });
    expect(result.sessionToken).toBeString();
    expect(result.sessionToken.length).toBeGreaterThan(20);

    const sessions = await t.run((ctx) => ctx.db.query("playerSessions").collect());
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      playerId: player.playerId,
      createdAt: NOW,
      lastUsedAt: NOW,
      expiresAt: NOW + SESSION_TTL_MS,
    });
  });

  it("session token is raw and stored session tokenHash is not equal to raw token", async () => {
    const t = createTest();
    await seedPlayer(t);

    const result = await t.mutation(api.players.loginWithPin, { pin: "A1B2" });
    const sessions = await t.run((ctx) => ctx.db.query("playerSessions").collect());

    expect(result.status).toBe("ok");
    expect(sessions[0]?.tokenHash).not.toBe(result.sessionToken);
    expect(sessions[0]?.tokenHash).toBe(await hashSessionToken(result.sessionToken));
  });

  it("invalid PIN result creates and increments attempt row", async () => {
    const t = createTest();
    await seedPlayer(t);
    const invalidPinHash = await hashPin("B2C3", TEST_PEPPER);

    await expect(t.mutation(api.players.loginWithPin, { pin: "B2C3" })).resolves.toEqual({
      status: "invalid_pin",
      message: INVALID_PIN_ERROR,
    });
    await expect(t.mutation(api.players.loginWithPin, { pin: "B2C3" })).resolves.toEqual({
      status: "invalid_pin",
      message: INVALID_PIN_ERROR,
    });

    const attempts = await t.run((ctx) =>
      ctx.db
        .query("pinLoginAttempts")
        .withIndex("by_pin_hash", (q) => q.eq("pinHash", invalidPinHash))
        .unique(),
    );
    expect(attempts).toMatchObject({ pinHash: invalidPinHash, failureCount: 2, updatedAt: NOW });
  });

  it("locks out after 5 failed attempts and returns locked on the 6th attempt", async () => {
    const t = createTest();
    await seedPlayer(t);
    const invalidPinHash = await hashPin("B2C3", TEST_PEPPER);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(t.mutation(api.players.loginWithPin, { pin: "B2C3" })).resolves.toEqual({
        status: "invalid_pin",
        message: INVALID_PIN_ERROR,
      });
    }
    await expect(t.mutation(api.players.loginWithPin, { pin: "B2C3" })).resolves.toEqual({
      status: "locked",
      message: LOCKED_PIN_ERROR,
    });

    const attempts = await t.run((ctx) =>
      ctx.db
        .query("pinLoginAttempts")
        .withIndex("by_pin_hash", (q) => q.eq("pinHash", invalidPinHash))
        .unique(),
    );
    expect(attempts).toMatchObject({ failureCount: 5, lockedUntil: NOW + 10 * 60 * 1000 });
  });

  it("successful login resets prior failure count", async () => {
    const t = createTest();
    const player = await seedPlayer(t);

    await t.run((ctx) =>
      ctx.db.insert("pinLoginAttempts", {
        pinHash: player.pinHash,
        failureCount: 3,
        updatedAt: NOW - 1_000,
      }),
    );

    await expect(t.mutation(api.players.loginWithPin, { pin: "A1B2" })).resolves.toMatchObject({ status: "ok" });

    const attempts = await t.run((ctx) =>
      ctx.db
        .query("pinLoginAttempts")
        .withIndex("by_pin_hash", (q) => q.eq("pinHash", player.pinHash))
        .unique(),
    );
    expect(attempts).toMatchObject({ failureCount: 0, updatedAt: NOW });
    expect(attempts?.lockedUntil).toBeUndefined();
  });

  it("inactive player PIN is rejected with generic invalid PIN error", async () => {
    const t = createTest();
    await seedPlayer(t, { active: false });

    await expect(t.mutation(api.players.loginWithPin, { pin: "A1B2" })).resolves.toEqual({
      status: "invalid_pin",
      message: INVALID_PIN_ERROR,
    });
  });

  it("missing PIN returns invalid without a framework validation error", async () => {
    const t = createTest();
    await seedPlayer(t);

    await expect(t.mutation(api.players.loginWithPin, {})).resolves.toEqual({
      status: "invalid_pin",
      message: INVALID_PIN_ERROR,
    });
  });

  it("duplicate active PIN hashes fail closed and do not create a session", async () => {
    const t = createTest();
    await seedPlayer(t, { displayName: "Ana" });
    await seedPlayer(t, { displayName: "Beto" });

    await expect(t.mutation(api.players.loginWithPin, { pin: "A1B2" })).resolves.toEqual({
      status: "invalid_pin",
      message: INVALID_PIN_ERROR,
    });

    const sessions = await t.run((ctx) => ctx.db.query("playerSessions").collect());
    expect(sessions).toHaveLength(0);
  });

  it("getCurrentPlayer works for valid session", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const result = await t.mutation(api.players.loginWithPin, { pin: "A1B2" });
    expect(result.status).toBe("ok");

    await expect(t.query(api.players.getCurrentPlayer, { sessionToken: result.sessionToken })).resolves.toEqual({
      playerId: player.playerId,
      displayName: "Ana",
    });
  });

  it("fake token is rejected", async () => {
    const t = createTest();

    await expect(t.query(api.players.getCurrentPlayer, { sessionToken: "fake-token" })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("revoked session is rejected after logout", async () => {
    const t = createTest();
    await seedPlayer(t);
    const result = await t.mutation(api.players.loginWithPin, { pin: "A1B2" });
    expect(result.status).toBe("ok");

    await expect(t.mutation(api.players.logout, { sessionToken: result.sessionToken })).resolves.toEqual({ status: "ok" });
    await expect(t.mutation(api.players.logout, { sessionToken: result.sessionToken })).resolves.toEqual({ status: "ok" });
    await expect(t.query(api.players.getCurrentPlayer, { sessionToken: result.sessionToken })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("expired session is rejected", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const sessionToken = "expired-token";

    await t.run(async (ctx) => {
      await ctx.db.insert("playerSessions", {
        playerId: player.playerId,
        tokenHash: await hashSessionToken(sessionToken),
        createdAt: NOW - SESSION_TTL_MS - 1,
        lastUsedAt: NOW - SESSION_TTL_MS - 1,
        expiresAt: NOW - 1,
      });
    });

    await expect(t.query(api.players.getCurrentPlayer, { sessionToken })).rejects.toThrow("Not authenticated");
  });

  it("deactivated player is rejected even with valid existing session", async () => {
    const t = createTest();
    const player = await seedPlayer(t);
    const result = await t.mutation(api.players.loginWithPin, { pin: "A1B2" });
    expect(result.status).toBe("ok");

    await t.run((ctx) => ctx.db.patch(player.playerId, { active: false, updatedAt: NOW }));

    await expect(t.query(api.players.getCurrentPlayer, { sessionToken: result.sessionToken })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("response JSON does not contain pinHash or tokenHash", async () => {
    const t = createTest();
    await seedPlayer(t);

    const loginResult = await t.mutation(api.players.loginWithPin, { pin: "A1B2" });
    expect(loginResult.status).toBe("ok");
    const currentPlayer = await t.query(api.players.getCurrentPlayer, { sessionToken: loginResult.sessionToken });

    expect(JSON.stringify(loginResult)).not.toContain("pinHash");
    expect(JSON.stringify(loginResult)).not.toContain("tokenHash");
    expect(JSON.stringify(currentPlayer)).not.toContain("pinHash");
    expect(JSON.stringify(currentPlayer)).not.toContain("tokenHash");
  });
});

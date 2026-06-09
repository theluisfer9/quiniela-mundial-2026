import { describe, expect, it } from "bun:test";

import {
  createSessionExpiration,
  createSessionToken,
  getPinPepper,
  hashPin,
  hashSessionToken,
  isSessionExpired,
  normalizePin,
  PIN_LOCKOUT_AFTER_FAILURES,
  PIN_LOCKOUT_MS,
  PLAYER_SESSION_TTL_MS,
} from "./pinAccess";

describe("normalizePin", () => {
  it("trims and uppercases valid PINs", () => {
    expect(normalizePin(" a1b2 ")).toBe("A1B2");
  });

  it("rejects PINs with the wrong length", () => {
    expect(() => normalizePin("A1B23")).toThrow("PIN must be 4 alphanumeric characters");
  });

  it("rejects PINs with non-alphanumeric characters", () => {
    expect(() => normalizePin("A1-B")).toThrow("PIN must be 4 alphanumeric characters");
  });
});

describe("hashPin", () => {
  it("is deterministic and does not expose the plaintext PIN", async () => {
    const hash = await hashPin("A1B2", "pepper-1");

    expect(hash).toBe(await hashPin("A1B2", "pepper-1"));
    expect(hash).not.toBe("A1B2");
    expect(hash).not.toContain("A1B2");
  });

  it("changes when the pepper changes", async () => {
    await expect(hashPin("A1B2", "pepper-1")).resolves.not.toBe(
      await hashPin("A1B2", "pepper-2"),
    );
  });

  it("rejects an empty pepper", async () => {
    await expect(hashPin("A1B2", "")).rejects.toThrow("PIN access is not configured");
  });
});

describe("hashSessionToken", () => {
  it("uses a separate namespace from PIN hashes", async () => {
    await expect(hashSessionToken("A1B2")).resolves.not.toBe(await hashPin("A1B2", "pepper"));
  });
});

describe("PIN access constants", () => {
  it("exports the player session TTL as 30 days", () => {
    expect(PLAYER_SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("exports the PIN lockout threshold", () => {
    expect(PIN_LOCKOUT_AFTER_FAILURES).toBe(5);
  });

  it("exports the PIN lockout duration as 10 minutes", () => {
    expect(PIN_LOCKOUT_MS).toBe(10 * 60 * 1000);
  });
});

describe("session expiration", () => {
  it("treats sessions as expired when now reaches the expiration time", () => {
    expect(isSessionExpired({ now: 1000, expiresAt: 1000 })).toBe(true);
    expect(isSessionExpired({ now: 999, expiresAt: 1000 })).toBe(false);
  });

  it("creates expiration timestamps using the session TTL", () => {
    expect(createSessionExpiration(1000)).toBe(1000 + PLAYER_SESSION_TTL_MS);
  });
});

describe("getPinPepper", () => {
  it("reads PIN_PEPPER from the environment", () => {
    const originalPepper = process.env.PIN_PEPPER;
    process.env.PIN_PEPPER = "test-pepper";

    try {
      expect(getPinPepper()).toBe("test-pepper");
    } finally {
      process.env.PIN_PEPPER = originalPepper;
    }
  });

  it("throws when PIN_PEPPER is missing", () => {
    const originalPepper = process.env.PIN_PEPPER;
    delete process.env.PIN_PEPPER;

    try {
      expect(() => getPinPepper()).toThrow("PIN access is not configured");
    } finally {
      process.env.PIN_PEPPER = originalPepper;
    }
  });
});

describe("createSessionToken", () => {
  it("creates high-entropy token-shaped strings", () => {
    const token = createSessionToken();

    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });
});

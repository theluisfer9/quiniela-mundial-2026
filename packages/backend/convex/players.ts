import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
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
} from "./lib/pinAccess";

const INVALID_PIN_ERROR = "PIN no reconocido. Revisa el codigo que te compartieron.";
const LOCKED_PIN_ERROR = "Demasiados intentos. Prueba de nuevo en unos minutos.";
const NOT_AUTHENTICATED_ERROR = "Not authenticated";

type PlayerCtx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

function publicPlayer(profile: Doc<"profiles">) {
  return {
    playerId: profile._id,
    displayName: profile.displayName,
  };
}

function invalidPinResult() {
  return { status: "invalid_pin", message: INVALID_PIN_ERROR } as const;
}

function lockedPinResult() {
  return { status: "locked", message: LOCKED_PIN_ERROR } as const;
}

async function getAttempt(ctx: Pick<MutationCtx, "db">, pinHash: string) {
  return await ctx.db
    .query("pinLoginAttempts")
    .withIndex("by_pin_hash", (q) => q.eq("pinHash", pinHash))
    .unique();
}

async function recordFailedPinAttempt(ctx: Pick<MutationCtx, "db">, pinHash: string, now: number) {
  const attempt = await getAttempt(ctx, pinHash);
  const failureCount = (attempt?.failureCount ?? 0) + 1;
  const lockedUntil = failureCount >= PIN_LOCKOUT_AFTER_FAILURES ? now + PIN_LOCKOUT_MS : undefined;

  if (attempt) {
    await ctx.db.patch(attempt._id, {
      failureCount,
      lockedUntil,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.insert("pinLoginAttempts", {
    pinHash,
    failureCount,
    lockedUntil,
    updatedAt: now,
  });
}

async function resetPinAttempts(ctx: Pick<MutationCtx, "db">, pinHash: string, now: number) {
  const attempt = await getAttempt(ctx, pinHash);

  if (!attempt) {
    return;
  }

  await ctx.db.patch(attempt._id, {
    failureCount: 0,
    lockedUntil: undefined,
    updatedAt: now,
  });
}

async function getActivePlayerByPinHash(ctx: PlayerCtx, pinHash: string) {
  const activeProfiles = (
    await ctx.db
      .query("profiles")
      .withIndex("by_pin_hash", (q) => q.eq("pinHash", pinHash))
      .collect()
  ).filter((profile) => profile.pinHash && profile.active === true);

  if (activeProfiles.length !== 1) {
    return null;
  }

  return activeProfiles[0];
}

export async function requirePlayerBySessionToken(ctx: PlayerCtx, sessionToken: string) {
  const tokenHash = await hashSessionToken(sessionToken);
  const session = await ctx.db
    .query("playerSessions")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .unique();

  if (!session || session.revokedAt !== undefined || isSessionExpired({ now: Date.now(), expiresAt: session.expiresAt })) {
    throw new ConvexError(NOT_AUTHENTICATED_ERROR);
  }

  const profile = await ctx.db.get(session.playerId);

  if (!profile || profile.active !== true) {
    throw new ConvexError(NOT_AUTHENTICATED_ERROR);
  }

  return publicPlayer(profile);
}

export const loginWithPin = mutation({
  args: { pin: v.optional(v.string()) },
  returns: v.union(
    v.object({
      status: v.literal("ok"),
      sessionToken: v.string(),
      player: v.object({
        playerId: v.id("profiles"),
        displayName: v.string(),
      }),
    }),
    v.object({
      status: v.literal("invalid_pin"),
      message: v.literal(INVALID_PIN_ERROR),
    }),
    v.object({
      status: v.literal("locked"),
      message: v.literal(LOCKED_PIN_ERROR),
    }),
  ),
  handler: async (ctx, args) => {
    let normalizedPin: string;

    try {
      normalizedPin = normalizePin(args.pin ?? "");
    } catch {
      return invalidPinResult();
    }

    const now = Date.now();
    const pinHash = await hashPin(normalizedPin, getPinPepper());
    const attempt = await getAttempt(ctx, pinHash);

    if (attempt?.lockedUntil !== undefined && attempt.lockedUntil > now) {
      return lockedPinResult();
    }

    const profile = await getActivePlayerByPinHash(ctx, pinHash);

    if (!profile) {
      await recordFailedPinAttempt(ctx, pinHash, now);
      return invalidPinResult();
    }

    await resetPinAttempts(ctx, pinHash, now);

    const sessionToken = createSessionToken();
    await ctx.db.insert("playerSessions", {
      playerId: profile._id,
      tokenHash: await hashSessionToken(sessionToken),
      createdAt: now,
      lastUsedAt: now,
      expiresAt: createSessionExpiration(now),
    });

    return {
      status: "ok" as const,
      sessionToken,
      player: publicPlayer(profile),
    };
  },
});

export const getCurrentPlayer = query({
  args: { sessionToken: v.string() },
  returns: v.object({
    playerId: v.id("profiles"),
    displayName: v.string(),
  }),
  handler: async (ctx, args) => await requirePlayerBySessionToken(ctx, args.sessionToken),
});

export const logout = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({ status: v.literal("ok") }),
  handler: async (ctx, args) => {
    const tokenHash = await hashSessionToken(args.sessionToken);
    const session = await ctx.db
      .query("playerSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    if (session && session.revokedAt === undefined) {
      await ctx.db.patch(session._id, { revokedAt: Date.now() });
    }

    return { status: "ok" as const };
  },
});

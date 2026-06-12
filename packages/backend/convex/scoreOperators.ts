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
} from "./lib/pinAccess";

const NOT_AUTHENTICATED_ERROR = "Not authenticated";

type OperatorCtx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

function publicOperator(operator: Doc<"scoreOperators">) {
  return {
    operatorId: operator._id,
    displayName: operator.displayName,
  };
}

export async function getActiveOperatorByPinHash(ctx: OperatorCtx, pinHash: string) {
  const activeOperators = (
    await ctx.db
      .query("scoreOperators")
      .withIndex("by_pin_hash", (q) => q.eq("pinHash", pinHash))
      .collect()
  ).filter((operator) => operator.active === true);

  if (activeOperators.length !== 1) {
    return null;
  }

  return activeOperators[0];
}

export async function createOperatorSession(ctx: Pick<MutationCtx, "db">, operator: Doc<"scoreOperators">, now: number) {
  const sessionToken = createSessionToken();
  await ctx.db.insert("scoreOperatorSessions", {
    operatorId: operator._id,
    tokenHash: await hashSessionToken(sessionToken),
    createdAt: now,
    lastUsedAt: now,
    expiresAt: createSessionExpiration(now),
  });

  return sessionToken;
}

export async function requireScoreOperatorBySessionToken(ctx: OperatorCtx, sessionToken: string) {
  const tokenHash = await hashSessionToken(sessionToken);
  const session = await ctx.db
    .query("scoreOperatorSessions")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .unique();

  if (!session || session.revokedAt !== undefined || isSessionExpired({ now: Date.now(), expiresAt: session.expiresAt })) {
    throw new ConvexError(NOT_AUTHENTICATED_ERROR);
  }

  const operator = await ctx.db.get(session.operatorId);
  if (!operator || operator.active !== true) {
    throw new ConvexError(NOT_AUTHENTICATED_ERROR);
  }

  return publicOperator(operator);
}

export const getCurrentOperator = query({
  args: { sessionToken: v.string() },
  returns: v.object({
    operatorId: v.id("scoreOperators"),
    displayName: v.string(),
  }),
  handler: async (ctx, args) => await requireScoreOperatorBySessionToken(ctx, args.sessionToken),
});

export const createOperatorWithPin = mutation({
  args: { displayName: v.string(), pin: v.string() },
  returns: v.object({ operatorId: v.id("scoreOperators"), displayName: v.string() }),
  handler: async (ctx, args) => {
    if (process.env.ENABLE_OPERATOR_MANAGEMENT !== "true") {
      throw new Error("Operator management is not enabled");
    }

    const now = Date.now();
    const pinHash = await hashPin(normalizePin(args.pin), getPinPepper());
    const existing = await getActiveOperatorByPinHash(ctx, pinHash);
    if (existing) {
      throw new Error("Operator PIN already exists");
    }

    const operatorId = await ctx.db.insert("scoreOperators", {
      active: true,
      createdAt: now,
      displayName: args.displayName.trim(),
      pinHash,
      updatedAt: now,
    });

    return { operatorId, displayName: args.displayName.trim() };
  },
});

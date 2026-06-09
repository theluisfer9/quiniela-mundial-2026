import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getPinPepper, hashPin, normalizePin } from "./lib/pinAccess";

export const listActivePlayers = query({
  args: {},
  returns: v.array(
    v.object({
      playerId: v.id("profiles"),
      displayName: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const players = await ctx.db
      .query("profiles")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    return players.flatMap((player) =>
      player.pinHash ? [{ playerId: player._id, displayName: player.displayName }] : [],
    );
  },
});

export const addPinPlayers = mutation({
  args: {
    players: v.array(
      v.object({
        displayName: v.string(),
        pin: v.string(),
      }),
    ),
  },
  returns: v.object({
    createdPlayers: v.number(),
  }),
  handler: async (ctx, args) => {
    if (process.env.ENABLE_PLAYER_MANAGEMENT !== "true") {
      throw new Error("Player management is not enabled");
    }

    const now = Date.now();
    const pinPepper = getPinPepper();
    const normalizedPins = new Set<string>();

    for (const player of args.players) {
      const normalizedPin = normalizePin(player.pin);
      if (normalizedPins.has(normalizedPin)) {
        throw new Error(`Duplicate PIN for ${player.displayName}`);
      }
      normalizedPins.add(normalizedPin);
    }

    let createdPlayers = 0;

    for (const player of args.players) {
      const displayName = player.displayName.trim();
      if (!displayName) {
        throw new Error("Player displayName is required");
      }

      const existingProfiles = await ctx.db
        .query("profiles")
        .filter((q) => q.eq(q.field("displayName"), displayName))
        .collect();
      const existingActiveProfile = existingProfiles.find((profile) => profile.active === true);

      if (existingActiveProfile) {
        throw new Error(`Active player already exists: ${displayName}`);
      }

      const pinHash = await hashPin(normalizePin(player.pin), pinPepper);
      const existingPin = await ctx.db
        .query("profiles")
        .withIndex("by_pin_hash", (q) => q.eq("pinHash", pinHash))
        .first();

      if (existingPin) {
        throw new Error(`PIN is already assigned for ${displayName}`);
      }

      await ctx.db.insert("profiles", {
        active: true,
        createdAt: now,
        displayName,
        pinHash,
        updatedAt: now,
      });
      createdPlayers += 1;
    }

    return { createdPlayers };
  },
});

export const renamePinPlayer = mutation({
  args: {
    currentDisplayName: v.string(),
    nextDisplayName: v.string(),
  },
  returns: v.object({
    renamedPlayers: v.number(),
  }),
  handler: async (ctx, args) => {
    if (process.env.ENABLE_PLAYER_MANAGEMENT !== "true") {
      throw new Error("Player management is not enabled");
    }

    const currentDisplayName = args.currentDisplayName.trim();
    const nextDisplayName = args.nextDisplayName.trim();
    if (!currentDisplayName || !nextDisplayName) {
      throw new Error("Player displayName is required");
    }

    const existingNextProfiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("displayName"), nextDisplayName))
      .collect();
    if (existingNextProfiles.some((profile) => profile.active === true)) {
      throw new Error(`Active player already exists: ${nextDisplayName}`);
    }

    const currentProfiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("displayName"), currentDisplayName))
      .collect();
    const activeProfiles = currentProfiles.filter((profile) => profile.active === true);

    if (activeProfiles.length !== 1) {
      throw new Error(`Expected exactly one active player named ${currentDisplayName}`);
    }

    await ctx.db.patch(activeProfiles[0]._id, {
      displayName: nextDisplayName,
      updatedAt: Date.now(),
    });

    return { renamedPlayers: 1 };
  },
});

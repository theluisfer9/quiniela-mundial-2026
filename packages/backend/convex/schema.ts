import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const persistedScore = v.int64();

export default defineSchema({
  profiles: defineTable({
    userId: v.optional(v.string()),
    displayName: v.string(),
    pinHash: v.optional(v.string()),
    active: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
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
    .index("by_player_id", ["playerId"])
    .index("by_expires_at", ["expiresAt"]),

  pinLoginAttempts: defineTable({
    pinHash: v.string(),
    failureCount: v.number(),
    lockedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_pin_hash", ["pinHash"]),

  teams: defineTable({
    code: v.string(),
    name: v.string(),
    flagEmoji: v.optional(v.string()),
    groupCode: v.optional(v.string()),
    worldRanking: v.optional(v.number()),
    isHost: v.optional(v.boolean()),
  }).index("by_code", ["code"]),

  matches: defineTable({
    kickoffAt: v.number(),
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    stageLabel: v.string(),
    matchNumber: v.optional(v.number()),
    venue: v.optional(v.string()),
    homeScore: v.optional(persistedScore),
    awayScore: v.optional(persistedScore),
    status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("finished")),
  }).index("by_kickoff_at", ["kickoffAt"]),

  predictions: defineTable({
    userId: v.optional(v.string()),
    playerId: v.optional(v.id("profiles")),
    matchId: v.id("matches"),
    homeScore: persistedScore,
    awayScore: persistedScore,
    updatedAt: v.number(),
  })
    .index("by_player_id_match_id", ["playerId", "matchId"])
    .index("by_match_id", ["matchId"]),
});

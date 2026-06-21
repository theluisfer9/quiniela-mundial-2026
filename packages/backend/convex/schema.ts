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

  scoreOperators: defineTable({
    displayName: v.string(),
    pinHash: v.string(),
    active: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_pin_hash", ["pinHash"])
    .index("by_active", ["active"]),

  scoreOperatorSessions: defineTable({
    operatorId: v.id("scoreOperators"),
    tokenHash: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_operator_id", ["operatorId"])
    .index("by_expires_at", ["expiresAt"]),

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
  })
    .index("by_kickoff_at", ["kickoffAt"])
    .index("by_status_kickoff_at", ["status", "kickoffAt"]),

  matchDisciplineEvents: defineTable({
    cardType: v.union(v.literal("yellow"), v.literal("red"), v.literal("secondYellow")),
    matchId: v.id("matches"),
    minute: v.union(v.number(), v.null()),
    minuteAdded: v.union(v.number(), v.null()),
    playerName: v.union(v.string(), v.null()),
    provider: v.literal("fotmob"),
    providerEventId: v.string(),
    providerMatchId: v.string(),
    providerPlayerId: v.union(v.string(), v.null()),
    syncedAt: v.number(),
    teamSide: v.union(v.literal("home"), v.literal("away"), v.literal("unknown")),
  })
    .index("by_match_id", ["matchId"])
    .index("by_provider_and_provider_match_id_and_provider_event_id", [
      "provider",
      "providerMatchId",
      "providerEventId",
    ]),

  matchDisciplineSummaries: defineTable({
    awayRedCards: v.number(),
    awayYellowCards: v.union(v.number(), v.null()),
    homeRedCards: v.number(),
    homeYellowCards: v.union(v.number(), v.null()),
    matchId: v.id("matches"),
    provider: v.literal("fotmob"),
    providerMatchId: v.string(),
    syncedAt: v.number(),
  })
    .index("by_match_id", ["matchId"])
    .index("by_provider_and_provider_match_id", ["provider", "providerMatchId"]),

  disciplineSyncLogs: defineTable({
    date: v.string(),
    eventsUpserted: v.number(),
    matchId: v.optional(v.id("matches")),
    message: v.optional(v.string()),
    provider: v.literal("fotmob"),
    providerMatchId: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("skipped")),
    syncedAt: v.number(),
  })
    .index("by_provider_and_date", ["provider", "date"])
    .index("by_status_and_synced_at", ["status", "syncedAt"]),

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

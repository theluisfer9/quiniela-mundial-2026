import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const persistedScore = v.int64();

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    displayName: v.string(),
  }).index("by_user_id", ["userId"]),

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
    userId: v.string(),
    matchId: v.id("matches"),
    homeScore: persistedScore,
    awayScore: persistedScore,
    updatedAt: v.number(),
  })
    .index("by_user_id_match_id", ["userId", "matchId"])
    .index("by_match_id", ["matchId"]),
});

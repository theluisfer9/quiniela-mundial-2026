import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/currentUser";
import { getDefaultDisplayName } from "./lib/profiles";

const ensureCurrentProfileResult = v.object({
  profileId: v.id("profiles"),
  displayName: v.string(),
  created: v.boolean(),
});

export const ensureCurrentProfile = mutation({
  args: {},
  returns: ensureCurrentProfileResult,
  handler: async (ctx) => {
    const authUser = await getCurrentUserOrNull(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const userId = authUser.userId;
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      return {
        profileId: existingProfile._id,
        displayName: existingProfile.displayName,
        created: false,
      };
    }

    const displayName = getDefaultDisplayName(authUser);
    const profileId = await ctx.db.insert("profiles", {
      userId,
      displayName,
    });

    return {
      profileId,
      displayName,
      created: true,
    };
  },
});

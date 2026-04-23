import type { QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";

type AuthCtx = QueryCtx | MutationCtx;

export type CurrentUser = {
  userId: string;
  name?: string | null;
  email?: string | null;
};

function canUseTestAuthFallback() {
  return process.env.NODE_ENV === "test" && process.env.CONVEX_TEST_AUTH_FALLBACK === "true";
}

export async function getCurrentUserOrNull(ctx: AuthCtx): Promise<CurrentUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  try {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (authUser?.userId) {
      return {
        userId: authUser.userId,
        name: authUser.name ?? identity.name,
        email: authUser.email ?? identity.email,
      };
    }
  } catch (error) {
    if (canUseTestAuthFallback() && identity.tokenIdentifier) {
      return {
        userId: identity.tokenIdentifier,
        name: identity.name,
        email: identity.email,
      };
    }

    throw error;
  }

  if (canUseTestAuthFallback() && identity.tokenIdentifier) {
    return {
      userId: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
    };
  }

  throw new Error("Authenticated identity is missing a Better Auth userId");
}

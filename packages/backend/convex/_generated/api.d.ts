/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_currentUser from "../lib/currentUser.js";
import type * as lib_profiles from "../lib/profiles.js";
import type * as lib_scores from "../lib/scores.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as lib_visibility from "../lib/visibility.js";
import type * as lib_worldCup2026GroupStage from "../lib/worldCup2026GroupStage.js";
import type * as matches from "../matches.js";
import type * as players from "../players.js";
import type * as predictions from "../predictions.js";
import type * as privateData from "../privateData.js";
import type * as profiles from "../profiles.js";
import type * as seed from "../seed.js";
import type * as standings from "../standings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/currentUser": typeof lib_currentUser;
  "lib/profiles": typeof lib_profiles;
  "lib/scores": typeof lib_scores;
  "lib/scoring": typeof lib_scoring;
  "lib/visibility": typeof lib_visibility;
  "lib/worldCup2026GroupStage": typeof lib_worldCup2026GroupStage;
  matches: typeof matches;
  players: typeof players;
  predictions: typeof predictions;
  privateData: typeof privateData;
  profiles: typeof profiles;
  seed: typeof seed;
  standings: typeof standings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};

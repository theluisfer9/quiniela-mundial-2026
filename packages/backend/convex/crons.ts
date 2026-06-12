import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "mark started matches live",
  "0,30 * * * *",
  internal.matches.markStartedMatchesLive,
  {},
);

export default crons;

import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "mark started matches live",
  "0,30 * * * *",
  internal.matches.markStartedMatchesLive,
  {},
);

crons.cron(
  "sync previous day discipline cards",
  "20 9 * * *",
  internal.disciplineActions.syncPreviousGuatemalaDate,
  {},
);

export default crons;

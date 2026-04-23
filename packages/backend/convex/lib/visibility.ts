type MatchTimingArgs = {
  kickoff: number;
  now: number;
};

export function isMatchLocked({ kickoff, now }: MatchTimingArgs) {
  return now >= kickoff;
}

export function canRevealPrediction({ kickoff, now }: MatchTimingArgs) {
  return now >= kickoff;
}

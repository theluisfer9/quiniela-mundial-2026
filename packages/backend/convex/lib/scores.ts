export const MAX_SOCCER_SCORE = 20;

export function normalizeSoccerScore(score: bigint) {
  if (score < 0n || score > BigInt(MAX_SOCCER_SCORE)) {
    throw new RangeError(`Score must be between 0 and ${MAX_SOCCER_SCORE}`);
  }

  return Number(score);
}

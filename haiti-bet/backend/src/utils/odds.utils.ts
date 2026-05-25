export interface RawProbability {
  code: string;
  probability: number;
}

export interface PricedOutcome {
  code: string;
  probability: number;
  trueOdds: number;
  pricedOdds: number;
}

/**
 * Converts raw win probabilities to decimal odds with bookmaker margin applied.
 * Uses the overround method: each implied probability is reduced by the margin factor.
 */
export function applyMargin(outcomes: RawProbability[], margin: number): PricedOutcome[] {
  const totalProb = outcomes.reduce((sum, o) => sum + o.probability, 0);
  const targetOverround = 1 + margin;

  return outcomes.map((o) => {
    const normalizedProb = o.probability / totalProb;
    const impliedProb = normalizedProb * targetOverround;
    const trueOdds = 1 / normalizedProb;
    const pricedOdds = 1 / impliedProb;

    return {
      code: o.code,
      probability: normalizedProb,
      trueOdds: parseFloat(trueOdds.toFixed(4)),
      pricedOdds: parseFloat(pricedOdds.toFixed(4)),
    };
  });
}

/**
 * Adjusts odds dynamically based on live match state.
 * - After a goal: shift probabilities significantly
 * - After red card: reduce the affected team's odds
 * - Over time in live: narrow the range (more certainty)
 */
export function adjustOddsForLive(params: {
  baseOdds: Record<string, number>;
  homeScore: number;
  awayScore: number;
  minute: number;
  period: string;
  isHaitiHome: boolean;
  redCardHome: number;
  redCardAway: number;
  margin: number;
}): Record<string, number> {
  const {
    baseOdds,
    homeScore,
    awayScore,
    minute,
    period,
    isHaitiHome,
    redCardHome,
    redCardAway,
    margin,
  } = params;

  const scoreDiff = homeScore - awayScore;
  const totalMinutes = period === 'SECOND_HALF' ? 45 + minute : minute;
  const timeWeight = Math.min(totalMinutes / 90, 0.95);

  const rawProbs: RawProbability[] = [];

  if ('H' in baseOdds && 'D' in baseOdds && 'A' in baseOdds) {
    let homeP = 1 / baseOdds['H'];
    let drawP = 1 / baseOdds['D'];
    let awayP = 1 / baseOdds['A'];

    const goalShift = 0.15 * Math.abs(scoreDiff);
    const redCardPenalty = 0.08;

    if (scoreDiff > 0) {
      homeP += goalShift * timeWeight;
      drawP -= goalShift * 0.5 * timeWeight;
      awayP -= goalShift * 0.5 * timeWeight;
    } else if (scoreDiff < 0) {
      awayP += goalShift * timeWeight;
      homeP -= goalShift * 0.5 * timeWeight;
      drawP -= goalShift * 0.5 * timeWeight;
    }

    homeP -= redCardHome * redCardPenalty;
    awayP -= redCardAway * redCardPenalty;

    homeP = Math.max(homeP, 0.02);
    drawP = Math.max(drawP, 0.02);
    awayP = Math.max(awayP, 0.02);

    rawProbs.push(
      { code: 'H', probability: homeP },
      { code: 'D', probability: drawP },
      { code: 'A', probability: awayP },
    );
  }

  const priced = applyMargin(rawProbs, margin);
  return Object.fromEntries(priced.map((p) => [p.code, p.pricedOdds]));
}

/**
 * Calculates the potential win for a bet.
 * For accumulator: multiply all odds, for single: direct.
 */
export function calculatePotentialWin(stake: number, oddsValues: number[]): number {
  const combinedOdds = oddsValues.reduce((acc, o) => acc * o, 1);
  return parseFloat((stake * combinedOdds).toFixed(2));
}

/**
 * Checks if the bookmaker should suspend markets based on event.
 */
export function shouldSuspendOnEvent(eventType: string): boolean {
  return ['GOAL', 'RED_CARD', 'PENALTY_AWARDED', 'VAR_CHECK'].includes(eventType);
}

/**
 * Increments the odds version for audit trail.
 */
export function nextVersion(currentVersion: number): number {
  return currentVersion + 1;
}

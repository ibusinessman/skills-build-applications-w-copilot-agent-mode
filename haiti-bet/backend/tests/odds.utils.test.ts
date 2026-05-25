import {
  applyMargin,
  adjustOddsForLive,
  calculatePotentialWin,
  shouldSuspendOnEvent,
} from '../src/utils/odds.utils';

describe('applyMargin', () => {
  it('produces odds where sum of implied probabilities exceeds 1 by the margin', () => {
    const outcomes = [
      { code: 'H', probability: 0.40 },
      { code: 'D', probability: 0.28 },
      { code: 'A', probability: 0.32 },
    ];
    const margin = 0.05;
    const priced = applyMargin(outcomes, margin);

    const sumImplied = priced.reduce((sum, o) => sum + 1 / o.pricedOdds, 0);
    expect(sumImplied).toBeCloseTo(1 + margin, 2);
  });

  it('all priced odds are less than true odds (bookmaker gets edge)', () => {
    const outcomes = [
      { code: 'H', probability: 0.5 },
      { code: 'A', probability: 0.5 },
    ];
    const priced = applyMargin(outcomes, 0.05);
    for (const o of priced) {
      expect(o.pricedOdds).toBeLessThan(o.trueOdds);
    }
  });

  it('handles unbalanced probabilities correctly', () => {
    const outcomes = [
      { code: 'H', probability: 0.70 },
      { code: 'A', probability: 0.30 },
    ];
    const priced = applyMargin(outcomes, 0.05);
    const heavy = priced.find((o) => o.code === 'H')!;
    const light = priced.find((o) => o.code === 'A')!;
    expect(heavy.pricedOdds).toBeLessThan(light.pricedOdds);
  });
});

describe('adjustOddsForLive', () => {
  const baseOdds = { H: 2.5, D: 3.2, A: 2.8 };

  it('shifts odds toward home team after they score', () => {
    const before = { ...baseOdds };
    const after = adjustOddsForLive({
      baseOdds: before,
      homeScore: 1,
      awayScore: 0,
      minute: 30,
      period: 'FIRST_HALF',
      isHaitiHome: true,
      redCardHome: 0,
      redCardAway: 0,
      margin: 0.05,
    });

    expect(after['H']).toBeLessThan(before['H']);
    expect(after['A']).toBeGreaterThan(before['A']);
  });

  it('penalizes team with red card', () => {
    const after = adjustOddsForLive({
      baseOdds,
      homeScore: 0,
      awayScore: 0,
      minute: 20,
      period: 'FIRST_HALF',
      isHaitiHome: true,
      redCardHome: 1,
      redCardAway: 0,
      margin: 0.05,
    });

    const noRedCard = adjustOddsForLive({
      baseOdds,
      homeScore: 0,
      awayScore: 0,
      minute: 20,
      period: 'FIRST_HALF',
      isHaitiHome: true,
      redCardHome: 0,
      redCardAway: 0,
      margin: 0.05,
    });

    expect(after['H']).toBeGreaterThan(noRedCard['H']);
  });

  it('all odds remain above 1.0', () => {
    const after = adjustOddsForLive({
      baseOdds,
      homeScore: 5,
      awayScore: 0,
      minute: 85,
      period: 'SECOND_HALF',
      isHaitiHome: true,
      redCardHome: 2,
      redCardAway: 0,
      margin: 0.05,
    });

    for (const value of Object.values(after)) {
      expect(value).toBeGreaterThan(1.0);
    }
  });
});

describe('calculatePotentialWin', () => {
  it('calculates single bet correctly', () => {
    const win = calculatePotentialWin(100, [2.5]);
    expect(win).toBe(250);
  });

  it('calculates accumulator correctly', () => {
    const win = calculatePotentialWin(100, [2.0, 1.5]);
    expect(win).toBe(300);
  });

  it('returns stake when odds is 1.0', () => {
    const win = calculatePotentialWin(200, [1.0]);
    expect(win).toBe(200);
  });
});

describe('shouldSuspendOnEvent', () => {
  it('suspends on GOAL', () => expect(shouldSuspendOnEvent('GOAL')).toBe(true));
  it('suspends on RED_CARD', () => expect(shouldSuspendOnEvent('RED_CARD')).toBe(true));
  it('suspends on PENALTY_AWARDED', () => expect(shouldSuspendOnEvent('PENALTY_AWARDED')).toBe(true));
  it('does not suspend on YELLOW_CARD', () => expect(shouldSuspendOnEvent('YELLOW_CARD')).toBe(false));
  it('does not suspend on SUBSTITUTION', () => expect(shouldSuspendOnEvent('SUBSTITUTION')).toBe(false));
});

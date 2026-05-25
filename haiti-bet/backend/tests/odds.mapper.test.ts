import {
  mapExternalEvent,
  mapExternalEvents,
  extractH2hOdds,
  detectDrift,
  hasCriticalDrift,
  toProbabilities,
} from '../src/modules/odds/odds.mapper';
import type { ExternalEvent } from '../src/modules/odds/odds.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeEvent = (overrides?: Partial<ExternalEvent>): ExternalEvent => ({
  id: 'ext-001',
  sport_key: 'soccer_concacaf_gold_cup',
  sport_title: 'CONCACAF Gold Cup',
  commence_time: '2025-07-01T20:00:00Z',
  home_team: 'Haiti',
  away_team: 'Jamaica',
  bookmakers: [
    {
      key: 'pinnacle',
      title: 'Pinnacle',
      last_update: '2025-07-01T18:00:00Z',
      markets: [
        {
          key: 'h2h',
          last_update: '2025-07-01T18:00:00Z',
          outcomes: [
            { name: 'Haiti', price: 2.8 },
            { name: 'Draw', price: 3.1 },
            { name: 'Jamaica', price: 2.5 },
          ],
        },
        {
          key: 'totals',
          last_update: '2025-07-01T18:00:00Z',
          outcomes: [
            { name: 'Over', price: 2.1, point: 2.5 },
            { name: 'Under', price: 1.72, point: 2.5 },
          ],
        },
      ],
    },
  ],
  ...overrides,
});

// ---------------------------------------------------------------------------
// mapExternalEvent
// ---------------------------------------------------------------------------

describe('mapExternalEvent', () => {
  it('returns a normalized event from a valid external event', () => {
    const ev = makeEvent();
    const result = mapExternalEvent(ev);

    expect(result).not.toBeNull();
    expect(result!.externalId).toBe('ext-001');
    expect(result!.homeTeam).toBe('Haiti');
    expect(result!.awayTeam).toBe('Jamaica');
    expect(result!.markets).toHaveLength(2);
  });

  it('assigns correct codes to h2h outcomes', () => {
    const result = mapExternalEvent(makeEvent())!;
    const h2h = result.markets.find((m) => m.type === 'h2h')!;

    expect(h2h.outcomes.find((o) => o.code === 'H')?.odds).toBe(2.8);
    expect(h2h.outcomes.find((o) => o.code === 'D')?.odds).toBe(3.1);
    expect(h2h.outcomes.find((o) => o.code === 'A')?.odds).toBe(2.5);
  });

  it('assigns OVER/UNDER codes to totals outcomes', () => {
    const result = mapExternalEvent(makeEvent())!;
    const totals = result.markets.find((m) => m.type === 'totals')!;

    expect(totals.outcomes.find((o) => o.code === 'OVER')?.odds).toBe(2.1);
    expect(totals.outcomes.find((o) => o.code === 'UNDER')?.odds).toBe(1.72);
    expect(totals.outcomes.find((o) => o.code === 'OVER')?.point).toBe(2.5);
  });

  it('returns null when event has no bookmakers', () => {
    const ev = makeEvent({ bookmakers: [] });
    expect(mapExternalEvent(ev)).toBeNull();
  });

  it('prefers Pinnacle over other bookmakers', () => {
    const ev = makeEvent({
      bookmakers: [
        {
          key: 'bet365',
          title: 'Bet365',
          last_update: '2025-07-01T18:00:00Z',
          markets: [{ key: 'h2h', last_update: '2025-07-01T18:00:00Z', outcomes: [{ name: 'Haiti', price: 2.6 }] }],
        },
        {
          key: 'pinnacle',
          title: 'Pinnacle',
          last_update: '2025-07-01T18:00:00Z',
          markets: [{ key: 'h2h', last_update: '2025-07-01T18:00:00Z', outcomes: [{ name: 'Haiti', price: 2.9 }] }],
        },
      ],
    });
    const result = mapExternalEvent(ev)!;
    const h2h = result.markets.find((m) => m.type === 'h2h')!;
    expect(h2h.outcomes[0].odds).toBe(2.9); // Pinnacle price
  });
});

// ---------------------------------------------------------------------------
// mapExternalEvents
// ---------------------------------------------------------------------------

describe('mapExternalEvents', () => {
  it('filters out events with no usable bookmakers', () => {
    const events = [makeEvent(), makeEvent({ id: 'x', bookmakers: [] })];
    const result = mapExternalEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].externalId).toBe('ext-001');
  });
});

// ---------------------------------------------------------------------------
// extractH2hOdds
// ---------------------------------------------------------------------------

describe('extractH2hOdds', () => {
  it('returns code→odds map for h2h market', () => {
    const ev = mapExternalEvent(makeEvent())!;
    const odds = extractH2hOdds(ev);
    expect(odds).toEqual({ H: 2.8, D: 3.1, A: 2.5 });
  });

  it('returns empty object when no h2h market', () => {
    const ev = mapExternalEvent(makeEvent())!;
    ev.markets = ev.markets.filter((m) => m.type !== 'h2h');
    expect(extractH2hOdds(ev)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// detectDrift
// ---------------------------------------------------------------------------

describe('detectDrift', () => {
  it('detects no drift when odds are identical', () => {
    const prev = { H: 2.5, D: 3.0, A: 2.8 };
    const curr = { H: 2.5, D: 3.0, A: 2.8 };
    const drifts = detectDrift(prev, curr);
    expect(drifts.every((d) => d.driftPercent === 0)).toBe(true);
    expect(hasCriticalDrift(drifts)).toBe(false);
  });

  it('detects critical drift when odds move > threshold', () => {
    const prev = { H: 2.0, D: 3.0, A: 4.0 };
    // H moves from 2.0 → 1.4 = 30% drift
    const curr = { H: 1.4, D: 3.0, A: 4.0 };
    const drifts = detectDrift(prev, curr);
    const hDrift = drifts.find((d) => d.outcomeCode === 'H')!;
    expect(hDrift.driftPercent).toBeCloseTo(30, 0);
    expect(hDrift.exceedsThreshold).toBe(true);
    expect(hasCriticalDrift(drifts)).toBe(true);
  });

  it('does not flag drift within acceptable range (< threshold)', () => {
    const prev = { H: 2.0, D: 3.0, A: 4.0 };
    // H moves 5% — below 12% default threshold
    const curr = { H: 2.1, D: 3.0, A: 4.0 };
    const drifts = detectDrift(prev, curr);
    expect(hasCriticalDrift(drifts)).toBe(false);
  });

  it('skips codes missing from current snapshot', () => {
    const drifts = detectDrift({ H: 2.0, D: 3.0 }, { H: 2.0 });
    expect(drifts).toHaveLength(1);
    expect(drifts[0].outcomeCode).toBe('H');
  });
});

// ---------------------------------------------------------------------------
// toProbabilities
// ---------------------------------------------------------------------------

describe('toProbabilities', () => {
  it('converts odds to normalized probabilities summing to 1', () => {
    const outcomes = [
      { name: 'Haiti', code: 'H', odds: 2.5 },
      { name: 'Draw', code: 'D', odds: 3.2 },
      { name: 'Jamaica', code: 'A', odds: 2.9 },
    ];
    const probs = toProbabilities(outcomes);
    const total = probs.reduce((sum, p) => sum + p.probability, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('assigns higher probability to lower odds', () => {
    const outcomes = [
      { name: 'Haiti', code: 'H', odds: 1.5 },
      { name: 'Jamaica', code: 'A', odds: 5.0 },
    ];
    const probs = toProbabilities(outcomes);
    const h = probs.find((p) => p.code === 'H')!;
    const a = probs.find((p) => p.code === 'A')!;
    expect(h.probability).toBeGreaterThan(a.probability);
  });
});

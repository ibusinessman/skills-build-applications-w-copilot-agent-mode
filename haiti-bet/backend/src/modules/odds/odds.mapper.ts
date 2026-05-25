import type {
  ExternalEvent,
  ExternalBookmaker,
  ExternalMarketData,
  NormalizedOddsEvent,
  NormalizedMarket,
  NormalizedOutcome,
  OddsDrift,
} from './odds.types';
import { PREFERRED_BOOKMAKERS } from './odds.types';
import { env } from '../../config/env';

// Maximum % change before we consider odds to have drifted (default 12%)
const DRIFT_THRESHOLD_PCT = env.ODDS_DRIFT_THRESHOLD_PCT;

/**
 * Selects the best available bookmaker from a list, preferring known sharp books.
 */
function pickBookmaker(bookmakers: ExternalBookmaker[]): ExternalBookmaker | null {
  for (const pref of PREFERRED_BOOKMAKERS) {
    const found = bookmakers.find((b) => b.key === pref);
    if (found) return found;
  }
  return bookmakers[0] ?? null;
}

/**
 * Maps a raw h2h market into normalized outcomes with standard codes.
 * Home → 'H', Draw → 'D', Away → 'A'
 */
function mapH2hOutcomes(
  market: ExternalMarketData,
  homeTeam: string,
  awayTeam: string,
): NormalizedOutcome[] {
  return market.outcomes.map((o) => {
    let code: string;
    const lc = o.name.toLowerCase();
    if (lc === homeTeam.toLowerCase() || lc === 'home') {
      code = 'H';
    } else if (lc === awayTeam.toLowerCase() || lc === 'away') {
      code = 'A';
    } else if (lc === 'draw') {
      code = 'D';
    } else {
      code = o.name.toUpperCase().slice(0, 4);
    }
    return { name: o.name, code, odds: o.price };
  });
}

/**
 * Maps a totals market into Over/Under outcomes.
 */
function mapTotalsOutcomes(market: ExternalMarketData): NormalizedOutcome[] {
  return market.outcomes.map((o) => ({
    name: `${o.name} ${o.point ?? ''}`.trim(),
    code: o.name.toLowerCase() === 'over' ? 'OVER' : 'UNDER',
    odds: o.price,
    point: o.point,
  }));
}

/**
 * Converts a raw external event into our internal normalized format.
 * Picks the best bookmaker and maps all markets.
 */
export function mapExternalEvent(event: ExternalEvent): NormalizedOddsEvent | null {
  const bookmaker = pickBookmaker(event.bookmakers);
  if (!bookmaker) return null;

  const markets: NormalizedMarket[] = [];

  for (const market of bookmaker.markets) {
    let outcomes: NormalizedOutcome[];

    switch (market.key) {
      case 'h2h':
        outcomes = mapH2hOutcomes(market, event.home_team, event.away_team);
        break;
      case 'totals':
        outcomes = mapTotalsOutcomes(market);
        break;
      default:
        continue;
    }

    markets.push({
      type: market.key,
      lastUpdate: new Date(market.last_update),
      outcomes,
    });
  }

  if (markets.length === 0) return null;

  return {
    externalId: event.id,
    sportKey: event.sport_key,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: new Date(event.commence_time),
    markets,
    fetchedAt: new Date(),
    source: 'api',
  };
}

/**
 * Converts an array of external events, skipping any that have no usable odds.
 */
export function mapExternalEvents(events: ExternalEvent[]): NormalizedOddsEvent[] {
  return events.flatMap((ev) => {
    const mapped = mapExternalEvent(ev);
    return mapped ? [mapped] : [];
  });
}

/**
 * Extracts h2h outcomes as a simple code→odds map for quick comparison.
 */
export function extractH2hOdds(event: NormalizedOddsEvent): Record<string, number> {
  const market = event.markets.find((m) => m.type === 'h2h');
  if (!market) return {};
  return Object.fromEntries(market.outcomes.map((o) => [o.code, o.odds]));
}

/**
 * Detects how much odds have moved between two snapshots.
 * Used to decide whether markets should be suspended.
 */
export function detectDrift(
  previous: Record<string, number>,
  current: Record<string, number>,
): OddsDrift[] {
  const drifts: OddsDrift[] = [];

  for (const [code, prevOdds] of Object.entries(previous)) {
    const currOdds = current[code];
    if (currOdds === undefined) continue;

    const driftPct = Math.abs((currOdds - prevOdds) / prevOdds) * 100;
    drifts.push({
      outcomeCode: code,
      previousOdds: prevOdds,
      currentOdds: currOdds,
      driftPercent: parseFloat(driftPct.toFixed(2)),
      exceedsThreshold: driftPct >= DRIFT_THRESHOLD_PCT,
    });
  }

  return drifts;
}

/**
 * Returns true if any outcome's odds moved more than the threshold.
 */
export function hasCriticalDrift(drifts: OddsDrift[]): boolean {
  return drifts.some((d) => d.exceedsThreshold);
}

/**
 * Converts normalized odds into the probability format used by our OddsEngine.
 */
export function toProbabilities(outcomes: NormalizedOutcome[]): Array<{ code: string; probability: number }> {
  const total = outcomes.reduce((sum, o) => sum + 1 / o.odds, 0);
  return outcomes.map((o) => ({
    code: o.code,
    probability: (1 / o.odds) / total,
  }));
}

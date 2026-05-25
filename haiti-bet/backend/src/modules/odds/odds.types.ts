// Types for the-odds-api.com v4 response format

export type OddsFormat = 'decimal' | 'american';
export type Region = 'us' | 'uk' | 'eu' | 'au';
export type ExternalMarket = 'h2h' | 'spreads' | 'totals' | 'outrights';

// Raw API response types
export interface ExternalBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: ExternalMarketData[];
}

export interface ExternalMarketData {
  key: 'h2h' | 'spreads' | 'totals';
  last_update: string;
  outcomes: ExternalOutcome[];
}

export interface ExternalOutcome {
  name: string;
  price: number;
  point?: number; // for totals/spreads
}

export interface ExternalEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: ExternalBookmaker[];
}

export interface ExternalSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

// Internal normalized types (after mapping)
export interface NormalizedOddsEvent {
  externalId: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: Date;
  markets: NormalizedMarket[];
  fetchedAt: Date;
  source: 'api' | 'cache' | 'fallback';
}

export interface NormalizedMarket {
  type: 'h2h' | 'totals' | 'spreads';
  lastUpdate: Date;
  outcomes: NormalizedOutcome[];
}

export interface NormalizedOutcome {
  name: string;
  code: string;
  odds: number;
  point?: number;
}

// Drift detection
export interface OddsDrift {
  outcomeCode: string;
  previousOdds: number;
  currentOdds: number;
  driftPercent: number;
  exceedsThreshold: boolean;
}

export interface OddsResponse {
  source: 'api' | 'cache' | 'fallback';
  fetchedAt: string;
  data: any;
}

// Haiti-focused sports to monitor
export const HAITI_SPORT_KEYS = [
  'soccer_concacaf_gold_cup',
  'soccer_concacaf_nations_league',
  'soccer_concacaf_champions_cup',
  'soccer_world_cup',
  'soccer_concacaf_womens_championship',
] as const;

export type HaitiSportKey = typeof HAITI_SPORT_KEYS[number];

// Bookmakers preferred for price reference
export const PREFERRED_BOOKMAKERS = ['pinnacle', 'betfair', 'bet365', 'unibet'] as const;

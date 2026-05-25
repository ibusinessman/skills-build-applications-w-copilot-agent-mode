import axios, { AxiosInstance, AxiosError } from 'axios';
import { Redis } from 'ioredis';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import type {
  OddsFormat,
  Region,
  ExternalMarket,
  ExternalEvent,
  ExternalSport,
  OddsResponse,
} from './odds.types';

interface OddsQuery {
  sportKey: string;
  regions?: Region[];
  markets?: ExternalMarket[];
  oddsFormat?: OddsFormat;
  bookmakers?: string[];
  ttlSeconds?: number;
}

const DEFAULT_TTL = env.ODDS_CACHE_TTL_SECONDS;
const STALE_TTL = env.ODDS_STALE_TTL_SECONDS;
const BASE_URL = 'https://api.the-odds-api.com/v4';

function buildCacheKey(path: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `odds:v4:${path.replace(/\//g, '_')}:${sorted}`;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // cache write failure is non-fatal
  }
}

function staleKey(key: string): string {
  return `${key}:stale`;
}

export class ExternalOddsService {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = env.ODDS_API_KEY;

    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: env.ODDS_API_TIMEOUT_MS,
      headers: { Accept: 'application/json' },
    });

    // Log remaining quota from response headers
    this.http.interceptors.response.use((res) => {
      const remaining = res.headers['x-requests-remaining'];
      const used = res.headers['x-requests-used'];
      if (remaining !== undefined) {
        console.log(`[OddsAPI] Requests remaining: ${remaining} (used: ${used})`);
      }
      return res;
    });
  }

  private async fetch<T>(path: string, params: Record<string, string>): Promise<T> {
    const res = await this.http.get<T>(path, {
      params: { ...params, apiKey: this.apiKey },
    });
    return res.data;
  }

  /**
   * Fetch odds for a sport. Returns cached data if fresh, falls back to stale on API error.
   */
  async getOdds(query: OddsQuery): Promise<OddsResponse> {
    const {
      sportKey,
      regions = ['eu'],
      markets = ['h2h', 'totals'],
      oddsFormat = 'decimal',
      bookmakers,
      ttlSeconds = DEFAULT_TTL,
    } = query;

    const path = `/sports/${sportKey}/odds/`;
    const params: Record<string, string> = {
      regions: regions.join(','),
      markets: markets.join(','),
      oddsFormat,
      dateFormat: 'iso',
    };
    if (bookmakers?.length) params.bookmakers = bookmakers.join(',');

    const key = buildCacheKey(path, params);

    const cached = await readCache<ExternalEvent[]>(key);
    if (cached) {
      return { source: 'cache', fetchedAt: new Date().toISOString(), data: cached };
    }

    try {
      const data = await this.fetch<ExternalEvent[]>(path, params);
      await writeCache(key, data, ttlSeconds);
      await writeCache(staleKey(key), data, STALE_TTL);
      return { source: 'api', fetchedAt: new Date().toISOString(), data };
    } catch (err) {
      this.logApiError(err);
      const stale = await readCache<ExternalEvent[]>(staleKey(key));
      if (stale) {
        return { source: 'fallback', fetchedAt: new Date().toISOString(), data: stale };
      }
      throw new Error(`Odds API unavailable and no fallback for sport: ${sportKey}`);
    }
  }

  /**
   * Fetch odds for a single event by its external ID.
   */
  async getEventOdds(
    sportKey: string,
    eventId: string,
    opts: Pick<OddsQuery, 'markets' | 'regions' | 'oddsFormat' | 'ttlSeconds'> = {},
  ): Promise<OddsResponse> {
    const markets = opts.markets ?? ['h2h', 'totals'];
    const regions = opts.regions ?? ['eu'];
    const oddsFormat = opts.oddsFormat ?? 'decimal';

    const path = `/sports/${sportKey}/events/${eventId}/odds/`;
    const params: Record<string, string> = {
      regions: regions.join(','),
      markets: markets.join(','),
      oddsFormat,
      dateFormat: 'iso',
    };

    const key = buildCacheKey(path, params);

    const cached = await readCache<ExternalEvent>(key);
    if (cached) {
      return { source: 'cache', fetchedAt: new Date().toISOString(), data: cached };
    }

    try {
      const data = await this.fetch<ExternalEvent>(path, params);
      const ttl = opts.ttlSeconds ?? DEFAULT_TTL;
      await writeCache(key, data, ttl);
      await writeCache(staleKey(key), data, STALE_TTL);
      return { source: 'api', fetchedAt: new Date().toISOString(), data };
    } catch (err) {
      this.logApiError(err);
      const stale = await readCache<ExternalEvent>(staleKey(key));
      if (stale) {
        return { source: 'fallback', fetchedAt: new Date().toISOString(), data: stale };
      }
      throw new Error(`Odds API unavailable for event: ${eventId}`);
    }
  }

  /**
   * Fetch events that include Haiti as home or away team.
   */
  async getHaitiEvents(
    sportKey: string,
    opts: Pick<OddsQuery, 'regions' | 'markets' | 'ttlSeconds'> = {},
  ): Promise<OddsResponse> {
    const response = await this.getOdds({ sportKey, ...opts });
    const events = (response.data as ExternalEvent[]).filter(
      (ev) =>
        ev.home_team.toLowerCase().includes('haiti') ||
        ev.away_team.toLowerCase().includes('haiti'),
    );
    return { ...response, data: events };
  }

  /**
   * List available sports (cached for 1 hour).
   */
  async getSports(): Promise<OddsResponse> {
    const key = 'odds:v4:sports:list';

    const cached = await readCache<ExternalSport[]>(key);
    if (cached) {
      return { source: 'cache', fetchedAt: new Date().toISOString(), data: cached };
    }

    try {
      const data = await this.fetch<ExternalSport[]>('/sports/', {});
      await writeCache(key, data, 3600);
      await writeCache(staleKey(key), data, 86400);
      return { source: 'api', fetchedAt: new Date().toISOString(), data };
    } catch (err) {
      this.logApiError(err);
      const stale = await readCache<ExternalSport[]>(staleKey(key));
      if (stale) return { source: 'fallback', fetchedAt: new Date().toISOString(), data: stale };
      throw new Error('Odds API unavailable: cannot fetch sports list');
    }
  }

  /**
   * Invalidate the cache for a specific sport (forces next call to hit the API).
   */
  async invalidateCache(sportKey: string): Promise<void> {
    const pattern = `odds:v4:*${sportKey}*`;
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(...keys);
    }
  }

  private logApiError(err: unknown): void {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const msg = err.response?.data?.message ?? err.message;
      console.error(`[OddsAPI] HTTP ${status ?? 'ERR'}: ${msg}`);
    } else {
      console.error('[OddsAPI] Unknown error:', err);
    }
  }
}

export const externalOddsService = new ExternalOddsService();

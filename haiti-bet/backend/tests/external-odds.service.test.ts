import axios from 'axios';
import { ExternalOddsService } from '../src/modules/odds/external-odds.service';

// Mock ioredis and axios
jest.mock('ioredis', () => {
  const store = new Map<string, string>();
  return jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: jest.fn((key: string, val: string) => { store.set(key, val); return Promise.resolve('OK'); }),
    keys: jest.fn(() => Promise.resolve([])),
    del: jest.fn(() => Promise.resolve(1)),
    on: jest.fn(),
    connect: jest.fn(),
  }));
});

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockEvent = {
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
      ],
    },
  ],
};

describe('ExternalOddsService', () => {
  let service: ExternalOddsService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ODDS_API_KEY = 'test_key_123';
    process.env.ODDS_CACHE_TTL_SECONDS = '60';
    process.env.ODDS_STALE_TTL_SECONDS = '600';
    process.env.ODDS_API_TIMEOUT_MS = '5000';
    process.env.REDIS_URL = 'redis://localhost:6379';

    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: [mockEvent],
        headers: { 'x-requests-remaining': '490', 'x-requests-used': '10' },
      }),
      interceptors: {
        response: { use: jest.fn() },
      },
    });

    service = new ExternalOddsService();
  });

  it('calls the API with the correct path and apiKey', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      data: [mockEvent],
      headers: { 'x-requests-remaining': '490' },
    });
    (service as any).http = { get: mockGet };

    await service.getOdds({ sportKey: 'soccer_concacaf_gold_cup' });

    expect(mockGet).toHaveBeenCalledWith(
      '/sports/soccer_concacaf_gold_cup/odds/',
      expect.objectContaining({
        params: expect.objectContaining({ apiKey: 'test_key_123' }),
      }),
    );
  });

  it('never sends the API key in the returned response data', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: [mockEvent], headers: {} });
    (service as any).http = { get: mockGet };

    const result = await service.getOdds({ sportKey: 'soccer_concacaf_gold_cup' });
    const json = JSON.stringify(result);

    expect(json).not.toContain('test_key_123');
  });

  it('filters Haiti events correctly', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      data: [
        mockEvent,
        { ...mockEvent, id: 'ext-002', home_team: 'Mexico', away_team: 'Honduras' },
      ],
      headers: {},
    });
    (service as any).http = { get: mockGet };

    const result = await service.getHaitiEvents('soccer_concacaf_gold_cup');
    expect(result.data).toHaveLength(1);
    expect((result.data[0] as any).home_team).toBe('Haiti');
  });

  it('returns fallback cache when API throws', async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
    (service as any).http = { get: mockGet };

    // Pre-populate stale cache
    const staleKey = expect.stringContaining(':stale');
    (service as any).redis = {
      get: jest.fn((key: string) =>
        key.includes(':stale') ? Promise.resolve(JSON.stringify([mockEvent])) : Promise.resolve(null),
      ),
      set: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn(),
    };

    const result = await service.getOdds({ sportKey: 'soccer_concacaf_gold_cup' });
    expect(result.source).toBe('fallback');
    expect(result.data).toHaveLength(1);
  });

  it('throws when API fails and no stale cache exists', async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
    (service as any).http = { get: mockGet };
    (service as any).redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    };

    await expect(service.getOdds({ sportKey: 'soccer_concacaf_gold_cup' })).rejects.toThrow(
      'Odds API unavailable',
    );
  });
});

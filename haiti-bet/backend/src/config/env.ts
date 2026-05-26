import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OTP_EXPIRES_MINUTES: z.coerce.number().default(5),

  MONCASH_CLIENT_ID: z.string().default('sandbox_client'),
  MONCASH_CLIENT_SECRET: z.string().default('sandbox_secret'),
  MONCASH_BASE_URL: z.string().default('https://sandbox.moncashbutton.digicelgroup.com'),
  MONCASH_REDIRECT_URL: z.string().default('http://localhost:3000/wallet?payment=complete'),

  ADMIN_SECRET: z.string().default('admin_secret_change_me'),

  SMS_PROVIDER: z.enum(['vonage', 'twilio', 'console']).default('console'),
  VONAGE_API_KEY: z.string().optional(),
  VONAGE_API_SECRET: z.string().optional(),
  SMS_FROM: z.string().default('HAITIBET'),

  BOOKMAKER_MARGIN: z.coerce.number().default(0.05),
  SUSPENSION_TIMEOUT_MS: z.coerce.number().default(30000),
  MAX_BET_STAKE: z.coerce.number().default(50000),
  MIN_BET_STAKE: z.coerce.number().default(25),
  MAX_EXPOSURE_PER_MARKET: z.coerce.number().default(500000),

  // External Odds API (the-odds-api.com)
  ODDS_API_KEY: z.string().default(''),
  ODDS_CACHE_TTL_SECONDS: z.coerce.number().default(60),
  ODDS_STALE_TTL_SECONDS: z.coerce.number().default(600),
  ODDS_API_TIMEOUT_MS: z.coerce.number().default(8000),
  ODDS_SYNC_INTERVAL_MS: z.coerce.number().default(60000),
  ODDS_DRIFT_THRESHOLD_PCT: z.coerce.number().default(12),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CASHOUT_MARGIN: z.coerce.number().default(0.05),
  MAX_DAILY_STAKE_PER_USER: z.coerce.number().default(500000),
  MAX_ACTIVE_BETS_PER_USER: z.coerce.number().default(20),
  MAX_BET_RATE_PER_MINUTE: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

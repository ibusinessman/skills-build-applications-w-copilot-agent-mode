import pino from 'pino';
import { env } from '../config/env';

const logger = pino(
  {
    level: env.LOG_LEVEL ?? 'info',
    ...(env.NODE_ENV !== 'production'
      ? {}
      : {
          formatters: {
            level(label) {
              return { level: label };
            },
          },
        }),
  },
  env.NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
);

export default logger;

// ─── Typed structured-log helpers ────────────────────────────────────────────

export interface BetLogData {
  userId: string;
  betId: string;
  stake: number;
  potentialWin: number;
  action: 'placed' | 'settled' | 'cancelled';
  [key: string]: unknown;
}

export interface PaymentLogData {
  userId: string;
  transactionId: string;
  type: string;
  amount: number;
  status: string;
  provider: 'moncash';
  [key: string]: unknown;
}

export interface OddsChangeLogData {
  marketId: string;
  outcomeCode: string;
  fromOdds: number;
  toOdds: number;
  version: number;
  driftPct?: number;
  [key: string]: unknown;
}

export interface RiskLogData {
  userId: string;
  type: 'flag' | 'limit' | 'reject';
  reason: string;
  stake?: number;
  [key: string]: unknown;
}

export interface AuthLogData {
  userId?: string;
  phone: string;
  action: 'register' | 'login' | 'otp_sent' | 'otp_verified' | 'logout';
  [key: string]: unknown;
}

export function logBet(data: BetLogData): void {
  logger.info({ event: 'BET', ...data });
}

export function logPayment(data: PaymentLogData): void {
  logger.info({ event: 'PAYMENT', ...data });
}

export function logOddsChange(data: OddsChangeLogData): void {
  logger.info({ event: 'ODDS_CHANGE', ...data });
}

export function logRisk(data: RiskLogData): void {
  logger.info({ event: 'RISK', ...data });
}

export function logAuth(data: AuthLogData): void {
  logger.info({ event: 'AUTH', ...data });
}

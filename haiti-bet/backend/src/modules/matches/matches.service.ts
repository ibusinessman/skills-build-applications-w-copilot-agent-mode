import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { MatchStatus } from '@prisma/client';

interface CreateMatchInput {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue?: string;
  scheduledAt: Date;
}

interface UpdateLiveInput {
  matchId: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  period?: string;
  status?: MatchStatus;
}

export class MatchesService {
  async list(filters?: { status?: MatchStatus; upcoming?: boolean }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ['SCHEDULED', 'LIVE'] };
    }

    return prisma.match.findMany({
      where,
      include: {
        markets: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            outcomes: {
              include: {
                odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getById(id: string) {
    return prisma.match.findUnique({
      where: { id },
      include: {
        markets: {
          include: {
            outcomes: {
              include: {
                odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
              },
            },
          },
        },
        events: { orderBy: { minute: 'asc' } },
      },
    });
  }

  async create(input: CreateMatchInput) {
    return prisma.match.create({
      data: {
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        competition: input.competition,
        venue: input.venue,
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
      },
    });
  }

  async updateLive(input: UpdateLiveInput) {
    const match = await prisma.match.update({
      where: { id: input.matchId },
      data: {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        minute: input.minute,
        period: input.period,
        status: input.status,
      },
    });

    // Cache live state in Redis for low-latency reads
    await redis.setex(
      KEYS.matchLive(input.matchId),
      300,
      JSON.stringify({
        id: match.id,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        minute: match.minute,
        period: match.period,
        status: match.status,
      }),
    );

    return match;
  }

  async addEvent(matchId: string, event: {
    type: string;
    minute: number;
    team: string;
    player?: string;
    description?: string;
  }) {
    const matchEvent = await prisma.matchEvent.create({
      data: { matchId, ...event },
    });

    // Update score if it's a goal
    if (event.type === 'GOAL') {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (match) {
        const isHome = event.team === match.homeTeam;
        await prisma.match.update({
          where: { id: matchId },
          data: isHome
            ? { homeScore: { increment: 1 } }
            : { awayScore: { increment: 1 } },
        });
      }
    }

    return matchEvent;
  }

  async getLiveState(matchId: string) {
    const cached = await redis.get(KEYS.matchLive(matchId));
    if (cached) return JSON.parse(cached);
    return prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, homeScore: true, awayScore: true, minute: true, period: true, status: true },
    });
  }
}

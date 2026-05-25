import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { externalOddsService } from './external-odds.service';
import { oddsSyncService } from './odds-sync.service';
import { mapExternalEvents, mapExternalEvent } from './odds.mapper';
import { HAITI_SPORT_KEYS } from './odds.types';
import type { ExternalEvent } from './odds.types';

const sportKeySchema = z.enum(HAITI_SPORT_KEYS as unknown as [string, ...string[]]);

export async function externalOddsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/odds/sports
   * Returns all available sports. Public — no key exposed.
   */
  fastify.get('/sports', async (_req, reply) => {
    const result = await externalOddsService.getSports();
    return reply.send({ data: result.data, meta: { source: result.source, fetchedAt: result.fetchedAt } });
  });

  /**
   * GET /api/odds/haiti
   * Returns all upcoming Haiti events across all monitored sport keys.
   */
  fastify.get('/haiti', async (_req, reply) => {
    const allEvents: ExternalEvent[] = [];

    await Promise.allSettled(
      HAITI_SPORT_KEYS.map(async (sportKey) => {
        const result = await externalOddsService.getHaitiEvents(sportKey);
        allEvents.push(...(result.data as ExternalEvent[]));
      }),
    );

    const normalized = mapExternalEvents(allEvents);
    return reply.send({ data: normalized, meta: { count: normalized.length } });
  });

  /**
   * GET /api/odds/sport/:sportKey
   * Returns all events for a sport key (filtered to Haiti if ?haitiOnly=true).
   * Admin only — prevents exposing raw API data to users.
   */
  fastify.get(
    '/sport/:sportKey',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { sportKey } = request.params as { sportKey: string };
      const { haitiOnly } = request.query as { haitiOnly?: string };

      const validated = sportKeySchema.safeParse(sportKey);
      if (!validated.success) {
        return reply.status(400).send({ error: `Unsupported sport key: ${sportKey}` });
      }

      const result =
        haitiOnly === 'true'
          ? await externalOddsService.getHaitiEvents(sportKey)
          : await externalOddsService.getOdds({ sportKey });

      const normalized = mapExternalEvents(result.data as ExternalEvent[]);
      return reply.send({
        data: normalized,
        meta: { source: result.source, fetchedAt: result.fetchedAt, count: normalized.length },
      });
    },
  );

  /**
   * GET /api/odds/event/:sportKey/:eventId
   * Returns odds for a specific external event ID.
   */
  fastify.get(
    '/event/:sportKey/:eventId',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { sportKey, eventId } = request.params as { sportKey: string; eventId: string };
      const result = await externalOddsService.getEventOdds(sportKey, eventId);
      const normalized = result.data ? mapExternalEvent(result.data as ExternalEvent) : null;
      return reply.send({
        data: normalized,
        meta: { source: result.source, fetchedAt: result.fetchedAt },
      });
    },
  );

  /**
   * POST /api/odds/sync
   * Admin: manually trigger an odds sync across all Haiti sport keys.
   */
  fastify.post(
    '/sync',
    { preHandler: [fastify.requireAdmin] },
    async (_req, reply) => {
      const result = await oddsSyncService.syncAll();
      return reply.send({
        message: 'Sync complete',
        data: result,
      });
    },
  );

  /**
   * POST /api/odds/sync/:sportKey
   * Admin: sync a specific sport key.
   */
  fastify.post(
    '/sync/:sportKey',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { sportKey } = request.params as { sportKey: string };
      const result = await oddsSyncService.syncSport(sportKey);
      return reply.send({ message: `Sync complete for ${sportKey}`, data: result });
    },
  );

  /**
   * DELETE /api/odds/cache/:sportKey
   * Admin: bust cache for a sport key to force fresh API call.
   */
  fastify.delete(
    '/cache/:sportKey',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { sportKey } = request.params as { sportKey: string };
      await externalOddsService.invalidateCache(sportKey);
      return reply.send({ message: `Cache invalidated for ${sportKey}` });
    },
  );
}

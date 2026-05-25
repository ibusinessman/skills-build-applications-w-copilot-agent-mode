import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import { ZodError } from 'zod';
import { env } from './config/env';
import { authPlugin } from './middleware/auth.middleware';
import { auditPlugin } from './middleware/audit.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { matchesRoutes } from './modules/matches/matches.routes';
import { marketsRoutes } from './modules/markets/markets.routes';
import { betsRoutes } from './modules/bets/bets.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { liveRoutes } from './modules/live/live.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { registerWsRoutes } from './websocket/ws.server';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
  });

  // Security
  await fastify.register(fastifyHelmet, { contentSecurityPolicy: false });
  await fastify.register(fastifyCors, {
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  });
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  });

  // WebSocket
  await fastify.register(fastifyWebsocket);

  // Auth plugin
  await fastify.register(authPlugin);

  // Audit plugin
  await fastify.register(auditPlugin);

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(matchesRoutes, { prefix: '/api/matches' });
  fastify.register(marketsRoutes, { prefix: '/api/markets' });
  fastify.register(betsRoutes, { prefix: '/api/bets' });
  fastify.register(paymentsRoutes, { prefix: '/api/payments' });
  fastify.register(liveRoutes, { prefix: '/api/live' });
  fastify.register(adminRoutes, { prefix: '/api/admin' });
  fastify.register(notificationsRoutes, { prefix: '/api/notifications' });

  // WebSocket routes
  await registerWsRoutes(fastify);

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation Error',
        issues: error.flatten().fieldErrors,
      });
    }

    const statusCode = error.statusCode ?? 500;
    const message = statusCode < 500 ? error.message : 'Internal server error';

    if (statusCode >= 500) {
      fastify.log.error(error);
    }

    return reply.status(statusCode).send({ error: message });
  });

  return fastify;
}

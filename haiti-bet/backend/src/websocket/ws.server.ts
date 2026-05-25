import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { redis } from '../config/redis';
import { prisma } from '../config/database';

interface LiveUpdate {
  type: 'SCORE' | 'ODDS' | 'MARKET_STATUS' | 'MATCH_EVENT' | 'MATCH_STATUS';
  matchId: string;
  data: any;
}

const matchRooms = new Map<string, Set<WebSocket>>();

export function broadcastToMatch(matchId: string, update: LiveUpdate): void {
  const room = matchRooms.get(matchId);
  if (!room) return;

  const message = JSON.stringify(update);
  room.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export async function registerWsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/ws/match/:matchId', { websocket: true }, async (connection, request) => {
    const { matchId } = request.params as { matchId: string };

    // Join room
    if (!matchRooms.has(matchId)) {
      matchRooms.set(matchId, new Set());
    }
    matchRooms.get(matchId)!.add(connection);

    // Send initial state
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
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
      });

      if (match) {
        connection.send(
          JSON.stringify({ type: 'INITIAL_STATE', matchId, data: match }),
        );
      }
    } catch (err) {
      console.error('[WS] Failed to send initial state:', err);
    }

    connection.on('message', (msg: Buffer) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'PING') {
          connection.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    connection.on('close', () => {
      matchRooms.get(matchId)?.delete(connection);
      if (matchRooms.get(matchId)?.size === 0) {
        matchRooms.delete(matchId);
      }
    });
  });

  // Live subscriptions endpoint
  fastify.get('/ws/live', { websocket: true }, async (connection) => {
    // Broadcast all live match updates to this connection
    const sub = redis.duplicate();
    await sub.subscribe('live:all');

    sub.on('message', (channel, message) => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(message);
      }
    });

    connection.on('close', () => {
      sub.unsubscribe('live:all');
      sub.quit();
    });
  });
}

export function getMatchRoomSize(matchId: string): number {
  return matchRooms.get(matchId)?.size ?? 0;
}

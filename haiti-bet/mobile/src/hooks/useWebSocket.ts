import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = process.env.WS_URL ?? 'ws://localhost:8000';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
}

interface UseWebSocketOptions<T> {
  matchId: string;
  onMessage: (message: WebSocketMessage<T>) => void;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket<T = unknown>({
  matchId,
  onMessage,
  enabled = true,
}: UseWebSocketOptions<T>): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage ref fresh without triggering reconnects
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimer();
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnect on intentional close
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearReconnectTimer]);

  const connect = useCallback(() => {
    if (!isMountedRef.current || !enabled) return;

    disconnect();

    const url = `${WS_BASE}/ws/match/${matchId}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event: WebSocketMessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as WebSocketMessage<T>;
          onMessageRef.current(data);
        } catch {
          // Ignore malformed JSON messages
        }
      };

      ws.onerror = () => {
        // Error will be followed by onclose — handle reconnect there
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (
          isMountedRef.current &&
          enabled &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttemptsRef.current, 5);
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      // WebSocket constructor failure — attempt reconnect
      if (isMountedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY_MS);
      }
    }
  }, [matchId, enabled, disconnect]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [matchId, enabled, connect, disconnect]);

  return { disconnect, reconnect };
}

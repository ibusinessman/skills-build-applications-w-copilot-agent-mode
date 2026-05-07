import { useEffect, useState } from 'react';
import { SystemStatus } from '../types';

export function useSystemIntegrity() {
  const [status, setStatus] = useState<SystemStatus>({
    healthScore: 85,
    timestamp: new Date().toISOString(),
    delta: 0,
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'INTEGRITY_UPDATE') {
          setStatus(msg.data);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      // silently handle connection errors
    };

    return () => {
      ws.close();
    };
  }, []);

  return status;
}

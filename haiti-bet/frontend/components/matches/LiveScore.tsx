'use client';
import { useState, useCallback } from 'react';
import { useMatchWebSocket } from '@/hooks/useWebSocket';

interface LiveState {
  homeScore: number;
  awayScore: number;
  minute: number;
  period: string;
  status: string;
}

interface Props {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  initial: LiveState;
  onOddsUpdate?: (markets: any[]) => void;
  onMarketStatus?: (status: string) => void;
}

export function LiveScore({ matchId, homeTeam, awayTeam, initial, onOddsUpdate, onMarketStatus }: Props) {
  const [state, setState] = useState<LiveState>(initial);
  const [events, setEvents] = useState<any[]>([]);
  const [flash, setFlash] = useState(false);

  const handleMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'SCORE':
        setState((prev) => ({ ...prev, ...msg.data }));
        setFlash(true);
        setTimeout(() => setFlash(false), 2000);
        break;

      case 'MATCH_EVENT':
        setEvents((prev) => [msg.data, ...prev.slice(0, 9)]);
        break;

      case 'MATCH_STATUS':
        setState((prev) => ({ ...prev, ...msg.data }));
        break;

      case 'ODDS':
        onOddsUpdate?.(msg.data);
        break;

      case 'MARKET_STATUS':
        onMarketStatus?.(msg.data.status);
        break;

      case 'INITIAL_STATE':
        if (msg.data) {
          setState((prev) => ({
            ...prev,
            homeScore: msg.data.homeScore ?? prev.homeScore,
            awayScore: msg.data.awayScore ?? prev.awayScore,
            minute: msg.data.minute ?? prev.minute,
            status: msg.data.status ?? prev.status,
          }));
        }
        break;
    }
  }, [onOddsUpdate, onMarketStatus]);

  useMatchWebSocket(matchId, handleMessage);

  const isLive = state.status === 'LIVE';

  return (
    <div className="card text-center">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="live-badge">
            <span className="w-1.5 h-1.5 bg-white rounded-full pulse-live" />
            EN DIRECT — {state.minute}'
          </span>
          <span className="text-xs text-slate-400">{state.period}</span>
        </div>
      )}

      {/* Score */}
      <div className="flex items-center justify-center gap-8 py-4">
        <div className="flex-1 text-right">
          <div className="text-xl font-bold">{homeTeam}</div>
          <div className="text-xs text-slate-400 mt-1">Domicile</div>
        </div>

        <div className={`text-5xl font-black transition-all ${flash ? 'text-haiti-gold scale-110' : 'text-white'}`}>
          {state.homeScore} — {state.awayScore}
        </div>

        <div className="flex-1 text-left">
          <div className="text-xl font-bold">{awayTeam}</div>
          <div className="text-xs text-slate-400 mt-1">Visiteur</div>
        </div>
      </div>

      {/* Recent events */}
      {events.length > 0 && (
        <div className="mt-4 border-t border-bet-border pt-4 space-y-1">
          {events.slice(0, 4).map((ev, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-slate-500 w-8 text-right">{ev.minute}'</span>
              <span>{getEventIcon(ev.type)}</span>
              <span>{ev.player ?? ev.team}</span>
              {ev.type === 'GOAL' && <span className="text-haiti-gold font-bold">⚽</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getEventIcon(type: string) {
  const icons: Record<string, string> = {
    GOAL: '⚽',
    RED_CARD: '🟥',
    YELLOW_CARD: '🟨',
    PENALTY_AWARDED: '🎯',
    VAR_CHECK: '📺',
    SUBSTITUTION: '🔄',
  };
  return icons[type] ?? '•';
}

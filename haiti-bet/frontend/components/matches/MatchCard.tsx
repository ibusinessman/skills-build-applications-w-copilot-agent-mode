'use client';
import Link from 'next/link';
import { clsx } from 'clsx';

interface Outcome {
  id: string;
  name: string;
  code: string;
  odds: Array<{ value: number; version: number }>;
}

interface Market {
  id: string;
  name: string;
  category: string;
  status: string;
  outcomes: Outcome[];
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue?: string;
  scheduledAt: string;
  status: string;
  homeScore: number;
  awayScore: number;
  minute?: number;
  markets: Market[];
}

interface Props {
  match: Match;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-HT', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function MatchCard({ match }: Props) {
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';

  const mainMarket = match.markets?.find((m) => m.category === 'MATCH_RESULT');

  return (
    <Link href={`/matches/${match.id}`}>
      <div className={clsx(
        'card hover:border-haiti-blue transition-all cursor-pointer group',
        isLive && 'border-red-500/50',
      )}>
        {/* Competition + Status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400">{match.competition}</span>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="live-badge">
                <span className="w-1.5 h-1.5 bg-white rounded-full pulse-live" />
                LIVE {match.minute}'
              </span>
            )}
            {isFinished && (
              <span className="text-xs text-slate-500 uppercase">Terminé</span>
            )}
            {!isLive && !isFinished && (
              <span className="text-xs text-slate-400">{formatDate(match.scheduledAt)}</span>
            )}
          </div>
        </div>

        {/* Score / Teams */}
        <div className="flex items-center justify-center gap-4 my-4">
          <div className="flex-1 text-right">
            <div className="font-bold text-lg group-hover:text-haiti-gold transition-colors">
              {match.homeTeam}
            </div>
          </div>

          <div className="text-center px-4">
            {(isLive || isFinished) ? (
              <div className="text-2xl font-black text-white">
                {match.homeScore} — {match.awayScore}
              </div>
            ) : (
              <div className="text-xl text-slate-500 font-bold">VS</div>
            )}
          </div>

          <div className="flex-1 text-left">
            <div className="font-bold text-lg">{match.awayTeam}</div>
          </div>
        </div>

        {/* Odds preview */}
        {mainMarket && mainMarket.status === 'OPEN' && (
          <div className="flex items-center gap-2 mt-3">
            {mainMarket.outcomes.map((outcome) => (
              <div key={outcome.id} className="flex-1 text-center py-2 rounded-lg bg-bet-dark border border-bet-border">
                <div className="text-xs text-slate-400 mb-1">{outcome.name}</div>
                <div className="text-odds">
                  {outcome.odds[0] ? parseFloat(outcome.odds[0].value.toString()).toFixed(2) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {mainMarket?.status === 'SUSPENDED' && (
          <div className="mt-3 text-center">
            <span className="suspended-badge">Marché suspendu</span>
          </div>
        )}
      </div>
    </Link>
  );
}

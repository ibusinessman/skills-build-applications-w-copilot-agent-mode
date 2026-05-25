'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { matchesApi, marketsApi } from '@/lib/api';
import { LiveScore } from '@/components/matches/LiveScore';
import { OddsButton } from '@/components/betting/OddsButton';
import { BetSlip } from '@/components/betting/BetSlip';

const CATEGORY_LABELS: Record<string, string> = {
  MATCH_RESULT: 'Résultat (1X2)',
  GOALS: 'Buts',
  HANDICAP: 'Handicap',
  PLAYER: 'Joueurs',
  LIVE: 'Paris en direct',
  SPECIAL: 'Spéciaux',
};

export default function MatchPage() {
  const { id } = useParams() as { id: string };
  const [match, setMatch] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSuspended, setGlobalSuspended] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [matchRes, marketsRes] = await Promise.all([
          matchesApi.getById(id),
          marketsApi.forMatch(id),
        ]);
        setMatch(matchRes.data);
        setMarkets(marketsRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleOddsUpdate = useCallback((updatedMarkets: any[]) => {
    setMarkets(updatedMarkets);
    setGlobalSuspended(false);
  }, []);

  const handleMarketStatus = useCallback((status: string) => {
    if (status === 'SUSPENDED') setGlobalSuspended(true);
    else setGlobalSuspended(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚽</div>
          <p className="text-slate-400">Chargement du match...</p>
        </div>
      </div>
    );
  }

  if (!match) return <div className="text-center py-12 text-slate-400">Match introuvable</div>;

  const isLive = match.status === 'LIVE';
  const matchName = `${match.homeTeam} vs ${match.awayTeam}`;

  // Group markets by category
  const byCategory: Record<string, any[]> = {};
  for (const m of markets) {
    if (!byCategory[m.category]) byCategory[m.category] = [];
    byCategory[m.category].push(m);
  }

  return (
    <div className="pb-32">
      {/* Match header */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-2">{match.competition} · {match.venue}</p>
        {isLive ? (
          <LiveScore
            matchId={id}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            initial={{
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              minute: match.minute ?? 0,
              period: match.period ?? '',
              status: match.status,
            }}
            onOddsUpdate={handleOddsUpdate}
            onMarketStatus={handleMarketStatus}
          />
        ) : (
          <div className="card text-center">
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="flex-1 text-right">
                <div className="text-xl font-bold">{match.homeTeam}</div>
              </div>
              <div className="text-2xl text-slate-500 font-bold px-4">VS</div>
              <div className="flex-1 text-left">
                <div className="text-xl font-bold">{match.awayTeam}</div>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              {new Date(match.scheduledAt).toLocaleString('fr-HT', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Suspension banner */}
      {globalSuspended && (
        <div className="mb-4 px-4 py-3 bg-yellow-900/50 border border-yellow-600 rounded-lg text-center">
          <span className="suspended-badge mr-2">Marché suspendu</span>
          <span className="text-sm text-yellow-200">Les marchés sont temporairement suspendus. Reprise dans quelques secondes...</span>
        </div>
      )}

      {/* Markets */}
      {Object.entries(byCategory).map(([category, catMarkets]) => (
        <section key={category} className="mb-6">
          <h2 className="text-base font-bold text-slate-200 mb-3">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="space-y-3">
            {catMarkets.map((market) => (
              <div key={market.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{market.name}</span>
                  {market.status === 'SUSPENDED' && (
                    <span className="suspended-badge">Suspendu</span>
                  )}
                  {market.status === 'SETTLED' && (
                    <span className="text-xs text-bet-green font-bold uppercase">Réglé</span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {market.outcomes.map((outcome: any) => (
                    <OddsButton
                      key={outcome.id}
                      marketId={market.id}
                      outcomeId={outcome.id}
                      outcomeName={outcome.name}
                      odds={outcome.odds[0] ? parseFloat(outcome.odds[0].value) : 0}
                      marketName={market.name}
                      matchName={matchName}
                      disabled={market.status !== 'OPEN' || globalSuspended || !outcome.odds[0]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <BetSlip />
    </div>
  );
}

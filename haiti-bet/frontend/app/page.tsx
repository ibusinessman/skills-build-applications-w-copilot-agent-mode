import { matchesApi } from '@/lib/api';
import { MatchCard } from '@/components/matches/MatchCard';
import { BetSlip } from '@/components/betting/BetSlip';

async function getMatches() {
  try {
    const result = await matchesApi.list({ upcoming: true });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const matches = await getMatches();

  const liveMatches = matches.filter((m: any) => m.status === 'LIVE');
  const upcomingMatches = matches.filter((m: any) => m.status !== 'LIVE' && m.status !== 'FINISHED');

  return (
    <div className="pb-32">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-haiti-blue to-blue-900 mb-8 p-6 sm:p-10">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🇭🇹</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Paris sur les Grenadiers
              </h1>
              <p className="text-blue-200 text-sm">
                Pariez sur chaque match de la sélection haïtienne
              </p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 text-9xl opacity-10 -rotate-12 select-none">⚽</div>
      </div>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="live-badge">
              <span className="w-1.5 h-1.5 bg-white rounded-full pulse-live" />
              EN DIRECT
            </span>
            <span className="text-sm text-slate-400">{liveMatches.length} match{liveMatches.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3">
            {liveMatches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming matches */}
      <section>
        <h2 className="text-lg font-bold mb-4 text-slate-200">Prochains matchs</h2>
        {upcomingMatches.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">
            <div className="text-4xl mb-3">📅</div>
            <p>Aucun match programmé pour le moment.</p>
            <p className="text-sm mt-1">Revenez bientôt!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      <BetSlip />
    </div>
  );
}

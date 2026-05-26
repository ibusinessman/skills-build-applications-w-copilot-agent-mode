import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { matchApi, Match, Market } from '@/lib/api';
import { OddsButton } from '@/components/OddsButton';
import { LiveScore } from '@/components/LiveScore';
import { BetSlip } from '@/components/BetSlip';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';
import { colors } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Match'>;

interface LiveUpdatePayload {
  homeScore?: number;
  awayScore?: number;
  status?: Match['status'];
  markets?: Market[];
}

// Categories shown first in order
const CATEGORY_ORDER = ['1X2', 'Buts', 'Handicap', 'Mi-temps', 'Les deux équipes marquent'];

function sortMarkets(markets: Market[]): { category: string; markets: Market[] }[] {
  const grouped = new Map<string, Market[]>();
  for (const market of markets) {
    const existing = grouped.get(market.category) ?? [];
    grouped.set(market.category, [...existing, market]);
  }

  const ordered: { category: string; markets: Market[] }[] = [];
  for (const cat of CATEGORY_ORDER) {
    if (grouped.has(cat)) {
      ordered.push({ category: cat, markets: grouped.get(cat)! });
      grouped.delete(cat);
    }
  }
  for (const [cat, mkts] of grouped) {
    ordered.push({ category: cat, markets: mkts });
  }
  return ordered;
}

export default function MatchScreen({ route }: Props): React.JSX.Element {
  const { matchId } = route.params;
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      setError(null);
      const response = await matchApi.getMatch(matchId);
      setMatch(response.data);
    } catch {
      setError('Nou pa ka chaje detay mis la. Eseye ankò.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const handleWsMessage = useCallback(
    (message: WebSocketMessage<LiveUpdatePayload>) => {
      if (message.type === 'score_update' || message.type === 'match_update') {
        setMatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            homeScore: message.payload.homeScore ?? prev.homeScore,
            awayScore: message.payload.awayScore ?? prev.awayScore,
            status: message.payload.status ?? prev.status,
            markets: message.payload.markets ?? prev.markets,
          };
        });
      }
    },
    [],
  );

  useWebSocket<LiveUpdatePayload>({
    matchId,
    onMessage: handleWsMessage,
    enabled: match?.status === 'live',
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.haitiGold} />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Mis pa jwenn.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchMatch}>
          <Text style={styles.retryText}>Eseye ankò</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLive = match.status === 'live';
  const groupedMarkets = sortMarkets(match.markets ?? []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Match header */}
        <View style={styles.header}>
          <Text style={styles.league}>{match.league}</Text>

          {isLive && match.homeScore !== null && match.awayScore !== null ? (
            <LiveScore
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
            />
          ) : (
            <View style={styles.teamsRow}>
              <Text style={styles.teamName}>{match.homeTeam}</Text>
              <View style={styles.vsBox}>
                {isLive ? (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                ) : (
                  <Text style={styles.vsText}>VS</Text>
                )}
              </View>
              <Text style={styles.teamName}>{match.awayTeam}</Text>
            </View>
          )}

          {!isLive && (
            <Text style={styles.startTime}>
              {new Date(match.startTime).toLocaleString('fr-HT', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>

        {/* Markets */}
        {groupedMarkets.length === 0 ? (
          <View style={styles.noMarkets}>
            <Text style={styles.noMarketsText}>Pa gen mache disponib.</Text>
          </View>
        ) : (
          groupedMarkets.map(({ category, markets }) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {markets.map((market) => (
                <View key={market.id} style={styles.marketBlock}>
                  <Text style={styles.marketName}>{market.name}</Text>
                  <View style={styles.oddsGrid}>
                    {market.outcomes.map((outcome) => (
                      <OddsButton
                        key={outcome.id}
                        outcome={outcome}
                        match={match}
                        marketName={market.name}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <BetSlip />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    backgroundColor: colors.haitiBlue,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  league: {
    color: colors.haitiGold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  teamName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  vsBox: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  liveBadge: {
    backgroundColor: colors.haitiRed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  startTime: {
    color: colors.textMuted,
    fontSize: 13,
  },
  categorySection: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  categoryTitle: {
    color: colors.haitiGold,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.haitiGold,
    paddingVertical: 2,
  },
  marketBlock: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketName: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  oddsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noMarkets: {
    padding: 32,
    alignItems: 'center',
  },
  noMarketsText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  bottomPadding: {
    height: 100,
  },
  errorText: {
    color: colors.haitiRed,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.haitiBlue,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

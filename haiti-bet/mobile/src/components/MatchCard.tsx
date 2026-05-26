import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Match } from '@/lib/api';
import { colors } from '@/theme/colors';

interface MatchCardProps {
  match: Match;
  onPress: () => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-HT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-HT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export const MatchCard = memo(function MatchCard({
  match,
  onPress,
}: MatchCardProps): React.JSX.Element {
  const isLive = match.status === 'live';

  // Get 1X2 market for odds preview
  const mainMarket = match.markets?.find(
    (m) => m.category === '1X2' || m.name.toLowerCase().includes('résultat'),
  );

  const outcomes = mainMarket?.outcomes ?? [];
  const homeOdds = outcomes[0];
  const drawOdds = outcomes[1];
  const awayOdds = outcomes[2];

  return (
    <TouchableOpacity
      style={[styles.card, isLive && styles.cardLive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* League + live badge row */}
      <View style={styles.topRow}>
        <Text style={styles.league} numberOfLines={1}>
          {match.league}
        </Text>
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        ) : (
          <Text style={styles.matchTime}>
            {formatDate(match.startTime)} · {formatTime(match.startTime)}
          </Text>
        )}
      </View>

      {/* Teams + score */}
      <View style={styles.teamsRow}>
        <Text style={styles.teamName} numberOfLines={1}>
          {match.homeTeam}
        </Text>

        {isLive && match.homeScore !== null && match.awayScore !== null ? (
          <View style={styles.scoreBox}>
            <Text style={styles.score}>
              {match.homeScore}
              <Text style={styles.scoreSep}> – </Text>
              {match.awayScore}
            </Text>
          </View>
        ) : (
          <View style={styles.vsBox}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        )}

        <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
          {match.awayTeam}
        </Text>
      </View>

      {/* Odds preview */}
      {(homeOdds || drawOdds || awayOdds) && (
        <View style={styles.oddsRow}>
          {homeOdds && (
            <View style={styles.oddsChip}>
              <Text style={styles.oddsLabel}>1</Text>
              <Text style={styles.oddsValue}>{homeOdds.odds.toFixed(2)}</Text>
            </View>
          )}
          {drawOdds && (
            <View style={styles.oddsChip}>
              <Text style={styles.oddsLabel}>X</Text>
              <Text style={styles.oddsValue}>{drawOdds.odds.toFixed(2)}</Text>
            </View>
          )}
          {awayOdds && (
            <View style={styles.oddsChip}>
              <Text style={styles.oddsLabel}>2</Text>
              <Text style={styles.oddsValue}>{awayOdds.odds.toFixed(2)}</Text>
            </View>
          )}
          <Text style={styles.moreMarkets}>
            {(match.markets?.length ?? 0) > 1
              ? `+${(match.markets?.length ?? 1) - 1} mache`
              : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardLive: {
    borderColor: colors.haitiRed + '66',
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  league: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.haitiRed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  liveBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  matchTime: {
    color: colors.textMuted,
    fontSize: 11,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  scoreBox: {
    paddingHorizontal: 14,
  },
  score: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  scoreSep: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  vsBox: {
    paddingHorizontal: 14,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oddsChip: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  oddsLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  oddsValue: {
    color: colors.haitiGold,
    fontSize: 14,
    fontWeight: '700',
  },
  moreMarkets: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    minWidth: 56,
    textAlign: 'right',
  },
});

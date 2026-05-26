import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import { betApi, Bet } from '@/lib/api';
import { colors } from '@/theme/colors';

type FilterStatus = 'all' | 'pending' | 'won' | 'lost';

const TABS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'pending', label: 'An kous' },
  { key: 'won', label: 'Genyen' },
  { key: 'lost', label: 'Pèdi' },
];

const STATUS_COLORS: Record<Bet['status'], string> = {
  pending: colors.yellow,
  won: colors.green,
  lost: colors.haitiRed,
  cancelled: colors.textMuted,
};

const STATUS_LABELS: Record<Bet['status'], string> = {
  pending: 'An kous',
  won: 'Genyen',
  lost: 'Pèdi',
  cancelled: 'Anile',
};

function BetCard({ bet }: { bet: Bet }): React.JSX.Element {
  const statusColor = STATUS_COLORS[bet.status];
  const statusLabel = STATUS_LABELS[bet.status];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>
          {new Date(bet.placedAt).toLocaleDateString('fr-HT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {bet.selections.map((sel, idx) => (
        <View key={idx} style={styles.selection}>
          <Text style={styles.selectionMatch}>
            {sel.homeTeam} vs {sel.awayTeam}
          </Text>
          <View style={styles.selectionRow}>
            <Text style={styles.selectionOutcome}>{sel.outcomeName}</Text>
            <View style={styles.oddsChip}>
              <Text style={styles.oddsText}>{sel.odds.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Mise</Text>
          <Text style={styles.footerValue}>{bet.stake.toLocaleString()} HTG</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Gain potansyèl</Text>
          <Text style={[styles.footerValue, { color: colors.green }]}>
            {bet.potentialWin.toLocaleString()} HTG
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function BetsScreen(): React.JSX.Element {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterStatus>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchBets = useCallback(async () => {
    try {
      setError(null);
      const response = await betApi.getBets();
      setBets(response.data);
    } catch {
      setError('Nou pa ka chaje pari yo. Eseye ankò.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBets();
  }, [fetchBets]);

  const filteredBets = bets.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'won') return b.status === 'won';
    if (activeTab === 'lost') return b.status === 'lost';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.haitiGold} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchBets}>
            <Text style={styles.retryText}>Eseye ankò</Text>
          </TouchableOpacity>
        </View>
      ) : filteredBets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyTitle}>Pa gen pari</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'all'
              ? 'Ou pa janm fè pari toujou.'
              : `Pa gen pari "${TABS.find((t) => t.key === activeTab)?.label ?? ''}" yo.`}
          </Text>
        </View>
      ) : (
        <FlatList<Bet>
          data={filteredBets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.haitiGold}
              colors={[colors.haitiGold]}
            />
          }
          renderItem={({ item }) => <BetCard bet={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 2,
  },
  tabActive: {
    borderBottomColor: colors.haitiGold,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.haitiGold,
  },
  list: {
    padding: 12,
    gap: 10,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  selection: {
    marginBottom: 8,
  },
  selectionMatch: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 3,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionOutcome: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  oddsChip: {
    backgroundColor: colors.haitiBlue + '44',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.haitiBlue,
  },
  oddsText: {
    color: colors.haitiGold,
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    gap: 2,
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  footerValue: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
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

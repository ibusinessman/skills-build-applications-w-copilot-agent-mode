import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { matchApi, Match } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { BetSlip } from '@/components/BetSlip';
import { colors } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeNavProp>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const response = await matchApi.getMatches(true);
      // Sort: live first, then upcoming
      const sorted = [...response.data].sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (a.status !== 'live' && b.status === 'live') return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
      setMatches(sorted);
    } catch {
      setError('Nou pa ka chaje mis yo. Eseye ankò.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const handleMatchPress = useCallback(
    (matchId: string) => {
      navigation.navigate('Match', { matchId });
    },
    [navigation],
  );

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status !== 'live');

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.haitiGold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchMatches}>
          <Text style={styles.retryText}>Eseye ankò</Text>
        </TouchableOpacity>
      </View>
    );
  }

  type ListItem =
    | { type: 'section'; label: string; key: string }
    | { type: 'match'; match: Match; key: string };

  const listData: ListItem[] = [];

  if (liveMatches.length > 0) {
    listData.push({ type: 'section', label: '🔴 An dirèk', key: 'sec-live' });
    liveMatches.forEach((m) =>
      listData.push({ type: 'match', match: m, key: m.id }),
    );
  }

  if (upcomingMatches.length > 0) {
    listData.push({
      type: 'section',
      label: '📅 Prochènman',
      key: 'sec-upcoming',
    });
    upcomingMatches.forEach((m) =>
      listData.push({ type: 'match', match: m, key: m.id }),
    );
  }

  if (listData.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Pa gen mis disponib pou kounye a.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList<ListItem>
        data={listData}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.haitiGold}
            colors={[colors.haitiGold]}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{item.label}</Text>
              </View>
            );
          }
          return (
            <MatchCard
              match={item.match}
              onPress={() => handleMatchPress(item.match.id)}
            />
          );
        }}
      />
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
  list: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});

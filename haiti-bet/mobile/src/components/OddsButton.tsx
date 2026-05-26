import React, { memo, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Vibration,
} from 'react-native';

import { Outcome, Match } from '@/lib/api';
import { useBetSlipStore } from '@/store/betSlip.store';
import { colors } from '@/theme/colors';

interface OddsButtonProps {
  outcome: Outcome;
  match: Match;
  marketName: string;
  style?: ViewStyle;
}

export const OddsButton = memo(function OddsButton({
  outcome,
  match,
  marketName,
  style,
}: OddsButtonProps): React.JSX.Element {
  const toggleSelection = useBetSlipStore((s) => s.toggleSelection);
  const hasSelection = useBetSlipStore((s) => s.hasSelection);

  const isSelected = hasSelection(outcome.id);

  const handlePress = useCallback(() => {
    Vibration.vibrate(30);
    toggleSelection({
      outcomeId: outcome.id,
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      outcomeName: outcome.name,
      marketName,
      odds: outcome.odds,
    });
  }, [toggleSelection, outcome, match, marketName]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSelected && styles.buttonSelected,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Text
        style={[styles.outcomeName, isSelected && styles.outcomeNameSelected]}
        numberOfLines={1}
      >
        {outcome.name}
      </Text>
      <Text style={[styles.odds, isSelected && styles.oddsSelected]}>
        {outcome.odds.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 80,
    backgroundColor: colors.dark,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
  },
  buttonSelected: {
    backgroundColor: colors.haitiBlue,
    borderColor: colors.haitiGold,
    borderWidth: 2,
  },
  outcomeName: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  outcomeNameSelected: {
    color: colors.white,
  },
  odds: {
    color: colors.haitiGold,
    fontSize: 16,
    fontWeight: '800',
  },
  oddsSelected: {
    color: colors.haitiGold,
  },
});

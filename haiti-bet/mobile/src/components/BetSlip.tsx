import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { useBetSlipStore, SlipSelection } from '@/store/betSlip.store';
import { betApi } from '@/lib/api';
import { colors } from '@/theme/colors';

const SLIP_HEIGHT = 420;

function SelectionRow({
  selection,
  onRemove,
}: {
  selection: SlipSelection;
  onRemove: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.selectionRow}>
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionMatch} numberOfLines={1}>
          {selection.homeTeam} vs {selection.awayTeam}
        </Text>
        <Text style={styles.selectionMarket} numberOfLines={1}>
          {selection.marketName}
        </Text>
        <Text style={styles.selectionOutcome} numberOfLines={1}>
          {selection.outcomeName}
        </Text>
      </View>
      <View style={styles.selectionRight}>
        <Text style={styles.selectionOdds}>{selection.odds.toFixed(2)}</Text>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BetSlip(): React.JSX.Element {
  const selections = useBetSlipStore((s) => s.selections);
  const stake = useBetSlipStore((s) => s.stake);
  const isOpen = useBetSlipStore((s) => s.isOpen);
  const potentialWin = useBetSlipStore((s) => s.potentialWin);
  const totalOdds = useBetSlipStore((s) => s.totalOdds);
  const removeSelection = useBetSlipStore((s) => s.removeSelection);
  const setStake = useBetSlipStore((s) => s.setStake);
  const clearSlip = useBetSlipStore((s) => s.clearSlip);
  const openSlip = useBetSlipStore((s) => s.openSlip);
  const closeSlip = useBetSlipStore((s) => s.closeSlip);

  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(slideAnim, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }).start();
    },
    [slideAnim],
  );

  const handleToggle = useCallback(() => {
    if (isOpen) {
      animateTo(0);
      closeSlip();
    } else {
      animateTo(-SLIP_HEIGHT);
      openSlip();
    }
  }, [isOpen, animateTo, closeSlip, openSlip]);

  const handleStakeChange = useCallback(
    (text: string) => {
      const val = parseInt(text, 10);
      setStake(isNaN(val) ? 0 : val);
    },
    [setStake],
  );

  const handlePlaceBet = useCallback(async () => {
    if (stake < 50) {
      Toast.show({
        type: 'error',
        text1: 'Mise minimòm',
        text2: 'Mise minimòm se 50 HTG.',
      });
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      await betApi.placeBet(
        selections.map((s) => ({ outcomeId: s.outcomeId, odds: s.odds })),
        stake,
      );
      Toast.show({
        type: 'success',
        text1: 'Pari fèt! 🏆',
        text2: `Genyen potansyèl: ${potentialWin().toLocaleString()} HTG`,
      });
      clearSlip();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Pari echwe',
        text2: 'Yon erè pase. Verifyé balans ou.',
      });
    } finally {
      setLoading(false);
    }
  }, [stake, selections, potentialWin, clearSlip]);

  if (selections.length === 0) return <></>;

  const translateY = slideAnim.interpolate({
    inputRange: [-SLIP_HEIGHT, 0],
    outputRange: [-SLIP_HEIGHT, 0],
    extrapolate: 'clamp',
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleToggle}
          activeOpacity={1}
        />
      )}

      {/* Slip container */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Handle / tab */}
        <TouchableOpacity
          style={styles.handle}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <View style={styles.handleBar} />
          <View style={styles.handleContent}>
            <Text style={styles.handleTitle}>
              Kupon pari ({selections.length})
            </Text>
            <View style={styles.handleRight}>
              <Text style={styles.totalOdds}>
                Cote: {totalOdds().toFixed(2)}
              </Text>
              <Text style={styles.handleChevron}>
                {isOpen ? '▼' : '▲'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Body — only visible when open */}
        {isOpen && (
          <View style={styles.body}>
            <ScrollView
              style={styles.selectionsList}
              showsVerticalScrollIndicator={false}
            >
              {selections.map((sel) => (
                <SelectionRow
                  key={sel.outcomeId}
                  selection={sel}
                  onRemove={() => removeSelection(sel.outcomeId)}
                />
              ))}
            </ScrollView>

            {/* Stake input */}
            <View style={styles.stakeRow}>
              <Text style={styles.stakeLabel}>Mise (HTG)</Text>
              <TextInput
                style={styles.stakeInput}
                value={stake > 0 ? String(stake) : ''}
                onChangeText={handleStakeChange}
                keyboardType="numeric"
                placeholder="Antre montan"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Potential win */}
            <View style={styles.winRow}>
              <Text style={styles.winLabel}>Gain potansyèl</Text>
              <Text style={styles.winAmount}>
                {potentialWin().toLocaleString()} HTG
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  clearSlip();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearText}>Efase tout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.placeBtn,
                  (loading || stake < 50) && styles.btnDisabled,
                ]}
                onPress={handlePlaceBet}
                disabled={loading || stake < 50}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.dark} />
                ) : (
                  <Text style={styles.placeText}>Placer le pari</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 90,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  handleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handleTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  handleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalOdds: {
    color: colors.haitiGold,
    fontSize: 14,
    fontWeight: '700',
  },
  handleChevron: {
    color: colors.textMuted,
    fontSize: 12,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  selectionsList: {
    maxHeight: 160,
    marginBottom: 12,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  selectionInfo: {
    flex: 1,
    gap: 2,
  },
  selectionMatch: {
    color: colors.textMuted,
    fontSize: 11,
  },
  selectionMarket: {
    color: colors.textMuted,
    fontSize: 11,
  },
  selectionOutcome: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  selectionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  selectionOdds: {
    color: colors.haitiGold,
    fontSize: 16,
    fontWeight: '800',
  },
  removeIcon: {
    color: colors.textMuted,
    fontSize: 14,
  },
  stakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  stakeLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 80,
  },
  stakeInput: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'right',
  },
  winRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.green + '1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.green + '44',
  },
  winLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  winAmount: {
    color: colors.green,
    fontSize: 18,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  clearText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  placeBtn: {
    flex: 2,
    backgroundColor: colors.haitiGold,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  placeText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: '800',
  },
});

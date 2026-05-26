import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';

import { walletApi, WalletData, Transaction } from '@/lib/api';
import { colors } from '@/theme/colors';

const TRANSACTION_ICONS: Record<Transaction['type'], string> = {
  deposit: '⬇️',
  withdrawal: '⬆️',
  bet: '🎫',
  win: '🏆',
};

const TRANSACTION_LABELS: Record<Transaction['type'], string> = {
  deposit: 'Depo',
  withdrawal: 'Retrè',
  bet: 'Pari',
  win: 'Genyen',
};

function TransactionRow({ tx }: { tx: Transaction }): React.JSX.Element {
  const isCredit = tx.type === 'deposit' || tx.type === 'win';
  return (
    <View style={styles.txRow}>
      <View style={styles.txIconWrap}>
        <Text style={styles.txIcon}>{TRANSACTION_ICONS[tx.type]}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{tx.description}</Text>
        <Text style={styles.txDate}>
          {new Date(tx.createdAt).toLocaleDateString('fr-HT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
      <View style={styles.txAmountWrap}>
        <Text style={styles.txType}>{TRANSACTION_LABELS[tx.type]}</Text>
        <Text
          style={[
            styles.txAmount,
            { color: isCredit ? colors.green : colors.haitiRed },
          ]}
        >
          {isCredit ? '+' : '-'}
          {Math.abs(tx.amount).toLocaleString()} HTG
        </Text>
      </View>
    </View>
  );
}

function DepositModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}): React.JSX.Element {
  const [amountText, setAmountText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const amount = parseInt(amountText, 10);
    if (!amount || amount < 100) {
      Alert.alert('Erè', 'Antre yon montan valid (minimòm 100 HTG).');
      return;
    }
    setLoading(true);
    try {
      onConfirm(amount);
    } finally {
      setLoading(false);
      setAmountText('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Depoze lajan</Text>
          <Text style={styles.modalSubtitle}>
            Antre montan ou vle depoze nan kont ou a. Ou pral redirijé sou
            MonCash.
          </Text>

          <TextInput
            style={styles.amountInput}
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="numeric"
            placeholder="Montan (HTG)"
            placeholderTextColor={colors.textMuted}
            maxLength={8}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>Anile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirm, loading && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.modalConfirmText}>Ale sou MonCash</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function WalletScreen(): React.JSX.Element {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositVisible, setDepositVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setError(null);
      const response = await walletApi.getWallet();
      setWallet(response.data);
    } catch {
      setError('Nou pa ka chaje kont ou. Eseye ankò.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWallet();
  }, [fetchWallet]);

  const handleDeposit = useCallback(async (amount: number) => {
    setDepositVisible(false);
    try {
      const response = await walletApi.getMonCashUrl(amount);
      const url = response.data.url;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erè', 'Nou pa ka ouvri lyen MonCash la.');
      }
    } catch {
      Alert.alert('Erè', 'Yon erè pase. Tanpri eseye ankò.');
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.haitiGold} />
      </View>
    );
  }

  if (error || !wallet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Erè enkoni.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchWallet}>
          <Text style={styles.retryText}>Eseye ankò</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balans ou</Text>
        <Text style={styles.balanceAmount}>
          {wallet.balance.toLocaleString()} HTG
        </Text>
        <TouchableOpacity
          style={styles.depositBtn}
          onPress={() => setDepositVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.depositBtnText}>+ Depoze lajan</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      <View style={styles.txSection}>
        <Text style={styles.sectionTitle}>Istwa tranzaksyon</Text>
      </View>

      {wallet.transactions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Pa gen tranzaksyon toujou.</Text>
        </View>
      ) : (
        <FlatList<Transaction>
          data={wallet.transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.txList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.haitiGold}
              colors={[colors.haitiGold]}
            />
          }
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
          renderItem={({ item }) => <TransactionRow tx={item} />}
        />
      )}

      <DepositModal
        visible={depositVisible}
        onClose={() => setDepositVisible(false)}
        onConfirm={handleDeposit}
      />
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  balanceCard: {
    backgroundColor: colors.haitiBlue,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceLabel: {
    color: colors.haitiGold,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  depositBtn: {
    marginTop: 8,
    backgroundColor: colors.haitiGold,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
  },
  depositBtnText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: '800',
  },
  txSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  txList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  txAmountWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txType: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyText: {
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  amountInput: {
    backgroundColor: colors.dark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: colors.border,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  modalConfirm: {
    flex: 2,
    backgroundColor: colors.haitiGold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: colors.dark,
    fontWeight: '800',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

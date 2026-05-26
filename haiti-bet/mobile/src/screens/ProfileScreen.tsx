import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useAuthStore } from '@/store/auth.store';
import { useBetSlipStore } from '@/store/betSlip.store';
import { colors } from '@/theme/colors';

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const clearSlip = useBetSlipStore((s) => s.clearSlip);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Dekonekte',
      'Ou sèten ou vle dekonekte?',
      [
        { text: 'Anile', style: 'cancel' },
        {
          text: 'Dekonekte',
          style: 'destructive',
          onPress: () => {
            clearSlip();
            logout();
          },
        },
      ],
      { cancelable: true },
    );
  }, [logout, clearSlip]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erè: itilizatè pa jwenn.</Text>
      </View>
    );
  }

  // Compute avatar initials from name
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={styles.container}>
      {/* Avatar + name */}
      <View style={styles.heroSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
      </View>

      {/* Account info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enfòmasyon kont</Text>
        <View style={styles.card}>
          <InfoRow label="Non konplè" value={user.name} />
          <View style={styles.rowDivider} />
          <InfoRow label="Nimewo telefòn" value={user.phone} />
          <View style={styles.rowDivider} />
          <InfoRow label="ID itilizatè" value={`#${user.id.slice(-8).toUpperCase()}`} />
        </View>
      </View>

      {/* Settings section (placeholder for future items) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramèt</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Text style={styles.settingsRowText}>🌐 Lang</Text>
            <Text style={styles.settingsRowValue}>Kreyòl</Text>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Text style={styles.settingsRowText}>🔔 Notifikasyon</Text>
            <Text style={styles.settingsRowValue}>Aktif</Text>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Text style={styles.settingsRowText}>🔒 Chanje modpas</Text>
            <Text style={styles.settingsRowChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>🚪 Dekonekte</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>HaitiBet v1.0.0</Text>
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
  },
  heroSection: {
    backgroundColor: colors.haitiBlue,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.haitiGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  userPhone: {
    color: colors.haitiGold,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  settingsRowText: {
    color: colors.white,
    fontSize: 14,
  },
  settingsRowValue: {
    color: colors.textMuted,
    fontSize: 13,
  },
  settingsRowChevron: {
    color: colors.textMuted,
    fontSize: 20,
    lineHeight: 22,
  },
  logoutSection: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  logoutBtn: {
    backgroundColor: colors.haitiRed + '22',
    borderWidth: 1,
    borderColor: colors.haitiRed,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.haitiRed,
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 24,
  },
  errorText: {
    color: colors.haitiRed,
    fontSize: 15,
  },
});

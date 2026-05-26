import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { authApi } from '@/lib/api';
import { colors } from '@/theme/colors';
import type { AuthStackParamList } from '@/navigation/AppNavigator';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen(): React.JSX.Element {
  const navigation = useNavigation<RegisterNavProp>();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password || !confirm) {
      Toast.show({
        type: 'error',
        text1: 'Jaden obligatwa',
        text2: 'Tanpri ranpli tout jaden yo.',
      });
      return;
    }

    if (password !== confirm) {
      Toast.show({
        type: 'error',
        text1: 'Modpas diferan',
        text2: 'De modpas yo pa menm.',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Modpas twò kout',
        text2: 'Modpas dwe gen omwen 6 karaktè.',
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.register(name.trim(), phone.trim(), password);
      Toast.show({
        type: 'success',
        text1: 'Kont kreye!',
        text2: 'Antre kòd OTP nou voye ba ou.',
      });
      navigation.navigate('OtpVerify', { phone: phone.trim() });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erè enrejistreman',
        text2: 'Nimewo sa a ka déjà itilize.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Kreye kont ou</Text>
        <Text style={styles.subtitle}>
          Antre enfòmasyon ou pou kòmanse parye.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Non konplè</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Antre non ou"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nimewo telefòn</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+509 XXXX XXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modpas</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Omwen 6 karaktè"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="next"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfime modpas</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repete modpas ou"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.dark} />
            ) : (
              <Text style={styles.submitText}>Kreye kont</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              Déjà gen kont?{' '}
              <Text style={styles.loginLinkBold}>Konekte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.dark,
    padding: 24,
    paddingTop: 16,
    gap: 24,
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -16,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.white,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  eyeIcon: {
    fontSize: 18,
  },
  submitBtn: {
    backgroundColor: colors.haitiGold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  loginLinkBold: {
    color: colors.haitiGold,
    fontWeight: '700',
  },
});

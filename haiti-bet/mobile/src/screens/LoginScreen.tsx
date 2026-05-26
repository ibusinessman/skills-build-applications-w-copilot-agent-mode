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
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme/colors';
import type { AuthStackParamList } from '@/navigation/AppNavigator';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen(): React.JSX.Element {
  const navigation = useNavigation<LoginNavProp>();
  const login = useAuthStore((s) => s.login);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Jaden obligatwa',
        text2: 'Tanpri ranpli nimewo telefòn ak modpas ou.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login(phone.trim(), password);
      login(response.data.token, response.data.user);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erè koneksyon',
        text2: 'Nimewo oswa modpas pa kòrèk.',
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
        {/* Logo / brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>HB</Text>
          </View>
          <Text style={styles.brandName}>HaitiBet</Text>
          <Text style={styles.tagline}>Jwe entèlijan, genyen plis</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Konekte</Text>

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
                placeholder="Antre modpas ou"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.dark} />
            ) : (
              <Text style={styles.submitText}>Konekte</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              Pa gen kont?{' '}
              <Text style={styles.registerLinkBold}>Kreye youn</Text>
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
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.haitiBlue,
    borderWidth: 3,
    borderColor: colors.haitiGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    color: colors.haitiGold,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandName: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  formTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
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
  registerLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerLinkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  registerLinkBold: {
    color: colors.haitiGold,
    fontWeight: '700',
  },
});

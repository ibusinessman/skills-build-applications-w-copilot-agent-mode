import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme/colors';
import type { AuthStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

const OTP_LENGTH = 6;

export default function OtpVerifyScreen({ route }: Props): React.JSX.Element {
  const { phone } = route.params;
  const login = useAuthStore((s) => s.login);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      Toast.show({
        type: 'error',
        text1: 'Kòd enkompè',
        text2: `Antre kòd ${OTP_LENGTH} chif la.`,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyOtp(phone, otp);
      login(response.data.token, response.data.user);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Kòd pa valid',
        text2: 'Kòd ou antre a pa kòrèk oswa ekspire.',
      });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // Visual OTP boxes
  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? '');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Verifye nimewo ou</Text>
        <Text style={styles.subtitle}>
          Nou voye yon kòd 6 chif sou{'\n'}
          <Text style={styles.phoneHighlight}>{phone}</Text>
        </Text>

        {/* OTP boxes (tap to focus hidden input) */}
        <TouchableOpacity
          style={styles.otpRow}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {boxes.map((digit, idx) => (
            <View
              key={idx}
              style={[
                styles.otpBox,
                otp.length === idx && styles.otpBoxActive,
                digit !== '' && styles.otpBoxFilled,
              ]}
            >
              <Text style={styles.otpDigit}>{digit}</Text>
            </View>
          ))}
        </TouchableOpacity>

        {/* Hidden real input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, OTP_LENGTH))}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.submitBtn, (loading || otp.length < OTP_LENGTH) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length < OTP_LENGTH}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.dark} />
          ) : (
            <Text style={styles.submitText}>Verifye</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.resendNote}>
          Pa resevwa kòd la?{' '}
          <Text style={styles.resendLink}>Voye ankò</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    padding: 24,
    paddingTop: 32,
    gap: 24,
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: {
    color: colors.haitiGold,
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: colors.haitiGold,
  },
  otpBoxFilled: {
    borderColor: colors.haitiBlue,
    backgroundColor: colors.haitiBlue + '33',
  },
  otpDigit: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  submitBtn: {
    backgroundColor: colors.haitiGold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  resendNote: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  resendLink: {
    color: colors.haitiGold,
    fontWeight: '700',
  },
});

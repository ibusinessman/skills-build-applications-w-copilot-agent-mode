import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '@/store/auth.store';
import { TabNavigator } from '@/navigation/TabNavigator';
import { colors } from '@/theme/colors';

// ─── Screen imports (auth flow) ───────────────────────────────────────────────
// These are lightweight screens defined inline here so the auth stack remains
// self-contained. Full implementations live in src/screens/.
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import OtpVerifyScreen from '@/screens/OtpVerifyScreen';
import MatchScreen from '@/screens/MatchScreen';

// ─── Route param types ────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerify: { phone: string };
};

export type RootStackParamList = {
  MainTabs: undefined;
  Match: { matchId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator(): React.JSX.Element {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.white,
        headerTitleStyle: { color: colors.white },
        contentStyle: { backgroundColor: colors.dark },
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Kreye kont' }}
      />
      <AuthStack.Screen
        name="OtpVerify"
        component={OtpVerifyScreen}
        options={{ title: 'Verifye kòd' }}
      />
    </AuthStack.Navigator>
  );
}

function MainNavigator(): React.JSX.Element {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.white,
        headerTitleStyle: { color: colors.white, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.dark },
      }}
    >
      <RootStack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Match"
        component={MatchScreen}
        options={{ title: 'Detay match' }}
      />
    </RootStack.Navigator>
  );
}

export function AppNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}

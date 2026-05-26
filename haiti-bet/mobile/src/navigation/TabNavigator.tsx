import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '@/screens/HomeScreen';
import BetsScreen from '@/screens/BetsScreen';
import WalletScreen from '@/screens/WalletScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { colors } from '@/theme/colors';
import { useBetSlipStore } from '@/store/betSlip.store';

export type TabParamList = {
  Matchs: undefined;
  Paris: undefined;
  Kont: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Simple icon components (replace with vector icons in production)
function TabIcon({
  icon,
  focused,
}: {
  icon: string;
  focused: boolean;
}): React.JSX.Element {
  return (
    <Text style={[styles.iconText, focused && styles.iconFocused]}>{icon}</Text>
  );
}

function BetsTabIcon({ focused }: { focused: boolean }): React.JSX.Element {
  const count = useBetSlipStore((s) => s.selections.length);
  return (
    <View>
      <TabIcon icon="🎫" focused={focused} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.haitiGold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.white,
        headerTitleStyle: { color: colors.white, fontWeight: '700' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Matchs"
        component={HomeScreen}
        options={{
          title: 'Mis',
          tabBarLabel: 'Mis',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚽" focused={focused} />
          ),
          headerTitle: 'HaitiBet',
        }}
      />
      <Tab.Screen
        name="Paris"
        component={BetsScreen}
        options={{
          title: 'Pari',
          tabBarLabel: 'Pari',
          tabBarIcon: ({ focused }) => <BetsTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Kont"
        component={WalletScreen}
        options={{
          title: 'Kont mwen',
          tabBarLabel: 'Kont',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💰" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconText: {
    fontSize: 22,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.haitiRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

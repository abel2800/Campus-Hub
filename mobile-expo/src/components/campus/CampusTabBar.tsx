import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, Gradients } from '../../theme/colors';

const TABS: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', icon: 'home' },
  { name: 'social', icon: 'grid' },
  { name: 'friends', icon: 'people' },
  { name: 'chat', icon: 'chatbubble' },
  { name: 'profile', icon: 'person' },
];

/** Hidden from tab bar but still routable */
const HIDDEN = new Set(['courses', 'two']);

export function CampusTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((r) => !HIDDEN.has(r.name));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.bar}>
        {visibleRoutes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name) || TABS[index];
          const focused = state.index === state.routes.indexOf(route);

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.8}
            >
              {focused ? (
                <LinearGradient
                  colors={[...Gradients.primary]}
                  style={styles.activeIcon}
                >
                  <Ionicons name={tab.icon} size={20} color={C.onGrad} />
                </LinearGradient>
              ) : (
                <Ionicons name={tab.icon} size={20} color={C.textMute} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  bar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: C.glass,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * The designed tab bar: three equal cells, a 2px top rule, no icons.
 *
 * React Navigation's default bar can't express this — left-aligned two-line
 * cells, a solid accent fill on the active cell, and live meta text — so the
 * navigator uses this in its place.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, type, RULE } from '../theme/tokens';

/** Bottom padding the design reserves for the home indicator. */
const HOME_INDICATOR_PAD = 26;

interface DesignTabBarProps extends BottomTabBarProps {
  /** Live counters keyed by route name, e.g. `{ List: '3 to buy' }`. */
  metas: Record<string, string>;
}

export default function DesignTabBar({
  state,
  descriptors,
  navigation,
  metas,
}: DesignTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        // Honour a taller inset (iPhone home indicator) but never go below the
        // 26px the design specifies.
        { paddingBottom: Math.max(HOME_INDICATOR_PAD, insets.bottom) },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            style={({ pressed }) => [
              styles.cell,
              index < state.routes.length - 1 && styles.cellDivider,
              isFocused && styles.cellActive,
              pressed && !isFocused && styles.cellPressed,
            ]}
          >
            <Text style={[styles.label, isFocused && styles.textActive]}>{label}</Text>
            <Text style={[styles.meta, isFocused && styles.textActive]}>
              {metas[route.name] ?? ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: RULE,
    borderTopColor: color.text,
    backgroundColor: color.bg,
  },
  cell: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cellDivider: {
    borderRightWidth: RULE,
    borderRightColor: color.text,
  },
  cellActive: {
    backgroundColor: color.accent,
  },
  cellPressed: {
    backgroundColor: color.accent200,
  },
  label: {
    ...type.tabLabel,
    color: color.text,
  },
  meta: {
    ...type.meta,
    fontSize: 9,
    letterSpacing: 0.72,
    color: color.neutral600,
  },
  textActive: {
    color: color.white,
  },
});

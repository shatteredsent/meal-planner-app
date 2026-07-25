// The header every screen and overlay shares: a mono kicker and meta on one
// line, then the big title. 62px of top padding clears the status bar.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, type, GUTTER, HEADER_TOP, RULE } from '../../theme/tokens';

interface ScreenHeaderProps {
  /** Uppercase mono line on the left, e.g. `MON 27 JUL – SUN 2 AUG`. */
  kicker: string;
  /** Mono counter on the right, e.g. `2/3 chosen`. */
  meta?: string;
  title: string;
  /** Right-hand text action in place of `meta` — `CLOSE`, `BACK`. */
  action?: { label: string; onPress: () => void };
  /** Overlay titles run a little smaller than screen titles. */
  titleStyle?: 'screen' | 'overlay' | 'recipe';
}

export default function ScreenHeader({
  kicker,
  meta,
  title,
  action,
  titleStyle = 'screen',
}: ScreenHeaderProps) {
  const titleType =
    titleStyle === 'overlay'
      ? type.overlayTitle
      : titleStyle === 'recipe'
        ? type.recipeTitle
        : type.screenTitle;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.kicker} numberOfLines={1}>
          {kicker}
        </Text>

        {action ? (
          <Pressable onPress={action.onPress} hitSlop={12}>
            {({ pressed }) => (
              <Text style={[styles.action, pressed && styles.actionPressed]}>
                {action.label}
              </Text>
            )}
          </Pressable>
        ) : meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      <Text style={[titleType, styles.title]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: HEADER_TOP,
    paddingHorizontal: GUTTER,
    paddingBottom: 14,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
    backgroundColor: color.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    ...type.label,
    color: color.accent700,
    flexShrink: 1,
  },
  meta: {
    ...type.meta,
    color: color.neutral600,
  },
  action: {
    ...type.meta,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.neutral700,
  },
  actionPressed: {
    color: color.accent,
  },
  title: {
    marginTop: 8,
  },
});

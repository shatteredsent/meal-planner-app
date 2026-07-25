/**
 * The system's only button. Square corners, a 2px border, an uppercase label
 * flush left with the padding edge — never centred.
 *
 * Pressed state is a *fill* change rather than an opacity fade: the design is
 * flat, so a dimmed button reads as broken rather than pressed. That is why this
 * is a Pressable with a style callback and not a TouchableOpacity.
 */
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { color, type } from '../../theme/tokens';

export type FlatButtonVariant = 'solid' | 'accent' | 'outline' | 'quiet';

interface FlatButtonProps {
  label: string;
  onPress: () => void;
  /**
   * `accent`  — solid periwinkle, the primary action
   * `solid`   — solid ink, for "repeat the day before"
   * `outline` — 2px ink border on the ground
   * `quiet`   — 2px neutral border, for destructive or secondary actions
   */
  variant?: FlatButtonVariant;
  disabled?: boolean;
  /** Full-width block button with generous padding, as used in footers. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function FlatButton({
  label,
  onPress,
  variant = 'outline',
  disabled = false,
  block = false,
  style,
  testID,
}: FlatButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        block ? styles.block : styles.inline,
        VARIANT_BOX[variant],
        pressed && !disabled && VARIANT_PRESSED[variant],
        disabled && styles.disabledBox,
        style,
      ]}
    >
      <Text style={[type.button, VARIANT_TEXT[variant], disabled && styles.disabledText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderRadius: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  inline: {
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  block: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  disabledBox: {
    backgroundColor: 'transparent',
    borderColor: color.neutral400,
  },
  disabledText: {
    color: color.neutral500,
  },
});

const VARIANT_BOX: Record<FlatButtonVariant, ViewStyle> = {
  accent: { backgroundColor: color.accent, borderColor: color.text },
  solid: { backgroundColor: color.text, borderColor: color.text },
  outline: { backgroundColor: 'transparent', borderColor: color.text },
  quiet: { backgroundColor: 'transparent', borderColor: color.neutral400 },
};

const VARIANT_PRESSED: Record<FlatButtonVariant, ViewStyle> = {
  accent: { backgroundColor: color.accent600 },
  solid: { backgroundColor: color.accent900 },
  outline: { backgroundColor: color.accent100 },
  quiet: { borderColor: color.text, backgroundColor: color.accent100 },
};

const VARIANT_TEXT = {
  accent: { color: color.white },
  solid: { color: color.bg },
  outline: { color: color.text },
  quiet: { color: color.neutral700 },
} as const;

/**
 * One shopping-list line, split into three hit areas: a checkbox, the row body
 * (also a check target — the whole line is tappable), and the HAVE toggle.
 *
 * Checked rows go 40% opacity with a strike-through; at-home rows go 50%.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ShoppingItem } from '../../types/shoppingItem';
import { formatQuantity, formatProvenance } from '../../utils/quantity';
import { color, type, font, GUTTER, HAIRLINE, ROW_PAD_Y } from '../../theme/tokens';

interface ShoppingRowProps {
  item: ShoppingItem;
  onToggleChecked: (itemId: string, currentValue: boolean) => void;
  onTogglePantry: (itemId: string, currentValue: boolean) => void;
}

export default function ShoppingRow({
  item,
  onToggleChecked,
  onTogglePantry,
}: ShoppingRowProps) {
  const quantity = formatQuantity(item.quantity);

  function toggleChecked() {
    onToggleChecked(item.id, item.isChecked);
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggleChecked}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isChecked }}
        accessibilityLabel={`${item.name}, in cart`}
        style={({ pressed }) => [
          styles.checkbox,
          item.isChecked && styles.checkboxChecked,
          pressed && !item.isChecked && styles.checkboxPressed,
        ]}
      >
        <Text style={styles.checkmark}>{item.isChecked ? '✓' : ''}</Text>
      </Pressable>

      <Pressable
        onPress={toggleChecked}
        accessibilityRole="button"
        accessibilityLabel={[quantity, item.name].filter(Boolean).join(' ')}
        style={({ pressed }) => [
          styles.body,
          item.isChecked
            ? styles.bodyChecked
            : item.isPantry
              ? styles.bodyPantry
              : null,
          pressed && !item.isChecked && styles.bodyPressed,
        ]}
      >
        {!!quantity && (
          <Text style={[type.rowStrong, item.isChecked && styles.struck]}>
            {quantity}
          </Text>
        )}
        <Text style={[type.row, styles.name, item.isChecked && styles.struck]}>
          {item.name}
        </Text>
        <Text style={styles.provenance}>{formatProvenance(item.days)}</Text>
      </Pressable>

      <Pressable
        onPress={() => onTogglePantry(item.id, item.isPantry)}
        accessibilityRole="switch"
        accessibilityState={{ checked: item.isPantry }}
        accessibilityLabel={`${item.name}, already at home`}
        style={({ pressed }) => [
          styles.have,
          item.isPantry && styles.haveOn,
          pressed && !item.isPantry && styles.havePressed,
        ]}
      >
        <Text style={[styles.haveLabel, item.isPantry && styles.haveLabelOn]}>HAVE</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  checkbox: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: HAIRLINE,
    borderRightColor: color.neutral300,
  },
  checkboxChecked: {
    backgroundColor: color.accent,
  },
  checkboxPressed: {
    backgroundColor: color.accent200,
  },
  checkmark: {
    fontFamily: font.bold,
    fontSize: 15,
    lineHeight: 17,
    color: color.white,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingVertical: ROW_PAD_Y,
    paddingHorizontal: GUTTER,
  },
  bodyChecked: {
    opacity: 0.4,
  },
  bodyPantry: {
    opacity: 0.5,
  },
  bodyPressed: {
    backgroundColor: color.accent100,
  },
  name: {
    flexShrink: 1,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  provenance: {
    ...type.meta,
    fontSize: 10.5,
    color: color.neutral600,
    marginLeft: 'auto',
  },
  have: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: HAIRLINE,
    borderLeftColor: color.neutral300,
  },
  haveOn: {
    backgroundColor: color.neutral800,
  },
  havePressed: {
    backgroundColor: color.neutral200,
  },
  haveLabel: {
    ...type.meta,
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.51,
    color: color.neutral500,
  },
  haveLabelOn: {
    color: color.bg,
  },
});

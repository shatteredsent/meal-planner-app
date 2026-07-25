// An aisle's worth of shopping rows under a group header.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShoppingItem } from '../../types/shoppingItem';
import GroupHeader from '../ui/GroupHeader';
import ShoppingRow from './ShoppingRow';
import { color, RULE } from '../../theme/tokens';

interface AisleGroupProps {
  label: string;
  items: ShoppingItem[];
  onToggleChecked: (itemId: string, currentValue: boolean) => void;
  onTogglePantry: (itemId: string, currentValue: boolean) => void;
}

export default function AisleGroup({
  label,
  items,
  onToggleChecked,
  onTogglePantry,
}: AisleGroupProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.group}>
      <GroupHeader
        label={label}
        meta={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        ruleAbove
      />
      {items.map((item) => (
        <ShoppingRow
          key={item.id}
          item={item}
          onToggleChecked={onToggleChecked}
          onTogglePantry={onTogglePantry}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
});

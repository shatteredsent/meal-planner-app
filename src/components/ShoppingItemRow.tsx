// Renders a single shopping list item with a checkbox and delete button.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingItem } from '../types/shoppingItem';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (itemId: string, currentValue: boolean) => void;
  onDelete: (itemId: string) => void;
}

export default function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
}: ShoppingItemRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggle(item.id, item.isChecked)}
      >
        <View style={[styles.checkboxBox, item.isChecked && styles.checkboxChecked]}>
          {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
        {item.name}{item.count > 1 ? ` (x${item.count})` : ''}
      </Text>

      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#B4B2A9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: '#2C2C2A',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#B4B2A9',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#B4B2A9',
  },
});
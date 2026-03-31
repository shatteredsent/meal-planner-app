// Renders a grouped section of shopping items under a category header.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingItem } from '../types/shoppingItem';
import ShoppingItemRow from './ShoppingItemRow';

interface ShoppingCategorySectionProps {
  category: string;
  items: ShoppingItem[];
  onToggle: (itemId: string, currentValue: boolean) => void;
  onDelete: (itemId: string) => void;
}

export default function ShoppingCategorySection({
  category,
  items,
  onToggle,
  onDelete,
}: ShoppingCategorySectionProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.categoryHeader}>{category}</Text>
      <View style={styles.card}>
        {items.map((item, index) => (
          <View key={item.id}>
            <ShoppingItemRow
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
            {index < items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  categoryHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#E4E2D9',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E4E2D9',
  },
});
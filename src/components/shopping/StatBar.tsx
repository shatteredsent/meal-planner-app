// Three equal cells across the top of the List tab: to buy, in cart, at home.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, type, GUTTER, RULE } from '../../theme/tokens';

interface StatBarProps {
  toBuy: number;
  inCart: number;
  atHome: number;
}

export default function StatBar({ toBuy, inCart, atHome }: StatBarProps) {
  const cells: Array<[string, number]> = [
    ['To buy', toBuy],
    ['In cart', inCart],
    ['At home', atHome],
  ];

  return (
    <View style={styles.bar}>
      {cells.map(([label, value], index) => (
        <View
          key={label}
          style={[styles.cell, index < cells.length - 1 && styles.cellDivider]}
        >
          <Text style={styles.label}>{label}</Text>
          <Text style={type.stat}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  cell: {
    flex: 1,
    gap: 3,
    paddingVertical: 14,
    paddingHorizontal: GUTTER,
  },
  cellDivider: {
    borderRightWidth: RULE,
    borderRightColor: color.text,
  },
  label: {
    ...type.label,
    fontSize: 9,
    letterSpacing: 1.26,
    color: color.neutral600,
  },
});

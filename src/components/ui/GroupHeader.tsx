// The neutral-200 strip that titles a group: aisle name left, count right.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, type, GUTTER, RULE } from '../../theme/tokens';

interface GroupHeaderProps {
  label: string;
  meta?: string;
  /** Ingredients/Method strips in the recipe carry a rule above as well. */
  ruleAbove?: boolean;
}

export default function GroupHeader({ label, meta, ruleAbove = false }: GroupHeaderProps) {
  return (
    <View style={[styles.container, ruleAbove && styles.ruleAbove]}>
      <Text style={styles.label}>{label}</Text>
      {!!meta && <Text style={styles.meta}>{meta}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: GUTTER,
    backgroundColor: color.neutral200,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  ruleAbove: {
    borderTopWidth: RULE,
    borderTopColor: color.text,
  },
  label: {
    ...type.label,
    fontWeight: '700',
    color: color.text,
  },
  meta: {
    ...type.meta,
    color: color.neutral600,
  },
});

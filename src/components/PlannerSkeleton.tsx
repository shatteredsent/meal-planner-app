// Skeleton for the Plan and Week tabs while the meal plan loads.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { color, GUTTER, HEADER_TOP, RULE, HAIRLINE } from '../theme/tokens';

function SlotSkeleton() {
  return (
    <View style={styles.slot}>
      <SkeletonBlock width={70} height={10} />
      <SkeletonBlock width="70%" height={20} />
      <SkeletonBlock width="45%" height={12} />
    </View>
  );
}

export default function PlannerSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock width={140} height={10} />
        <SkeletonBlock width="55%" height={30} style={styles.headerTitle} />
      </View>

      <View style={styles.strip}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[styles.stripCell, i < 6 && styles.stripCellDivider]}>
            <SkeletonBlock width={20} height={9} />
            <SkeletonBlock width={16} height={15} />
          </View>
        ))}
      </View>

      {[0, 1, 2].map((i) => (
        <SlotSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  header: {
    paddingTop: HEADER_TOP,
    paddingHorizontal: GUTTER,
    paddingBottom: 14,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  headerTitle: {
    marginTop: 10,
  },
  strip: {
    flexDirection: 'row',
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  stripCell: {
    flex: 1,
    gap: 6,
    paddingVertical: 12,
    paddingLeft: 8,
  },
  stripCellDivider: {
    borderRightWidth: HAIRLINE,
    borderRightColor: color.neutral300,
  },
  slot: {
    gap: 12,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
});

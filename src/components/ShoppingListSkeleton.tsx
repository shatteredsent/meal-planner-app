// Skeleton for the List tab while the shopping list loads.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { color, GUTTER, HEADER_TOP, RULE, HAIRLINE, ROW_PAD_Y } from '../theme/tokens';

function AisleSkeleton() {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <SkeletonBlock width={80} height={10} />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.row}>
          <View style={styles.checkbox} />
          <View style={styles.rowBody}>
            <SkeletonBlock width="65%" height={13} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ShoppingListSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock width={130} height={10} />
        <SkeletonBlock width="60%" height={30} style={styles.headerTitle} />
      </View>

      <View style={styles.statBar}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.statCell, i < 2 && styles.statCellDivider]}>
            <SkeletonBlock width={44} height={9} />
            <SkeletonBlock width={26} height={22} />
          </View>
        ))}
      </View>

      {[0, 1, 2].map((i) => (
        <AisleSkeleton key={i} />
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
  statBar: {
    flexDirection: 'row',
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  statCell: {
    flex: 1,
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: GUTTER,
  },
  statCellDivider: {
    borderRightWidth: RULE,
    borderRightColor: color.text,
  },
  group: {
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  groupHeader: {
    paddingVertical: 11,
    paddingHorizontal: GUTTER,
    backgroundColor: color.neutral200,
    borderTopWidth: RULE,
    borderBottomWidth: RULE,
    borderColor: color.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  checkbox: {
    width: 44,
    borderRightWidth: HAIRLINE,
    borderRightColor: color.neutral300,
  },
  rowBody: {
    flex: 1,
    paddingVertical: ROW_PAD_Y,
    paddingHorizontal: GUTTER,
  },
});

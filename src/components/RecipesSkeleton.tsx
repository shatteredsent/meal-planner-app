// Skeleton for the recipe library while recipes load.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { color, GUTTER, HEADER_TOP, RULE } from '../theme/tokens';

function RecipeSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width="60%" height={17} />
      <SkeletonBlock width="85%" height={12} />
      <SkeletonBlock width="40%" height={10} />
    </View>
  );
}

export default function RecipesSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock width={90} height={10} />
        <SkeletonBlock width="65%" height={30} style={styles.headerTitle} />
      </View>

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <RecipeSkeleton key={i} />
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
  card: {
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
});

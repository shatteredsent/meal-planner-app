// Skeleton screen for the Shopping List tab while data loads.
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import SkeletonBlock from './SkeletonBlock';

function CategorySkeleton() {
  return (
    <View style={styles.section}>
      <SkeletonBlock width={100} height={12} borderRadius={4} style={styles.categoryLabel} />
      <View style={styles.card}>
        {[1, 2, 3].map((i) => (
          <View key={i}>
            <View style={styles.itemRow}>
              <SkeletonBlock width={22} height={22} borderRadius={6} />
              <SkeletonBlock width="70%" height={14} borderRadius={4} style={styles.itemName} />
            </View>
            {i < 3 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ShoppingListSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SkeletonBlock height={44} borderRadius={10} style={styles.generateButton} />
        <SkeletonBlock height={44} borderRadius={10} style={styles.addRow} />
        {[1, 2, 3].map((i) => (
          <CategorySkeleton key={i} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  generateButton: {
    marginBottom: 12,
  },
  addRow: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  categoryLabel: {
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  itemName: {
    flex: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E4E2D9',
  },
});
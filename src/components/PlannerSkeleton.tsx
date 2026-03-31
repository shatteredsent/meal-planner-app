// Skeleton screen for the Planner tab while meal plan data loads.
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import SkeletonBlock from './SkeletonBlock';

function DayCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width={80} height={18} borderRadius={6} style={styles.dayLabel} />
      <View style={styles.divider} />
      <View style={styles.slotRow}>
        <SkeletonBlock width={50} height={14} borderRadius={4} />
        <SkeletonBlock width="75%" height={36} borderRadius={8} />
      </View>
      <View style={styles.slotRow}>
        <SkeletonBlock width={50} height={14} borderRadius={4} />
        <SkeletonBlock width="75%" height={36} borderRadius={8} />
      </View>
    </View>
  );
}

export default function PlannerSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {[1, 2, 3, 4].map((i) => (
          <DayCardSkeleton key={i} />
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#E4E2D9',
  },
  dayLabel: {
    marginBottom: 10,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E4E2D9',
    marginBottom: 12,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
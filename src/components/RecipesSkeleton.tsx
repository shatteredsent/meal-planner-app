// Skeleton screen for the Recipes tab while recipe data loads.
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import SkeletonBlock from './SkeletonBlock';

function RecipeCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.textGroup}>
          <SkeletonBlock width="60%" height={16} borderRadius={6} style={styles.name} />
          <SkeletonBlock width="30%" height={12} borderRadius={4} />
        </View>
        <SkeletonBlock width={44} height={24} borderRadius={6} />
      </View>
    </View>
  );
}

export default function RecipesSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <RecipeCardSkeleton key={i} />
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
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E4E2D9',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    marginBottom: 8,
  },
});
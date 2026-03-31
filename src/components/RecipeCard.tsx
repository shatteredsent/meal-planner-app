// Renders a single recipe card in the recipe list.
// Shows recipe name, ingredient count, and keto-friendly badge.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Recipe } from '../types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const ingredientLabel = recipe.ingredients.length === 1
    ? '1 ingredient'
    : `${recipe.ingredients.length} ingredients`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(recipe)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.textGroup}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.ingredientCount}>{ingredientLabel}</Text>
        </View>

        {recipe.isKetoFriendly && (
          <View style={styles.ketoBadge}>
            <Text style={styles.ketoBadgeText}>Keto</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E4E2D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2A',
    marginBottom: 4,
  },
  ingredientCount: {
    fontSize: 13,
    color: '#888780',
  },
  ketoBadge: {
    backgroundColor: '#F0FAF5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
    borderWidth: 0.5,
    borderColor: '#1D9E75',
  },
  ketoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D9E75',
  },
});
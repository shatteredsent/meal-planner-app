// Shows full recipe details when a recipe card is tapped.
// Displays name, keto badge, and full ingredient list with a delete option.
import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { Recipe } from '../types/recipe';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onDelete: (recipeId: string) => void;
  onClose: () => void;
}

export default function RecipeDetailModal({
  recipe,
  onDelete,
  onClose,
}: RecipeDetailModalProps) {
  if (!recipe) return null;

  return (
    <Modal
      visible={!!recipe}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.name}</Text>
            {recipe.isKetoFriendly && (
              <View style={styles.ketoBadge}>
                <Text style={styles.ketoBadgeText}>Keto</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>Ingredients</Text>

          <ScrollView
            style={styles.ingredientList}
            showsVerticalScrollIndicator={false}
          >
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(recipe.id)}
          >
            <Text style={styles.deleteButtonText}>Delete Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2A',
    flex: 1,
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ingredientList: {
    marginBottom: 24,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1D9E75',
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 15,
    color: '#2C2C2A',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#FF4444',
    fontWeight: '600',
    fontSize: 15,
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#888780',
    fontSize: 15,
  },
});
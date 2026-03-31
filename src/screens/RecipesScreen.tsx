// Recipes screen — shows all family recipes as a scrollable list of cards.
// Handles adding and deleting recipes, and viewing recipe details.
import React, { useState } from 'react';
import {
  View, Text, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes';
import { Recipe } from '../types/recipe';
import { NewRecipe } from '../types/recipe';
import RecipeCard from '../components/RecipeCard';
import AddRecipeModal from '../components/AddRecipeModal';
import RecipeDetailModal from '../components/RecipeDetailModal';
import Header from '../components/Header';
import RecipesSkeleton from '../components/RecipesSkeleton';
import EmptyState from '../components/EmptyState';

export default function RecipesScreen() {
  const { user } = useAuth();
  const familyId = user?.uid ?? '';

  const { recipes, isLoading, hasError, addRecipe, deleteRecipe } = useRecipes(familyId);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  async function handleAddRecipe(
    recipeData: Omit<NewRecipe, 'familyId' | 'createdBy'>
  ): Promise<void> {
    if (!user) return;

    await addRecipe({
      ...recipeData,
      familyId,
      createdBy: user.uid,
    });

    setIsAddModalVisible(false);
  }

  async function handleDeleteRecipe(recipeId: string): Promise<void> {
    Alert.alert('Delete recipe', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(recipeId);
            setSelectedRecipe(null);
          } catch {
            Alert.alert('Error', 'Could not delete the recipe. Please try again.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return <RecipesSkeleton />;
  }

  if (hasError) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Could not load your recipes.</Text>
        <Text style={styles.errorSubText}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Recipes"
        rightLabel="+ Add"
        onRightPress={() => setIsAddModalVisible(true)}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {recipes.length === 0 ? (
          <EmptyState
            icon="restaurant-outline"
            title="No recipes yet"
            subtitle="Tap '+ Add' to create your first family recipe."
          />
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={setSelectedRecipe}
            />
          ))
        )}
      </ScrollView>

      <AddRecipeModal
        isVisible={isAddModalVisible}
        onConfirm={handleAddRecipe}
        onCancel={() => setIsAddModalVisible(false)}
      />

      <RecipeDetailModal
        recipe={selectedRecipe}
        onDelete={handleDeleteRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
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
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F6F2',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2A',
    marginBottom: 4,
  },
  errorSubText: {
    fontSize: 14,
    color: '#888780',
  },
});
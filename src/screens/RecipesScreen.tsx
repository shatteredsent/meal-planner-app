/**
 * Recipe library — every recipe the family has, grouped by the slot it belongs to.
 *
 * Reached from the Week tab rather than the tab bar, since the design's bar is
 * three cells. Reuses the designed recipe detail overlay so a recipe looks the
 * same whether it's opened from here or from the picker.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlannerData } from '../context/PlannerData';
import { useAuth } from '../hooks/useAuth';
import { Recipe, NewRecipe } from '../types/recipe';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '../types/meal';
import RecipeCard from '../components/RecipeCard';
import AddRecipeModal from '../components/AddRecipeModal';
import RecipeDetailSheet from '../components/recipe/RecipeDetailSheet';
import RecipesSkeleton from '../components/RecipesSkeleton';
import ScreenHeader from '../components/ui/ScreenHeader';
import GroupHeader from '../components/ui/GroupHeader';
import FlatButton from '../components/ui/FlatButton';
import { color, type, GUTTER, RULE } from '../theme/tokens';

export default function RecipesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { familyId, recipes: recipesApi } = usePlannerData();
  const { recipes, isLoading, hasError, addRecipe, deleteRecipe } = recipesApi;

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const groups = useMemo(
    () =>
      MEAL_TYPES.map((mealType) => ({
        mealType,
        items: recipes.filter((recipe) => recipe.mealType === mealType),
      })).filter((group) => group.items.length > 0),
    [recipes]
  );

  async function handleAddRecipe(
    recipeData: Omit<NewRecipe, 'familyId' | 'createdBy'>
  ): Promise<void> {
    if (!user) return;

    await addRecipe({ ...recipeData, familyId, createdBy: user.uid });
    setIsAddModalVisible(false);
  }

  function handleDeleteRecipe(): void {
    const recipe = selectedRecipe;
    if (!recipe) return;

    Alert.alert(
      'Delete recipe',
      'Are you sure? This cannot be undone. Meals already planned from it stay planned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              setSelectedRecipe(null);
            } catch {
              Alert.alert('Error', 'Could not delete the recipe. Please try again.');
            }
          },
        },
      ]
    );
  }

  if (isLoading) return <RecipesSkeleton />;

  if (hasError) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Could not load your recipes.</Text>
        <Text style={styles.errorSubText}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        kicker={`${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'}`}
        title="Recipe library"
        action={{ label: 'Back', onPress: () => navigation.goBack() }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {recipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={type.body}>
              No recipes yet. Add one and it becomes available in the picker for
              whichever meal you assign it to.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.mealType}>
              <GroupHeader
                label={MEAL_TYPE_LABELS[group.mealType]}
                meta={`${group.items.length}`}
                ruleAbove
              />
              {group.items.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onPress={setSelectedRecipe} />
              ))}
            </View>
          ))
        )}

        <View style={styles.footer}>
          <FlatButton
            block
            variant="accent"
            label="Add a recipe"
            onPress={() => setIsAddModalVisible(true)}
          />
        </View>
      </ScrollView>

      <AddRecipeModal
        isVisible={isAddModalVisible}
        onConfirm={handleAddRecipe}
        onCancel={() => setIsAddModalVisible(false)}
      />

      {/* Opened from the library, so there is no slot to plan into — the sheet's
          "put this on …" action stays hidden and "delete" takes its place. */}
      <RecipeDetailSheet
        recipe={selectedRecipe}
        target={null}
        alreadyPlanned={false}
        onAddToSlot={() => {}}
        onSwapParts={handleDeleteRecipe}
        swapPartsLabel="Delete recipe"
        onClose={() => setSelectedRecipe(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  emptyState: {
    paddingVertical: 28,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  footer: {
    padding: GUTTER,
    paddingBottom: 40,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: GUTTER,
    backgroundColor: color.bg,
  },
  errorText: {
    ...type.mealNameSmall,
    marginBottom: 4,
  },
  errorSubText: type.secondary,
});

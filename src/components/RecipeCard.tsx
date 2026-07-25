// A recipe in the library list: name, subtitle, then slot / time / feeds meta.
import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Recipe } from '../types/recipe';
import { MEAL_TYPE_LABELS } from '../types/meal';
import { color, type, GUTTER, RULE } from '../theme/tokens';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const ingredientLabel =
    recipe.ingredients.length === 1
      ? '1 ingredient'
      : `${recipe.ingredients.length} ingredients`;

  const meta = [
    MEAL_TYPE_LABELS[recipe.mealType],
    recipe.prepTime,
    `feeds ${recipe.servings}`,
    ingredientLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={() => onPress(recipe)}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name}, ${meta}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={type.mealNameSmall}>{recipe.name}</Text>
      {!!recipe.subtitle && <Text style={styles.subtitle}>{recipe.subtitle}</Text>}
      <Text style={styles.meta}>{meta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 5,
    paddingVertical: 16,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  cardPressed: {
    backgroundColor: color.accent100,
  },
  subtitle: {
    ...type.secondarySmall,
    lineHeight: 16,
  },
  meta: {
    ...type.meta,
    fontSize: 9.5,
    letterSpacing: 0.95,
    textTransform: 'uppercase',
    color: color.accent700,
    marginTop: 2,
  },
});

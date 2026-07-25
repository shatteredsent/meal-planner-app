/**
 * The full-screen picker: choose a ready-made recipe, or build a meal from parts.
 *
 * Note the segmented control's active cell is solid *ink*, not accent — the
 * accent is reserved for selecting content, so using it for mode would make two
 * different things look equally "chosen".
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Recipe } from '../../types/recipe';
import { MealType, MEAL_TYPE_LABELS } from '../../types/meal';
import {
  PartGroupKey, PartSelection, EMPTY_SELECTION,
} from '../../data/builderParts';
import Overlay from '../ui/Overlay';
import ScreenHeader from '../ui/ScreenHeader';
import MealBuilder from './MealBuilder';
import { color, type, GUTTER, RULE } from '../../theme/tokens';

export type PickerMode = 'recipes' | 'build';

export interface PickerTarget {
  dayOfWeek: string;
  mealType: MealType;
}

interface MealPickerSheetProps {
  target: PickerTarget | null;
  recipes: Recipe[];
  /** Opens in this mode; changes when arriving via "swap the parts around". */
  initialMode: PickerMode;
  /** Prefilled builder selection, from a recipe's `parts`. */
  initialSelection: PartSelection;
  onPickRecipe: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onSaveBuilt: (selection: PartSelection) => void;
  onClose: () => void;
}

const MODES: Array<{ key: PickerMode; label: string }> = [
  { key: 'recipes', label: 'Ready-made meals' },
  { key: 'build', label: 'Build your own' },
];

export default function MealPickerSheet({
  target,
  recipes,
  initialMode,
  initialSelection,
  onPickRecipe,
  onViewRecipe,
  onSaveBuilt,
  onClose,
}: MealPickerSheetProps) {
  const [mode, setMode] = useState<PickerMode>(initialMode);
  const [selection, setSelection] = useState<PartSelection>(initialSelection);

  // Re-open resets to whatever the opener asked for — a plain "Swap" starts
  // fresh, "Swap the parts around" arrives in build mode already prefilled.
  useEffect(() => {
    if (target) {
      setMode(initialMode);
      setSelection(initialSelection);
    }
  }, [target, initialMode, initialSelection]);

  const slotLabel = target ? MEAL_TYPE_LABELS[target.mealType].toLowerCase() : '';
  const dayLabel = target ? target.dayOfWeek.slice(0, 3).toUpperCase() : '';

  const offered = target
    ? recipes.filter((recipe) => recipe.mealType === target.mealType)
    : [];

  function toggleOption(group: PartGroupKey, optionId: string): void {
    setSelection((prev) => ({
      ...prev,
      [group]: prev[group] === optionId ? '' : optionId,
    }));
  }

  function handleClose(): void {
    setSelection(EMPTY_SELECTION);
    onClose();
  }

  return (
    <Overlay visible={!!target} onRequestClose={handleClose}>
      <ScreenHeader
        titleStyle="overlay"
        kicker={`${dayLabel} · ${slotLabel.toUpperCase()}`}
        title={`What's for ${slotLabel}?`}
        action={{ label: 'Close', onPress: handleClose }}
      />

      <View style={styles.segmented}>
        {MODES.map((option, index) => {
          const isActive = mode === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setMode(option.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.segment,
                index === 0 && styles.segmentDivider,
                isActive && styles.segmentActive,
                pressed && !isActive && styles.segmentPressed,
              ]}
            >
              <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {mode === 'recipes' ? (
          offered.length === 0 ? (
            <View style={styles.emptyLibrary}>
              <Text style={type.body}>
                No {slotLabel} recipes in your library yet. Build one from parts
                instead, or add a recipe from the Recipes screen.
              </Text>
            </View>
          ) : (
            offered.map((recipe) => (
              <View key={recipe.id} style={styles.recipeRow}>
                <Pressable
                  onPress={() => onPickRecipe(recipe)}
                  accessibilityRole="button"
                  accessibilityLabel={`Plan ${recipe.name} for ${slotLabel}`}
                  style={({ pressed }) => [
                    styles.recipeBody,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={type.mealNameSmall}>{recipe.name}</Text>
                  {!!recipe.subtitle && (
                    <Text style={styles.recipeSub}>{recipe.subtitle}</Text>
                  )}
                  <Text style={styles.recipeMeta}>
                    {[recipe.prepTime, `feeds ${recipe.servings}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onViewRecipe(recipe)}
                  accessibilityRole="button"
                  accessibilityLabel={`View the ${recipe.name} recipe`}
                  style={({ pressed }) => [styles.viewButton, pressed && styles.viewPressed]}
                >
                  <Text style={styles.viewLabel}>VIEW</Text>
                </Pressable>
              </View>
            ))
          )
        ) : (
          <MealBuilder
            selection={selection}
            onToggleOption={toggleOption}
            slotLabel={slotLabel}
            onSave={() => onSaveBuilt(selection)}
          />
        )}
      </ScrollView>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  segment: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  segmentDivider: {
    borderRightWidth: RULE,
    borderRightColor: color.text,
  },
  segmentActive: {
    backgroundColor: color.text,
  },
  segmentPressed: {
    backgroundColor: color.accent200,
  },
  segmentLabel: {
    ...type.button,
    color: color.neutral700,
  },
  segmentLabelActive: {
    color: color.bg,
  },
  emptyLibrary: {
    paddingVertical: 28,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  recipeBody: {
    flex: 1,
    gap: 5,
    paddingTop: 15,
    paddingBottom: 16,
    paddingLeft: GUTTER,
    paddingRight: 16,
  },
  rowPressed: {
    backgroundColor: color.accent100,
  },
  recipeSub: {
    ...type.secondarySmall,
    lineHeight: 16,
  },
  recipeMeta: {
    ...type.meta,
    fontSize: 9.5,
    letterSpacing: 0.95,
    textTransform: 'uppercase',
    color: color.accent700,
    marginTop: 2,
  },
  viewButton: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: RULE,
    borderLeftColor: color.text,
  },
  viewPressed: {
    backgroundColor: color.neutral200,
  },
  viewLabel: {
    ...type.meta,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.54,
    color: color.neutral700,
  },
});

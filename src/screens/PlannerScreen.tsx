/**
 * Plan tab — one day at a time.
 *
 * A day strip picks the day, three slot cards fill it, and a footer nudge reacts
 * to how full the day is. The picker and recipe overlays live here because both
 * need the currently targeted slot.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { usePlannerData } from '../context/PlannerData';
import { getWeekDates, weekdayIndex, formatWeekRange } from '../utils/week';
import { MealType, MEAL_TYPES, DAYS_OF_WEEK } from '../types/meal';
import { Recipe } from '../types/recipe';
import {
  PartSelection, EMPTY_SELECTION, selectionIngredients, describeSelection,
} from '../data/builderParts';
import DayStrip, { DayStripDay } from '../components/planner/DayStrip';
import MealSlotCard from '../components/planner/MealSlotCard';
import MealPickerSheet, {
  PickerMode, PickerTarget,
} from '../components/planner/MealPickerSheet';
import RecipeDetailSheet from '../components/recipe/RecipeDetailSheet';
import PlannerSkeleton from '../components/PlannerSkeleton';
import ScreenHeader from '../components/ui/ScreenHeader';
import FlatButton from '../components/ui/FlatButton';
import { color, type, GUTTER } from '../theme/tokens';
import { confirm, notify } from '../utils/dialog';

function nudgeFor(emptySlots: number): string {
  if (emptySlots === 0) {
    return 'This day is set. Nice work — the shopping list already knows about it.';
  }
  if (emptySlots === 3) {
    return 'Blank day. Copying yesterday is a perfectly good answer.';
  }
  return 'Two of three down. Fill the last slot or borrow from the day before.';
}

export default function PlannerScreen() {
  const { plan, recipes, slotFocus, clearSlotFocus } = usePlannerData();
  const { meals, isLoading, hasError, mealAt, setMeal, clearSlot, copyDay } = plan;

  // Start on today, so opening the app lands where the user actually is.
  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    weekdayIndex(new Date())
  );

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('recipes');
  const [pickerSelection, setPickerSelection] = useState<PartSelection>(EMPTY_SELECTION);

  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [recipeTarget, setRecipeTarget] = useState<PickerTarget | null>(null);

  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const selectedDay = DAYS_OF_WEEK[selectedDayIndex];

  const stripDays: DayStripDay[] = useMemo(
    () =>
      DAYS_OF_WEEK.map((name, index) => ({
        name,
        date: String(weekDates[index].getDate()),
        filledSlots: meals.filter((m) => m.dayOfWeek === name).length,
      })),
    [meals, weekDates]
  );

  const daySlots = MEAL_TYPES.map((mealType) => ({
    mealType,
    meal: mealAt(selectedDay, mealType),
  }));
  const emptySlots = daySlots.filter((slot) => !slot.meal).length;

  // ── Picker ──────────────────────────────────────────────────────
  function openPicker(dayOfWeek: string, mealType: MealType): void {
    setPickerMode('recipes');
    setPickerSelection(EMPTY_SELECTION);
    setPickerTarget({ dayOfWeek, mealType });
  }

  // Arriving from the Week tab: select the day it asked for and open its picker.
  useEffect(() => {
    if (!slotFocus) return;
    setSelectedDayIndex(slotFocus.dayIndex);
    openPicker(DAYS_OF_WEEK[slotFocus.dayIndex], slotFocus.mealType);
    clearSlotFocus();
  }, [slotFocus, clearSlotFocus]);

  async function handlePickRecipe(recipe: Recipe): Promise<void> {
    if (!pickerTarget) return;
    const target = pickerTarget;
    setPickerTarget(null);

    try {
      await setMeal(target.dayOfWeek, target.mealType, {
        recipeId: recipe.id,
        recipeName: recipe.name,
        subtitle: recipe.subtitle,
        // Snapshot the ingredients so later recipe edits don't rewrite history.
        ingredients: recipe.ingredients,
        prepTime: recipe.prepTime,
      });
    } catch {
      notify('Error', 'Could not plan that meal. Please try again.');
    }
  }

  async function handleSaveBuilt(selection: PartSelection): Promise<void> {
    if (!pickerTarget) return;
    const { name, subtitle, isReady } = describeSelection(selection);
    if (!isReady) return;

    const target = pickerTarget;
    setPickerTarget(null);

    try {
      await setMeal(target.dayOfWeek, target.mealType, {
        recipeName: name,
        subtitle: `${subtitle.charAt(0).toUpperCase()}${subtitle.slice(1)}.`,
        ingredients: selectionIngredients(selection),
        prepTime: '30 min',
      });
    } catch {
      notify('Error', 'Could not save that meal. Please try again.');
    }
  }

  // ── Recipe detail ───────────────────────────────────────────────
  function viewRecipeFromPicker(recipe: Recipe): void {
    setRecipeTarget(pickerTarget);
    setOpenRecipe(recipe);
  }

  function viewRecipeFromSlot(mealType: MealType): void {
    const meal = mealAt(selectedDay, mealType);
    if (!meal?.recipeId) return;

    const recipe = recipes.recipes.find((r) => r.id === meal.recipeId);
    if (!recipe) {
      // The recipe was deleted since it was planned. The meal itself still
      // stands — it carries its own name and ingredient snapshot.
      notify(
        'Recipe unavailable',
        'This recipe is no longer in your library, but the meal is still planned.'
      );
      return;
    }

    setRecipeTarget({ dayOfWeek: selectedDay, mealType });
    setOpenRecipe(recipe);
  }

  async function handleAddFromRecipe(): Promise<void> {
    if (!openRecipe || !recipeTarget) return;
    const recipe = openRecipe;
    const target = recipeTarget;

    setOpenRecipe(null);
    setPickerTarget(null);

    try {
      await setMeal(target.dayOfWeek, target.mealType, {
        recipeId: recipe.id,
        recipeName: recipe.name,
        subtitle: recipe.subtitle,
        ingredients: recipe.ingredients,
        prepTime: recipe.prepTime,
      });
    } catch {
      notify('Error', 'Could not plan that meal. Please try again.');
    }
  }

  /** Closes the recipe and reopens the picker in build mode, prefilled. */
  function handleSwapParts(): void {
    const recipe = openRecipe;
    const target =
      recipeTarget ??
      (recipe ? { dayOfWeek: selectedDay, mealType: recipe.mealType } : null);

    setOpenRecipe(null);
    if (!target) return;

    setPickerSelection({ ...EMPTY_SELECTION, ...(recipe?.parts ?? {}) });
    setPickerMode('build');
    setPickerTarget(target);
  }

  // ── Destructive actions keep their confirms ─────────────────────
  function handleClearSlot(mealType: MealType): void {
    confirm({
      title: 'Remove meal',
      message: 'Are you sure?',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await clearSlot(selectedDay, mealType);
        } catch {
          notify('Error', 'Could not remove the meal. Please try again.');
        }
      },
    });
  }

  async function handleRepeatPreviousDay(): Promise<void> {
    const sourceDay = DAYS_OF_WEEK[selectedDayIndex === 0 ? 6 : selectedDayIndex - 1];

    if (!meals.some((m) => m.dayOfWeek === sourceDay)) {
      notify('Nothing to copy', `${sourceDay} has no meals planned yet.`);
      return;
    }

    try {
      await copyDay(sourceDay, selectedDay);
    } catch {
      notify('Error', 'Could not copy that day. Please try again.');
    }
  }

  if (isLoading) return <PlannerSkeleton />;

  if (hasError) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Could not load your meal plan.</Text>
        <Text style={styles.errorSubText}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        kicker={formatWeekRange(weekDates)}
        meta={`${3 - emptySlots}/3 chosen`}
        title={selectedDay}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <DayStrip
          days={stripDays}
          selectedIndex={selectedDayIndex}
          onSelect={setSelectedDayIndex}
        />

        {daySlots.map(({ mealType, meal }) => (
          <MealSlotCard
            key={mealType}
            mealType={mealType}
            meal={meal}
            onOpenRecipe={() => viewRecipeFromSlot(mealType)}
            onSwap={() => openPicker(selectedDay, mealType)}
            onClear={() => handleClearSlot(mealType)}
          />
        ))}

        <View style={styles.footer}>
          <Text style={type.secondarySmall}>{nudgeFor(emptySlots)}</Text>
          <FlatButton
            block
            variant="solid"
            onPress={handleRepeatPreviousDay}
            label="Repeat the day before"
          />
        </View>
      </ScrollView>

      <MealPickerSheet
        target={pickerTarget}
        recipes={recipes.recipes}
        initialMode={pickerMode}
        initialSelection={pickerSelection}
        onPickRecipe={handlePickRecipe}
        onViewRecipe={viewRecipeFromPicker}
        onSaveBuilt={handleSaveBuilt}
        onClose={() => setPickerTarget(null)}
      />

      <RecipeDetailSheet
        recipe={openRecipe}
        target={recipeTarget}
        alreadyPlanned={
          !!openRecipe &&
          !!recipeTarget &&
          mealAt(recipeTarget.dayOfWeek, recipeTarget.mealType)?.recipeId ===
            openRecipe.id
        }
        onAddToSlot={handleAddFromRecipe}
        onSwapParts={handleSwapParts}
        onClose={() => setOpenRecipe(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  footer: {
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: GUTTER,
    gap: 10,
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

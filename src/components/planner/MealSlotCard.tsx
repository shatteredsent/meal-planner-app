/**
 * One of the three meal slots on the Plan tab.
 *
 * Filled: a 4px accent bar, the meal name and subtitle, then the action row.
 * Empty: a dashed full-width button inviting a pick.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Meal, MealType, MEAL_TYPE_LABELS, hasRecipe } from '../../types/meal';
import FlatButton from '../ui/FlatButton';
import { color, type, font, GUTTER, RULE } from '../../theme/tokens';

interface MealSlotCardProps {
  mealType: MealType;
  meal: Meal | undefined;
  onOpenRecipe: () => void;
  onSwap: () => void;
  onClear: () => void;
}

export default function MealSlotCard({
  mealType,
  meal,
  onOpenRecipe,
  onSwap,
  onClear,
}: MealSlotCardProps) {
  const label = MEAL_TYPE_LABELS[mealType];

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Text style={styles.slotLabel}>{label}</Text>
        {!!meal?.prepTime && <Text style={styles.time}>{meal.prepTime}</Text>}
      </View>

      {meal ? (
        <View style={styles.filled}>
          <View style={styles.mealRow}>
            <View style={styles.accentBar} />
            <View style={styles.mealText}>
              <Text style={type.mealName}>{meal.recipeName}</Text>
              {!!meal.subtitle && <Text style={type.secondary}>{meal.subtitle}</Text>}
            </View>
          </View>

          <View style={styles.actions}>
            {/* Only library recipes have a method to show. */}
            {hasRecipe(meal) && (
              <FlatButton label="Recipe" onPress={onOpenRecipe} variant="outline" />
            )}
            <FlatButton label="Swap" onPress={onSwap} variant="outline" />
            <FlatButton label="Clear" onPress={onClear} variant="quiet" />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={onSwap}
          accessibilityRole="button"
          accessibilityLabel={`Plan ${label.toLowerCase()}`}
          style={({ pressed }) => [styles.emptySlot, pressed && styles.emptySlotPressed]}
        >
          <Text style={styles.plus}>+</Text>
          <Text style={styles.emptyCopy}>Nothing planned yet — pick something</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: GUTTER,
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  slotLabel: {
    ...type.label,
    color: color.neutral600,
  },
  time: {
    ...type.meta,
    color: color.neutral500,
  },
  filled: {
    gap: 12,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  accentBar: {
    width: 4,
    backgroundColor: color.accent,
  },
  mealText: {
    flex: 1,
    gap: 3,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: color.neutral400,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  emptySlotPressed: {
    borderColor: color.accent,
    backgroundColor: color.accent100,
  },
  plus: {
    fontFamily: font.extrabold,
    fontSize: 18,
    lineHeight: 20,
    color: color.accent,
  },
  emptyCopy: {
    fontFamily: font.semibold,
    fontSize: 13,
    lineHeight: 15,
    color: color.neutral700,
    flex: 1,
  },
});

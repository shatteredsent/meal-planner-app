/**
 * One day in the Week tab: a header row with the date and a fill count, then
 * three tappable slot rows. Tapping a row jumps to Plan with that slot open.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Meal, MealType, MEAL_TYPES, MEAL_TYPE_LABELS } from '../../types/meal';
import { color, type, font, GUTTER, RULE, HAIRLINE, ROW_PAD_Y } from '../../theme/tokens';

interface WeekDayBlockProps {
  /** Full day name — the value stored on a meal. */
  dayName: string;
  /** `Mon Jul 27`, as displayed. */
  label: string;
  /** Meals planned for this day, any slot. */
  meals: Meal[];
  isSelected: boolean;
  onSelectSlot: (mealType: MealType) => void;
}

export default function WeekDayBlock({
  label,
  meals,
  isSelected,
  onSelectSlot,
}: WeekDayBlockProps) {
  const filled = meals.length;

  return (
    <View style={styles.block}>
      <View style={[styles.header, isSelected && styles.headerSelected]}>
        <Text style={[styles.headerLabel, isSelected && styles.headerTextSelected]}>
          {label}
        </Text>
        <Text style={[styles.headerMeta, isSelected && styles.headerTextSelected]}>
          {filled}/3
        </Text>
      </View>

      {MEAL_TYPES.map((mealType) => {
        const meal = meals.find((m) => m.mealType === mealType);

        return (
          <Pressable
            key={mealType}
            onPress={() => onSelectSlot(mealType)}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${MEAL_TYPE_LABELS[mealType]}: ${
              meal ? meal.recipeName : 'open'
            }`}
            style={({ pressed }) => [styles.slotRow, pressed && styles.slotRowPressed]}
          >
            <Text style={styles.slotLabel}>{MEAL_TYPE_LABELS[mealType]}</Text>
            <Text style={meal ? styles.mealName : styles.openName}>
              {meal ? meal.recipeName : 'Open'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: GUTTER,
    backgroundColor: color.neutral200,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  headerSelected: {
    backgroundColor: color.accent,
  },
  headerLabel: {
    fontFamily: font.bold,
    fontSize: 13,
    lineHeight: 14,
    letterSpacing: 0.26,
    color: color.text,
  },
  headerMeta: {
    ...type.meta,
    opacity: 0.75,
    color: color.text,
  },
  headerTextSelected: {
    color: color.white,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: ROW_PAD_Y,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  slotRowPressed: {
    backgroundColor: color.accent100,
  },
  slotLabel: {
    ...type.meta,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.14,
    textTransform: 'uppercase',
    color: color.neutral600,
    width: 74,
  },
  mealName: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 13.5,
    lineHeight: 18,
    color: color.text,
  },
  openName: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 18,
    color: color.neutral500,
  },
});

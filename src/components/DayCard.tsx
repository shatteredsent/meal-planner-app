// Renders a single day's card in the weekly planner.
// Shows the day name and a MealSlot for each meal type.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Meal, MealType } from '../types/meal';
import MealSlot from './MealSlot';

const MEAL_TYPES: MealType[] = ['lunch', 'dinner'];

interface DayCardProps {
  day: string;
  meals: Meal[];
  onAddMeal: (day: string, mealType: MealType) => void;
  onDeleteMeal: (mealId: string) => void;
}

export default function DayCard({
  day,
  meals,
  onAddMeal,
  onDeleteMeal,
}: DayCardProps) {
  function getMealForSlot(mealType: MealType): Meal | undefined {
    return meals.find(
      (meal) => meal.dayOfWeek === day && meal.mealType === mealType
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.dayLabel}>{day}</Text>

      <View style={styles.divider} />

      {MEAL_TYPES.map((mealType) => (
        <MealSlot
          key={mealType}
          mealType={mealType}
          meal={getMealForSlot(mealType)}
          onAddPress={() => onAddMeal(day, mealType)}
          onDeletePress={onDeleteMeal}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#E4E2D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2A',
    marginBottom: 10,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E4E2D9',
    marginBottom: 8,
  },
});
// Renders a single meal slot (Lunch or Dinner) inside a DayCard.
// Shows the meal name if assigned, or an "+ Add" button if empty.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Meal, MealType } from '../types/meal';

interface MealSlotProps {
  mealType: MealType;
  meal: Meal | undefined;
  onAddPress: () => void;
  onDeletePress: (mealId: string) => void;
}

export default function MealSlot({
  mealType,
  meal,
  onAddPress,
  onDeletePress,
}: MealSlotProps) {
  const label = mealType === 'lunch' ? 'Lunch' : 'Dinner';

  return (
    <View style={styles.container}>
      <Text style={styles.mealTypeLabel}>{label}</Text>

      {meal ? (
        <View style={styles.assignedMeal}>
          <Text style={styles.mealName}>{meal.recipeName}</Text>
          <TouchableOpacity onPress={() => onDeletePress(meal.id)}>
            <Text style={styles.deleteButton}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  mealTypeLabel: {
    fontSize: 14,
    color: '#888780',
    width: 52,
  },
  assignedMeal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FAF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mealName: {
    fontSize: 14,
    color: '#2C2C2A',
    fontWeight: '500',
    flex: 1,
  },
  deleteButton: {
    fontSize: 14,
    color: '#B4B2A9',
    paddingLeft: 8,
  },
  addButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4D2C9',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '500',
  },
});
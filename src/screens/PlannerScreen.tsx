// Planner screen — shows the weekly meal plan as a vertical scroll of day cards.
// Uses RecipePickerModal to assign meals — falls back to free text if no recipes exist.
import React, { useState } from 'react';
import {
  View, ScrollView, Text, StyleSheet,
  ActivityIndicator, SafeAreaView, Alert, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useMealPlan, getCurrentWeekDays } from '../hooks/useMealPlan';
import { useRecipes } from '../hooks/useRecipes';
import { MealType, NewMeal } from '../types/meal';
import DayCard from '../components/DayCard';
import RecipePickerModal from '../components/RecipePickerModal';
import Header from '../components/Header';
import PlannerSkeleton from '../components/PlannerSkeleton';
import EmptyState from '../components/EmptyState';

const DAYS_OF_WEEK = getCurrentWeekDays(new Date());

export default function PlannerScreen() {
  const { user } = useAuth();
  const familyId = user?.uid ?? '';

  const { meals, weekId, isLoading, hasError, addMeal, deleteMeal, clearWeek } = useMealPlan(familyId);
  const { recipes } = useRecipes(familyId);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');

  function handleAddPress(day: string, mealType: MealType): void {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setModalVisible(true);
  }

  async function handleDeleteMeal(mealId: string): Promise<void> {
    Alert.alert('Remove meal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(mealId);
          } catch {
            Alert.alert('Error', 'Could not remove the meal. Please try again.');
          }
        },
      },
    ]);
  }

  async function handleClearWeek(): Promise<void> {
    if (meals.length === 0) return;
    Alert.alert(
      'Clear all meals',
      'Remove all meals from this week?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearWeek();
            } catch {
              Alert.alert('Error', 'Could not clear the week. Please try again.');
            }
          },
        },
      ]
    );
  }

  async function handleModalConfirm(recipeName: string): Promise<void> {
    if (!familyId) return;

    const newMeal: NewMeal = {
      familyId,
      recipeName,
      mealType: selectedMealType,
      dayOfWeek: selectedDay,
      weekId,
    };

    await addMeal(newMeal);
    setModalVisible(false);
  }

  if (isLoading) {
    return <PlannerSkeleton />;
  }

  if (hasError) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Could not load your meal plan.</Text>
        <Text style={styles.errorSubText}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="This Week"
        rightLabel={meals.length > 0 ? 'Clear all' : undefined}
        rightColor="#FF4444"
        onRightPress={handleClearWeek}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {DAYS_OF_WEEK.map((day) => (
          <DayCard
            key={day}
            day={day}
            meals={meals.filter((meal) => meal.dayOfWeek === day)}
            onAddMeal={handleAddPress}
            onDeleteMeal={handleDeleteMeal}
          />
        ))}
      </ScrollView>

      <RecipePickerModal
        isVisible={modalVisible}
        day={selectedDay}
        mealType={selectedMealType}
        recipes={recipes}
        onConfirm={handleModalConfirm}
        onCancel={() => setModalVisible(false)}
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
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2C2A',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clearButton: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '500',
  },
});
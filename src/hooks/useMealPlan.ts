/**
 * useMealPlan — loads and manages the meal plan for the current family and week.
 * Subscribes to Firestore in real time so all family members see updates instantly.
 */
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc,
  deleteDoc, doc, serverTimestamp, query, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Meal, NewMeal } from '../types/meal';

// Returns the ISO week string for a given date e.g. '2025-W03'
function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNumber = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

// Returns Monday through Sunday for the week containing the given date
export function getCurrentWeekDays(date: Date): string[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days;
}

interface UseMealPlanResult {
  meals: Meal[];
  weekId: string;
  isLoading: boolean;
  hasError: boolean;
  addMeal: (newMeal: NewMeal) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  clearWeek: () => Promise<void>;
}

export function useMealPlan(familyId: string): UseMealPlanResult {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const weekId = getWeekId(new Date());

  useEffect(() => {
    if (!familyId) return;

    // Real-time listener scoped to this family + this week
    const mealsRef = collection(db, 'mealPlans');
    const mealsQuery = query(
      mealsRef,
      where('familyId', '==', familyId),
      where('weekId', '==', weekId)
    );

    const unsubscribe = onSnapshot(
      mealsQuery,
      (snapshot) => {
        const loadedMeals: Meal[] = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Meal, 'id'>),
        }));
        setMeals(loadedMeals);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );

    // Unsubscribe when component unmounts or familyId changes
    return () => unsubscribe();
  }, [familyId, weekId]);

  async function addMeal(newMeal: NewMeal): Promise<void> {
    await addDoc(collection(db, 'mealPlans'), {
      ...newMeal,
      createdAt: serverTimestamp(),
    });
  }

  async function deleteMeal(mealId: string): Promise<void> {
    await deleteDoc(doc(db, 'mealPlans', mealId));
  }

  async function clearWeek(): Promise<void> {
    const batch = writeBatch(db);
    meals.forEach((meal) => {
        batch.delete(doc(db, 'mealPlans', meal.id));
    });
    await batch.commit();
  }
  return { meals, weekId, isLoading, hasError, addMeal, deleteMeal, clearWeek };
}
/**
 * useMealPlan — loads and manages the meal plan for the current family and week.
 * Subscribes to Firestore in real time so all family members see updates instantly.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc,
  deleteDoc, doc, serverTimestamp, query, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Meal, NewMeal, MealType, DAYS_OF_WEEK, normalizeMeal } from '../types/meal';
import { getWeekId } from '../utils/week';

// Returns Monday through Sunday for the week containing the given date
export function getCurrentWeekDays(_date: Date): string[] {
  return [...DAYS_OF_WEEK];
}

/** What a caller supplies to fill a slot — the slot itself comes separately. */
export type MealPayload = Omit<
  NewMeal,
  'familyId' | 'weekId' | 'dayOfWeek' | 'mealType'
>;

interface UseMealPlanResult {
  meals: Meal[];
  weekId: string;
  isLoading: boolean;
  hasError: boolean;
  addMeal: (newMeal: NewMeal) => Promise<void>;
  /** Fills a slot, replacing whatever was there. */
  setMeal: (dayOfWeek: string, mealType: MealType, payload: MealPayload) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  /** Empties one slot. No-op when it is already empty. */
  clearSlot: (dayOfWeek: string, mealType: MealType) => Promise<void>;
  /** Copies every filled slot from one day onto another, overwriting. */
  copyDay: (fromDay: string, toDay: string) => Promise<void>;
  clearWeek: () => Promise<void>;
  /** The meal in a slot, or undefined. */
  mealAt: (dayOfWeek: string, mealType: MealType) => Meal | undefined;
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
        setMeals(snapshot.docs.map((d) => normalizeMeal(d.id, d.data())));
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

  const mealAt = useCallback(
    (dayOfWeek: string, mealType: MealType) =>
      meals.find((m) => m.dayOfWeek === dayOfWeek && m.mealType === mealType),
    [meals]
  );

  async function addMeal(newMeal: NewMeal): Promise<void> {
    await addDoc(collection(db, 'mealPlans'), {
      ...newMeal,
      createdAt: serverTimestamp(),
    });
  }

  async function setMeal(
    dayOfWeek: string,
    mealType: MealType,
    payload: MealPayload
  ): Promise<void> {
    // A slot holds at most one meal. Clear any occupant first so a re-pick
    // replaces rather than stacks — and so the shopping list doesn't
    // double-count the ingredients of a swapped-out meal.
    const occupants = meals.filter(
      (m) => m.dayOfWeek === dayOfWeek && m.mealType === mealType
    );
    if (occupants.length > 0) {
      const batch = writeBatch(db);
      occupants.forEach((m) => batch.delete(doc(db, 'mealPlans', m.id)));
      await batch.commit();
    }

    await addMeal({ ...payload, familyId, weekId, dayOfWeek, mealType });
  }

  async function deleteMeal(mealId: string): Promise<void> {
    await deleteDoc(doc(db, 'mealPlans', mealId));
  }

  async function clearSlot(dayOfWeek: string, mealType: MealType): Promise<void> {
    const occupants = meals.filter(
      (m) => m.dayOfWeek === dayOfWeek && m.mealType === mealType
    );
    if (occupants.length === 0) return;

    const batch = writeBatch(db);
    occupants.forEach((m) => batch.delete(doc(db, 'mealPlans', m.id)));
    await batch.commit();
  }

  async function copyDay(fromDay: string, toDay: string): Promise<void> {
    const source = meals.filter((m) => m.dayOfWeek === fromDay);
    if (source.length === 0) return;

    const batch = writeBatch(db);

    // Overwrite only the slots the source day actually fills — copying a day
    // with no breakfast should leave the target's breakfast alone.
    const incomingSlots = new Set(source.map((m) => m.mealType));
    meals
      .filter((m) => m.dayOfWeek === toDay && incomingSlots.has(m.mealType))
      .forEach((m) => batch.delete(doc(db, 'mealPlans', m.id)));

    source.forEach((meal) => {
      const ref = doc(collection(db, 'mealPlans'));
      const copy: NewMeal = {
        familyId,
        recipeName: meal.recipeName,
        subtitle: meal.subtitle,
        ingredients: meal.ingredients,
        prepTime: meal.prepTime,
        mealType: meal.mealType,
        dayOfWeek: toDay,
        weekId,
      };
      // Firestore rejects explicit undefined, so recipeId is only set when real.
      batch.set(ref, {
        ...copy,
        ...(meal.recipeId ? { recipeId: meal.recipeId } : {}),
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  async function clearWeek(): Promise<void> {
    if (meals.length === 0) return;
    const batch = writeBatch(db);
    meals.forEach((meal) => {
      batch.delete(doc(db, 'mealPlans', meal.id));
    });
    await batch.commit();
  }

  return {
    meals,
    weekId,
    isLoading,
    hasError,
    addMeal,
    setMeal,
    deleteMeal,
    clearSlot,
    copyDay,
    clearWeek,
    mealAt,
  };
}

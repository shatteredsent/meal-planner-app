/**
 * This week's plan and list state — one Firestore document.
 *
 * Every write is a merging `setDoc`, which means writes to different slots merge
 * instead of clobbering each other (two people can fill Monday and Thursday at
 * the same time), and the document is created on first use without an existence
 * check anywhere.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  arrayRemove,
  arrayUnion,
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { EMPTY_WEEK, slotKey } from '../types';
import type { Category, Meal, MealType, Week } from '../types';
import { getWeekId } from '../lib/week';
import { categorize } from '../lib/categorize';
import { manualKey, staleKeys } from '../lib/shoppingList';

export interface WeekApi {
  week: Week;
  weekId: string;
  isLoading: boolean;
  hasError: boolean;

  mealAt: (day: string, mealType: MealType) => Meal | undefined;
  setMeal: (day: string, mealType: MealType, meal: Meal) => Promise<void>;
  clearSlot: (day: string, mealType: MealType) => Promise<void>;
  /** Copies every filled slot from one day onto another, overwriting those slots. */
  copyDay: (fromDay: string, toDay: string) => Promise<void>;
  clearWeek: () => Promise<void>;

  toggleChecked: (key: string, isChecked: boolean) => Promise<void>;
  togglePantry: (key: string, isPantry: boolean) => Promise<void>;
  addExtra: (name: string) => Promise<void>;
  removeExtra: (name: string) => Promise<void>;
}

export function useWeek(familyId: string): WeekApi {
  const [week, setWeek] = useState<Week>(EMPTY_WEEK);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const weekId = useMemo(() => getWeekId(new Date()), []);

  useEffect(() => {
    if (!familyId) return;

    setIsLoading(true);
    const ref = doc(db, 'families', familyId, 'weeks', weekId);

    return onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setWeek({
          meals: data?.meals ?? {},
          checked: data?.checked ?? [],
          pantry: data?.pantry ?? [],
          extras: data?.extras ?? [],
        });
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );
  }, [familyId, weekId]);

  const ref = () => doc(db, 'families', familyId, 'weeks', weekId);
  const merge = (data: Record<string, unknown>) => setDoc(ref(), data, { merge: true });

  /**
   * `checked`/`pantry` removals to fold into a plan write, so a removed meal
   * doesn't leave its lines' state behind. See staleKeys.
   */
  function pruning(nextMeals: Record<string, Meal>): Record<string, unknown> {
    const stale = staleKeys(nextMeals, week.extras, [...week.checked, ...week.pantry]);
    if (stale.length === 0) return {};
    return { checked: arrayRemove(...stale), pantry: arrayRemove(...stale) };
  }

  return {
    week,
    weekId,
    isLoading,
    hasError,

    mealAt: (day, mealType) => week.meals[slotKey(day, mealType)],

    // A slot holds one meal, so writing it replaces whatever was there — and
    // the shopping list follows automatically, because it is derived.
    setMeal: async (day, mealType, meal) => {
      const key = slotKey(day, mealType);
      await merge({
        meals: { [key]: meal },
        // A swap can orphan the outgoing meal's lines.
        ...pruning({ ...week.meals, [key]: meal }),
      });
    },

    clearSlot: async (day, mealType) => {
      const key = slotKey(day, mealType);
      const next = { ...week.meals };
      delete next[key];

      await merge({
        meals: { [key]: deleteField() },
        ...pruning(next),
      });
    },

    copyDay: async (fromDay, toDay) => {
      const copied: Record<string, Meal> = {};
      for (const [key, meal] of Object.entries(week.meals)) {
        const [day, mealType] = key.split('_');
        if (day === fromDay) copied[slotKey(toDay, mealType as MealType)] = meal;
      }
      if (Object.keys(copied).length === 0) return;

      // Merging means a source day with no breakfast leaves the target's
      // breakfast alone, which is the behaviour we want.
      await merge({
        meals: copied,
        ...pruning({ ...week.meals, ...copied }),
      });
    },

    // Replaces the whole `meals` field rather than merging into it, so every
    // slot goes. `extras` is untouched: hand-typed items are not the plan's
    // business.
    clearWeek: async () => {
      if (Object.keys(week.meals).length === 0) return;
      await updateDoc(ref(), { meals: {}, checked: [], pantry: [] });
    },

    toggleChecked: (key, isChecked) =>
      merge({ checked: isChecked ? arrayRemove(key) : arrayUnion(key) }),

    togglePantry: (key, isPantry) =>
      merge({ pantry: isPantry ? arrayRemove(key) : arrayUnion(key) }),

    addExtra: async (rawName) => {
      const name = rawName.trim();
      if (!name) return;
      if (week.extras.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;

      await merge({
        extras: arrayUnion({ name, category: categorize(name) as Category }),
      });
    },

    removeExtra: async (name) => {
      const extra = week.extras.find((e) => e.name === name);
      if (!extra) return;

      await merge({
        extras: arrayRemove(extra),
        // Don't leave the removed line's state behind to be inherited by a
        // future item of the same name.
        checked: arrayRemove(manualKey(name)),
        pantry: arrayRemove(manualKey(name)),
      });
    },
  };
}

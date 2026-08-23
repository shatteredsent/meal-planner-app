/**
 * One place that owns the family's plan, list and recipes.
 *
 * Every designed tab reads from the same three Firestore subscriptions, and the
 * tab bar's live counts ("3 to buy", "11/21") mean the data has to be available
 * above the navigator rather than fetched per screen.
 *
 * It is also where the shopping list reconciles against the plan. That has to
 * happen exactly once — if two mounted screens each ran the reconciler they
 * would race and duplicate rows.
 */
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFamilyId } from '../hooks/useFamilyId';
import { useMealPlan } from '../hooks/useMealPlan';
import { useShoppingList } from '../hooks/useShoppingList';
import { useRecipes } from '../hooks/useRecipes';
import { MealType } from '../types/meal';

type MealPlanApi = ReturnType<typeof useMealPlan>;
type ShoppingApi = ReturnType<typeof useShoppingList>;
type RecipesApi = ReturnType<typeof useRecipes>;

/**
 * A "go here and open this" hand-off. The Week tab lets you tap any slot in the
 * week and land on the Plan tab with that day selected and its picker open, so
 * the request has to outlive the navigation.
 */
export interface SlotFocusRequest {
  dayIndex: number;
  mealType: MealType;
}

interface PlannerDataValue {
  familyId: string;
  plan: MealPlanApi;
  shopping: ShoppingApi;
  recipes: RecipesApi;
  /** Unchecked items that aren't marked at-home — the "to buy" count. */
  toBuyCount: number;
  /** Filled slots this week, out of 21. */
  filledSlotCount: number;
  slotFocus: SlotFocusRequest | null;
  requestSlotFocus: (request: SlotFocusRequest) => void;
  /** Plan calls this once it has acted on the request. */
  clearSlotFocus: () => void;
}

const PlannerDataContext = createContext<PlannerDataValue | null>(null);

export function PlannerDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Not user.uid: an invited member's data lives under the family that invited
  // them. See useFamilyId.
  const { familyId } = useFamilyId(user?.uid ?? '');

  const plan = useMealPlan(familyId);
  const shopping = useShoppingList(familyId);
  const recipes = useRecipes(familyId);

  const { meals } = plan;
  const { reconcileFromPlan } = shopping;
  const planLoaded = !plan.isLoading;
  const listLoaded = !shopping.isLoading;

  useEffect(() => {
    // Wait for both collections: reconciling against a half-loaded list would
    // read "nothing here yet" and re-create rows that already exist.
    if (!familyId || !planLoaded || !listLoaded) return;
    void reconcileFromPlan(meals);
  }, [familyId, planLoaded, listLoaded, meals, reconcileFromPlan]);

  const toBuyCount = useMemo(
    () => shopping.items.filter((i) => !i.isChecked && !i.isPantry).length,
    [shopping.items]
  );

  const filledSlotCount = plan.meals.length;

  const [slotFocus, setSlotFocus] = useState<SlotFocusRequest | null>(null);
  const requestSlotFocus = useCallback((request: SlotFocusRequest) => {
    setSlotFocus(request);
  }, []);
  const clearSlotFocus = useCallback(() => setSlotFocus(null), []);

  const value = useMemo<PlannerDataValue>(
    () => ({
      familyId,
      plan,
      shopping,
      recipes,
      toBuyCount,
      filledSlotCount,
      slotFocus,
      requestSlotFocus,
      clearSlotFocus,
    }),
    [
      familyId, plan, shopping, recipes, toBuyCount, filledSlotCount,
      slotFocus, requestSlotFocus, clearSlotFocus,
    ]
  );

  return (
    <PlannerDataContext.Provider value={value}>
      {children}
    </PlannerDataContext.Provider>
  );
}

export function usePlannerData(): PlannerDataValue {
  const value = useContext(PlannerDataContext);
  if (!value) {
    throw new Error('usePlannerData must be used inside a PlannerDataProvider');
  }
  return value;
}

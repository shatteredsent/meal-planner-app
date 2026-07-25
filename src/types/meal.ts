// Meal types for the Family Meal Planner.
// All Firestore documents that relate to meal planning use these shapes.
import { Ingredient } from './recipe';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

/** Slot order within a day, and the labels the design shows. */
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/**
 * A filled meal slot. Two shapes share this document:
 *
 *   - a **recipe reference** — `recipeId` points at a Recipe, and `ingredients`
 *     is a snapshot taken when it was planned;
 *   - a **custom built meal** — no `recipeId`; the meal carries its own name,
 *     subtitle and ingredient list, assembled in the builder.
 *
 * Both always carry `recipeName` + `ingredients`, so the shopping list never
 * has to resolve a recipe lookup to sum a week.
 */
export interface Meal {
  id: string;
  familyId: string;
  /** Display name. For recipe meals this mirrors the recipe's name. */
  recipeName: string;
  /** Set only for library recipes; absent on custom built meals. */
  recipeId?: string;
  subtitle: string;
  /**
   * Snapshot of the ingredients at the time of planning. Editing a recipe does
   * not retroactively rewrite last week's shopping list.
   */
  ingredients: Ingredient[];
  /** Cook time as displayed, e.g. '25 min'. */
  prepTime: string;
  mealType: MealType;
  dayOfWeek: string;     // e.g. 'Monday', 'Tuesday'
  weekId: string;        // ISO week string e.g. '2024-W03' — scopes meals to a week
  createdAt: Date | null;
}

// Used when writing a new meal to Firestore — no id yet
export type NewMeal = Omit<Meal, 'id' | 'createdAt'>;

/** True when this meal came from the recipe library, so a recipe can be shown. */
export function hasRecipe(meal: Meal): boolean {
  return !!meal.recipeId;
}

/**
 * Reads a Firestore document into a Meal. Pre-redesign meals stored only
 * `recipeName`, so the added fields fall back to empty — such a meal still
 * displays and can be cleared, it just contributes nothing to the shopping list
 * until it is re-picked.
 */
export function normalizeMeal(id: string, data: Record<string, any>): Meal {
  return {
    id,
    familyId: data.familyId ?? '',
    recipeName: data.recipeName ?? '',
    recipeId: data.recipeId ?? undefined,
    subtitle: data.subtitle ?? '',
    ingredients: Array.isArray(data.ingredients)
      ? data.ingredients.filter(
          (i: unknown): i is Ingredient =>
            !!i && typeof (i as Ingredient).name === 'string'
        )
      : [],
    prepTime: data.prepTime ?? '',
    mealType: (data.mealType ?? 'dinner') as MealType,
    dayOfWeek: data.dayOfWeek ?? '',
    weekId: data.weekId ?? '',
    createdAt: data.createdAt?.toDate?.() ?? null,
  };
}

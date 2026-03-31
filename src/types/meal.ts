// Meal types for the Family Meal Planner
// All Firestore documents that relate to meal planning use these shapes.

export type MealType = 'lunch' | 'dinner';

export interface Meal {
  id: string;
  familyId: string;
  recipeName: string;    // Free text for now — will link to Recipe doc in Sprint 3
  mealType: MealType;
  dayOfWeek: string;     // e.g. 'Monday', 'Tuesday'
  weekId: string;        // ISO week string e.g. '2024-W03' — scopes meals to a week
  createdAt: Date | null;
}

// Used when writing a new meal to Firestore — no id yet
export type NewMeal = Omit<Meal, 'id' | 'createdAt'>;
// Recipe types for the Family Meal Planner

export interface Recipe {
  id: string;
  familyId: string;
  name: string;
  ingredients: string[];
  isKetoFriendly: boolean;
  createdAt: Date | null;
  createdBy: string;
}

// Used when writing a new recipe to Firestore — no id or createdAt yet
export type NewRecipe = Omit<Recipe, 'id' | 'createdAt'>;
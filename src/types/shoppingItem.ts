// Shopping list item types for the Family Meal Planner

export type GroceryCategory =
  | 'Produce'
  | 'Meat & Seafood'
  | 'Dairy & Eggs'
  | 'Pantry'
  | 'Frozen'
  | 'Other';

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry',
  'Frozen',
  'Other',
];

export interface ShoppingItem {
  id: string;
  familyId: string;
  name: string;
  category: GroceryCategory;
  isChecked: boolean;
  isManual: boolean;   // true = manually added, false = auto-generated from meal plan
  count: number;
  createdAt: Date | null;
}

export type NewShoppingItem = Omit<ShoppingItem, 'id' | 'createdAt'>;
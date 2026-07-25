// Shopping list item types for the Family Meal Planner.

/**
 * Grocery aisles, in the order the design walks the store.
 *
 * The shipped union is preserved so existing Firestore documents stay valid;
 * 'Bakery' is added because the design groups bread separately from Pantry.
 */
export type GroceryCategory =
  | 'Produce'
  | 'Meat & Seafood'
  | 'Dairy & Eggs'
  | 'Pantry'
  | 'Bakery'
  | 'Frozen'
  | 'Other';

/** Aisle display order on the List tab. Manual items sort after all of these. */
export const GROCERY_CATEGORIES: GroceryCategory[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry',
  'Bakery',
  'Frozen',
  'Other',
];

/** Header shown above manually added items, which ignore their aisle. */
export const MANUAL_GROUP_LABEL = 'Added by you';

export interface Quantity {
  amount: number;
  /** '' for countable things ('3 bananas'), otherwise 'lb', 'oz', 'cup', … */
  unit: string;
}

export interface ShoppingItem {
  id: string;
  familyId: string;
  name: string;
  category: GroceryCategory;
  quantity: Quantity;
  isChecked: boolean;
  /** Marked "have at home" — stays on the list but drops out of the to-buy count. */
  isPantry: boolean;
  /** true = manually added, false = derived from the meal plan */
  isManual: boolean;
  /**
   * Days this ingredient was pulled from, e.g. ['Monday', 'Wednesday'].
   * Empty for manual items — the design shows those as "added".
   */
  days: string[];
  /** Retained for provenance: how many planned meals contributed to this line. */
  count: number;
  createdAt: Date | null;
}

export type NewShoppingItem = Omit<ShoppingItem, 'id' | 'createdAt'>;

/**
 * The identity of an auto-generated line: same name, same unit → one row whose
 * amounts sum. Case- and whitespace-insensitive so 'Olive oil' and 'olive oil'
 * from two different recipes don't split into two rows.
 */
export function itemKey(name: string, unit: string): string {
  return `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`;
}

/**
 * Reads a Firestore document into a ShoppingItem, filling in the fields added
 * by this redesign so pre-existing lists keep working.
 */
export function normalizeShoppingItem(
  id: string,
  data: Record<string, any>
): ShoppingItem {
  return {
    id,
    familyId: data.familyId ?? '',
    name: data.name ?? '',
    category: (data.category ?? 'Other') as GroceryCategory,
    quantity: {
      amount: typeof data.quantity?.amount === 'number' ? data.quantity.amount : 0,
      unit: typeof data.quantity?.unit === 'string' ? data.quantity.unit : '',
    },
    isChecked: data.isChecked === true,
    isPantry: data.isPantry === true,
    isManual: data.isManual === true,
    days: Array.isArray(data.days)
      ? data.days.filter((d: unknown): d is string => typeof d === 'string')
      : [],
    count: typeof data.count === 'number' ? data.count : 1,
    createdAt: data.createdAt?.toDate?.() ?? null,
  };
}

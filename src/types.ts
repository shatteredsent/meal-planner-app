/**
 * Every shape the app stores or renders. One file, because there isn't much.
 *
 * Firestore layout:
 *   users/{uid}                          -> { familyId }
 *   families/{familyId}                  -> { name, members: uid[], cookbookId }
 *   families/{familyId}/weeks/{weekId}   -> Week
 *   cookbooks/{cookbookId}               -> { name, families: familyId[] }
 *   cookbooks/{cookbookId}/recipes/{id}  -> Recipe
 *
 * Both document ids double as the code you share to join, so neither an invite
 * collection nor a server is needed.
 *
 * Recipes live in a cookbook rather than in a family, because several families
 * can cook from the same library while each plans its own week and shops its
 * own list. A family points at exactly one cookbook.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type Day = (typeof DAYS)[number];

/** 21 slots a week. */
export const TOTAL_SLOTS = DAYS.length * MEAL_TYPES.length;

/**
 * A slot's key inside the week document's `meals` map.
 *
 * Underscore rather than hyphen on purpose: these become Firestore field paths
 * (`meals.Monday_dinner`), and a hyphen there needs quoting.
 */
export function slotKey(day: string, mealType: MealType): string {
  return `${day}_${mealType}`;
}

/** The day a slot key belongs to. */
export function dayOfSlot(key: string): string {
  return key.split('_')[0] ?? '';
}

// ─── Groceries ──────────────────────────────────────────────────────

/** Aisles, in the order you walk the store. */
export const CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry',
  'Bakery',
  'Frozen',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Ingredient {
  name: string;
  amount: number;
  /** '' for countable things — '3 bananas', not '3 ea bananas'. */
  unit: string;
  category: Category;
}

// ─── Meals and recipes ──────────────────────────────────────────────

/**
 * A filled slot. Always carries its own name and ingredient snapshot, so the
 * shopping list never has to resolve a recipe, and editing a recipe doesn't
 * rewrite a week you already shopped for.
 *
 * `recipeId` is set only when the meal came from the library.
 */
export interface Meal {
  name: string;
  subtitle: string;
  /** As displayed: '25 min'. */
  prepTime: string;
  ingredients: Ingredient[];
  recipeId?: string;
}

export interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  prepTime: string;
  servings: number;
  mealType: MealType;
  ingredients: Ingredient[];
  steps: string[];
}

/** A recipe on its way to Firestore — no id yet. */
export type NewRecipe = Omit<Recipe, 'id'>;

/**
 * A recipe library shared by one or more families.
 *
 * `families` holds family ids, not uids, so that everyone in a family sees the
 * same library — including someone who joins the family later, without having
 * to be added here as well.
 */
export interface Cookbook {
  name: string;
  families: string[];
}

// ─── The week ───────────────────────────────────────────────────────

/**
 * Something typed onto the list by hand rather than derived from the plan.
 *
 * `inAisle` records where you chose to put it: added from an aisle's + button it
 * sits in that aisle alongside the planned items, and added from the list's own
 * add block it collects under "Added by you" at the end. Where it lands is your
 * choice, not a guess.
 */
export interface Extra {
  name: string;
  category: Category;
  /** 0 when you didn't give one — the row then shows just the name. */
  amount: number;
  unit: string;
  inAisle: boolean;
}

/**
 * One document per family per week — the plan and the list's mutable state.
 *
 * The shopping list itself is *not* stored: it is derived from `meals` on every
 * render (see lib/shoppingList.ts). Only what the plan can't know is kept here —
 * which lines are ticked, which you already have, and what you added by hand.
 */
export interface Week {
  meals: Record<string, Meal>;
  /** Line keys that are in the cart. */
  checked: string[];
  /** Line keys marked "have at home". */
  pantry: string[];
  extras: Extra[];
}

export const EMPTY_WEEK: Week = { meals: {}, checked: [], pantry: [], extras: [] };

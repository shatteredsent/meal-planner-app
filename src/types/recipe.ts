// Recipe types for the Family Meal Planner.
import { GroceryCategory } from './shoppingItem';
import { MealType } from './meal';
import { categorizeIngredient } from '../utils/categorize';

/**
 * A quantified ingredient. `amount` + `unit` are what the shopping list sums,
 * `category` is the aisle it lands in.
 */
export interface Ingredient {
  name: string;
  amount: number;
  /** '' for countable things — '3 bananas', not '3 ea bananas'. */
  unit: string;
  category: GroceryCategory;
}

/**
 * Which builder option each part of a recipe corresponds to, where it maps
 * cleanly. Used only to prefill the builder from "Swap the parts around" —
 * recipes without a mapping simply open the builder empty.
 */
export interface RecipeParts {
  protein?: string;
  veg?: string;
  base?: string;
  finish?: string;
}

export interface Recipe {
  id: string;
  familyId: string;
  name: string;
  /** One-line description shown under the name in the picker and Plan tab. */
  subtitle: string;
  ingredients: Ingredient[];
  /** Human-readable, as displayed: '25 min', '1 hr'. */
  prepTime: string;
  servings: number;
  steps: string[];
  /** Which slot this recipe belongs to. Drives what the picker offers. */
  mealType: MealType;
  parts?: RecipeParts;
  /** Finished-dish photograph. The design requires pure black and white. */
  photoUrl?: string;
  isKetoFriendly: boolean;
  createdAt: Date | null;
  createdBy: string;
}

// Used when writing a new recipe to Firestore — no id or createdAt yet
export type NewRecipe = Omit<Recipe, 'id' | 'createdAt'>;

/**
 * Parses a legacy free-text ingredient ('2 lb chicken thighs', '½ cup farro')
 * into the structured shape. Best effort: anything it can't read becomes a
 * zero-amount, unitless line, which renders as just the name.
 */
const UNITS = [
  'lb', 'lbs', 'oz', 'cup', 'cups', 'tbsp', 'tsp', 'clove', 'cloves',
  'bunch', 'bunches', 'head', 'heads', 'slice', 'slices', 'pint', 'pints',
  'can', 'cans', 'package', 'packages', 'pkg', 'g', 'kg', 'ml', 'l', 'qt',
];

const FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67, '⅛': 0.125,
};

export function parseIngredientText(raw: string): Omit<Ingredient, 'category'> {
  const text = raw.trim();

  // Leading amount: '2', '1.5', '1/2', '½', '1½'
  const match = /^(\d+\s*\/\s*\d+|\d*\.?\d+|[½¼¾⅓⅔⅛])\s*([½¼¾⅓⅔⅛])?\s*(.*)$/.exec(text);
  if (!match) return { name: text, amount: 0, unit: '' };

  const [, head, trailingFraction, rest] = match;

  let amount: number;
  if (FRACTIONS[head] !== undefined) {
    amount = FRACTIONS[head];
  } else if (head.includes('/')) {
    const [n, d] = head.split('/').map((s) => Number(s.trim()));
    amount = d ? n / d : 0;
  } else {
    amount = Number(head);
  }
  if (trailingFraction) amount += FRACTIONS[trailingFraction] ?? 0;
  if (!Number.isFinite(amount)) return { name: text, amount: 0, unit: '' };

  // Optional unit word immediately after the amount
  const words = rest.trim().split(/\s+/);
  const maybeUnit = (words[0] ?? '').toLowerCase().replace(/\.$/, '');
  const hasUnit = UNITS.includes(maybeUnit);

  const unit = hasUnit ? maybeUnit.replace(/s$/, '') : '';
  const name = (hasUnit ? words.slice(1) : words).join(' ').trim();

  // '2 chicken' with no unit is fine; '2' with nothing after it is not.
  if (!name) return { name: text, amount: 0, unit: '' };

  return { name, amount, unit };
}

/** Coerces one ingredient entry — legacy string or structured object — to shape. */
function normalizeIngredient(raw: unknown): Ingredient | null {
  if (typeof raw === 'string') {
    if (!raw.trim()) return null;
    const parsed = parseIngredientText(raw);
    return { ...parsed, category: categorizeIngredient(parsed.name) };
  }

  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, any>;
    if (typeof o.name !== 'string' || !o.name.trim()) return null;
    return {
      name: o.name,
      amount: typeof o.amount === 'number' ? o.amount : 0,
      unit: typeof o.unit === 'string' ? o.unit : '',
      category: (o.category ?? categorizeIngredient(o.name)) as GroceryCategory,
    };
  }

  return null;
}

/**
 * Reads a Firestore document into a Recipe.
 *
 * Deliberately tolerant: recipes written before this redesign stored
 * `ingredients` as `string[]` and had no prepTime / servings / steps. Those are
 * parsed and defaulted here rather than migrated, so nothing in the library
 * breaks and old recipes stay usable (just without reliable quantities).
 */
export function normalizeRecipe(id: string, data: Record<string, any>): Recipe {
  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients
        .map(normalizeIngredient)
        .filter((i: Ingredient | null): i is Ingredient => i !== null)
    : [];

  return {
    id,
    familyId: data.familyId ?? '',
    name: data.name ?? '',
    subtitle: data.subtitle ?? '',
    ingredients,
    prepTime: typeof data.prepTime === 'string'
      ? data.prepTime
      // Legacy numeric prepTime was minutes.
      : typeof data.prepTime === 'number'
        ? `${data.prepTime} min`
        : '',
    servings: typeof data.servings === 'number' ? data.servings : 4,
    steps: Array.isArray(data.steps)
      ? data.steps.filter((s: unknown): s is string => typeof s === 'string')
      : [],
    mealType: (data.mealType ?? 'dinner') as MealType,
    parts: data.parts ?? undefined,
    photoUrl: data.photoUrl ?? undefined,
    isKetoFriendly: data.isKetoFriendly === true,
    createdAt: data.createdAt?.toDate?.() ?? null,
    createdBy: data.createdBy ?? '',
  };
}

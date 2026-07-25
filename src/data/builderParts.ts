/**
 * Build-your-own meal parts, lifted from the prototype's `PARTS` field.
 *
 * Four groups, picked independently and all optional — a meal needs only a
 * protein or a vegetable to be saveable. Each option carries its own quantified
 * ingredients so a built meal feeds the shopping list exactly like a recipe.
 */
import { Ingredient } from '../types/recipe';

export type PartGroupKey = 'protein' | 'veg' | 'base' | 'finish';

export interface PartOption {
  id: string;
  label: string;
  ingredients: Ingredient[];
}

export interface PartGroup {
  key: PartGroupKey;
  label: string;
  options: PartOption[];
}

/** Group order in the builder, and the order names are composed in. */
export const PART_GROUP_KEYS: PartGroupKey[] = ['protein', 'veg', 'base', 'finish'];

export const PART_GROUPS: Record<PartGroupKey, PartGroup> = {
  protein: {
    key: 'protein',
    label: 'Protein',
    options: [
      { id: 'p1', label: 'Chicken thighs',  ingredients: [{ name: 'Chicken thighs',  amount: 2,   unit: 'lb', category: 'Meat & Seafood' }] },
      { id: 'p2', label: 'Ground turkey',   ingredients: [{ name: 'Ground turkey',   amount: 1.5, unit: 'lb', category: 'Meat & Seafood' }] },
      { id: 'p3', label: 'Salmon fillets',  ingredients: [{ name: 'Salmon fillets',  amount: 1.5, unit: 'lb', category: 'Meat & Seafood' }] },
      { id: 'p4', label: 'Flank steak',     ingredients: [{ name: 'Flank steak',     amount: 1.5, unit: 'lb', category: 'Meat & Seafood' }] },
      { id: 'p5', label: 'Italian sausage', ingredients: [{ name: 'Italian sausage', amount: 1,   unit: 'lb', category: 'Meat & Seafood' }] },
      { id: 'p6', label: 'White beans',     ingredients: [{ name: 'White beans',     amount: 30,  unit: 'oz', category: 'Pantry' }] },
      { id: 'p7', label: 'Tofu',            ingredients: [{ name: 'Firm tofu',       amount: 14,  unit: 'oz', category: 'Dairy & Eggs' }] },
      { id: 'p8', label: 'Eggs',            ingredients: [{ name: 'Eggs',            amount: 8,   unit: '',   category: 'Dairy & Eggs' }] },
    ],
  },
  veg: {
    key: 'veg',
    label: 'Vegetable',
    options: [
      { id: 'v1', label: 'Broccoli',         ingredients: [{ name: 'Broccoli',         amount: 1.5, unit: 'lb',    category: 'Produce' }] },
      { id: 'v2', label: 'Green beans',      ingredients: [{ name: 'Green beans',      amount: 1,   unit: 'lb',    category: 'Produce' }] },
      { id: 'v3', label: 'Carrots',          ingredients: [{ name: 'Carrots',          amount: 1,   unit: 'lb',    category: 'Produce' }] },
      { id: 'v4', label: 'Kale',             ingredients: [{ name: 'Kale',             amount: 1,   unit: 'bunch', category: 'Produce' }] },
      { id: 'v5', label: 'Zucchini',         ingredients: [{ name: 'Zucchini',         amount: 3,   unit: '',      category: 'Produce' }] },
      { id: 'v6', label: 'Bell peppers',     ingredients: [{ name: 'Bell pepper',      amount: 2,   unit: '',      category: 'Produce' }] },
      { id: 'v7', label: 'Brussels sprouts', ingredients: [{ name: 'Brussels sprouts', amount: 1.5, unit: 'lb',    category: 'Produce' }] },
      { id: 'v8', label: 'Cherry tomatoes',  ingredients: [{ name: 'Cherry tomatoes',  amount: 1,   unit: 'pint',  category: 'Produce' }] },
    ],
  },
  base: {
    key: 'base',
    label: 'Served on',
    options: [
      { id: 'x1', label: 'Jasmine rice', ingredients: [{ name: 'Jasmine rice',   amount: 2,   unit: 'cup', category: 'Pantry' }] },
      { id: 'x2', label: 'Farro',        ingredients: [{ name: 'Farro',          amount: 1.5, unit: 'cup', category: 'Pantry' }] },
      { id: 'x3', label: 'Potatoes',     ingredients: [{ name: 'Potatoes',       amount: 2,   unit: 'lb',  category: 'Produce' }] },
      { id: 'x4', label: 'Ziti',         ingredients: [{ name: 'Ziti',           amount: 1,   unit: 'lb',  category: 'Pantry' }] },
      { id: 'x5', label: 'Tortillas',    ingredients: [{ name: 'Corn tortillas', amount: 12,  unit: '',    category: 'Pantry' }] },
      { id: 'x6', label: 'Couscous',     ingredients: [{ name: 'Couscous',       amount: 1.5, unit: 'cup', category: 'Pantry' }] },
    ],
  },
  finish: {
    key: 'finish',
    label: 'Seasoning',
    options: [
      {
        id: 'f1', label: 'Lemon & herb',
        ingredients: [
          { name: 'Lemon',     amount: 2, unit: '',     category: 'Produce' },
          { name: 'Olive oil', amount: 2, unit: 'tbsp', category: 'Pantry' },
          { name: 'Oregano',   amount: 1, unit: 'tsp',  category: 'Pantry' },
        ],
      },
      {
        id: 'f2', label: 'Garlic soy glaze',
        ingredients: [
          { name: 'Soy sauce',  amount: 0.25, unit: 'cup',   category: 'Pantry' },
          { name: 'Sesame oil', amount: 1,    unit: 'tbsp',  category: 'Pantry' },
          { name: 'Garlic',     amount: 4,    unit: 'clove', category: 'Produce' },
        ],
      },
      {
        id: 'f3', label: 'Smoky paprika',
        ingredients: [
          { name: 'Smoked paprika', amount: 1, unit: 'tbsp', category: 'Pantry' },
          { name: 'Cumin',          amount: 1, unit: 'tsp',  category: 'Pantry' },
          { name: 'Olive oil',      amount: 2, unit: 'tbsp', category: 'Pantry' },
        ],
      },
      {
        id: 'f4', label: 'Parmesan & pepper',
        ingredients: [
          { name: 'Parmesan',     amount: 3, unit: 'oz',  category: 'Dairy & Eggs' },
          { name: 'Black pepper', amount: 1, unit: 'tsp', category: 'Pantry' },
        ],
      },
      {
        id: 'f5', label: 'Honey mustard',
        ingredients: [
          { name: 'Honey',  amount: 3, unit: 'tbsp', category: 'Pantry' },
          { name: 'Dijon',  amount: 2, unit: 'tbsp', category: 'Pantry' },
        ],
      },
      {
        id: 'f6', label: 'Just salt & oil',
        ingredients: [{ name: 'Olive oil', amount: 2, unit: 'tbsp', category: 'Pantry' }],
      },
    ],
  },
};

export type PartSelection = Record<PartGroupKey, string>;

export const EMPTY_SELECTION: PartSelection = {
  protein: '',
  veg: '',
  base: '',
  finish: '',
};

export function findOption(group: PartGroupKey, id: string): PartOption | undefined {
  if (!id) return undefined;
  return PART_GROUPS[group].options.find((option) => option.id === id);
}

/**
 * Composes the name and subtitle the design shows for a built meal.
 *
 * Protein and vegetable make the name ('Chicken thighs & Broccoli'); base and
 * seasoning make the subtitle ('on jasmine rice, garlic soy glaze'). With
 * neither of the first two picked the meal isn't saveable, and the placeholder
 * copy stands in.
 */
export function describeSelection(selection: PartSelection): {
  name: string;
  subtitle: string;
  isReady: boolean;
} {
  const protein = findOption('protein', selection.protein);
  const veg = findOption('veg', selection.veg);
  const base = findOption('base', selection.base);
  const finish = findOption('finish', selection.finish);

  const core = [protein, veg].filter(Boolean).map((option) => option!.label);
  const trailing = [
    base ? `on ${base.label.toLowerCase()}` : '',
    finish ? finish.label.toLowerCase() : '',
  ].filter(Boolean);

  return {
    name: core.length ? core.join(' & ') : 'Pick a protein or a vegetable',
    subtitle: trailing.length
      ? trailing.join(', ')
      : 'Add a base and a seasoning to round it out',
    isReady: core.length > 0,
  };
}

/** Every ingredient across the picked options, in group order. */
export function selectionIngredients(selection: PartSelection): Ingredient[] {
  return PART_GROUP_KEYS.flatMap(
    (key) => findOption(key, selection[key])?.ingredients ?? []
  );
}

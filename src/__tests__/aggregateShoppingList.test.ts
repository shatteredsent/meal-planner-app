import { aggregatePlan, reconcile } from '../utils/aggregateShoppingList';
import { Meal } from '../types/meal';
import { ShoppingItem, Quantity } from '../types/shoppingItem';
import { Ingredient } from '../types/recipe';

// ─── Fixtures ─────────────────────────────────────────────────────

function ingredient(
  name: string,
  amount: number,
  unit = '',
  category: Ingredient['category'] = 'Pantry'
): Ingredient {
  return { name, amount, unit, category };
}

function meal(
  id: string,
  dayOfWeek: string,
  ingredients: Ingredient[],
  mealType: Meal['mealType'] = 'dinner'
): Meal {
  return {
    id,
    familyId: 'fam1',
    recipeName: `Meal ${id}`,
    subtitle: '',
    ingredients,
    prepTime: '30 min',
    mealType,
    dayOfWeek,
    weekId: '2025-W30',
    createdAt: null,
  };
}

function item(
  id: string,
  name: string,
  quantity: Quantity,
  overrides: Partial<ShoppingItem> = {}
): ShoppingItem {
  return {
    id,
    familyId: 'fam1',
    name,
    category: 'Pantry',
    quantity,
    isChecked: false,
    isPantry: false,
    isManual: false,
    days: [],
    count: 1,
    createdAt: null,
    ...overrides,
  };
}

// ─── aggregatePlan ────────────────────────────────────────────────

describe('aggregatePlan', () => {
  it('sums the same ingredient and unit across meals into one line', () => {
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Olive oil', 2, 'tbsp')]),
      meal('b', 'Wednesday', [ingredient('Olive oil', 3, 'tbsp')]),
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      name: 'Olive oil',
      amount: 5,
      unit: 'tbsp',
      count: 2,
      days: ['Monday', 'Wednesday'],
    });
  });

  it('matches names case-insensitively so two recipes do not split a line', () => {
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Olive oil', 2, 'tbsp')]),
      meal('b', 'Tuesday', [ingredient('olive oil', 1, 'tbsp')]),
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBe(3);
  });

  it('keeps the same ingredient in different units on separate lines', () => {
    // There is no safe conversion between '2 lb potatoes' and '3 potatoes',
    // so these must not be merged.
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Potatoes', 2, 'lb', 'Produce')]),
      meal('b', 'Tuesday', [ingredient('Potatoes', 3, '', 'Produce')]),
    ]);

    expect(lines).toHaveLength(2);
    expect(lines.map((l) => l.unit).sort()).toEqual(['', 'lb']);
  });

  it('orders provenance days by the week, not by insertion', () => {
    const lines = aggregatePlan([
      meal('a', 'Saturday', [ingredient('Eggs', 2)]),
      meal('b', 'Monday', [ingredient('Eggs', 2)]),
      meal('c', 'Thursday', [ingredient('Eggs', 2)]),
    ]);

    expect(lines[0].days).toEqual(['Monday', 'Thursday', 'Saturday']);
  });

  it('lists a day once even when several of its meals need the ingredient', () => {
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Butter', 2, 'tbsp')], 'breakfast'),
      meal('b', 'Monday', [ingredient('Butter', 3, 'tbsp')], 'dinner'),
    ]);

    expect(lines[0].days).toEqual(['Monday']);
    expect(lines[0].count).toBe(2);
    expect(lines[0].amount).toBe(5);
  });

  it('rounds away floating-point drift from fractional amounts', () => {
    // 0.33 × 3 is 0.9899999999999999 in binary floating point.
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Soy sauce', 0.33, 'cup')]),
      meal('b', 'Tuesday', [ingredient('Soy sauce', 0.33, 'cup')]),
      meal('c', 'Wednesday', [ingredient('Soy sauce', 0.33, 'cup')]),
    ]);

    expect(lines[0].amount).toBe(0.99);
  });

  it('ignores ingredients with a blank name', () => {
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('  ', 1, 'cup'), ingredient('Rice', 2, 'cup')]),
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0].name).toBe('Rice');
  });

  it('returns nothing for an empty plan', () => {
    expect(aggregatePlan([])).toEqual([]);
  });
});

// ─── reconcile ────────────────────────────────────────────────────

describe('reconcile', () => {
  it('creates lines that are not on the list yet', () => {
    const lines = aggregatePlan([meal('a', 'Monday', [ingredient('Rice', 2, 'cup')])]);
    const { toCreate, toUpdate, toDeleteIds } = reconcile('fam1', lines, []);

    expect(toUpdate).toEqual([]);
    expect(toDeleteIds).toEqual([]);
    expect(toCreate).toHaveLength(1);
    expect(toCreate[0]).toMatchObject({
      familyId: 'fam1',
      name: 'Rice',
      quantity: { amount: 2, unit: 'cup' },
      isManual: false,
      isChecked: false,
      isPantry: false,
      days: ['Monday'],
    });
  });

  it('updates the amount when the plan grows, without touching checked state', () => {
    const existing = [
      item('i1', 'Rice', { amount: 2, unit: 'cup' }, { isChecked: true, days: ['Monday'] }),
    ];
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Rice', 2, 'cup')]),
      meal('b', 'Friday', [ingredient('Rice', 2, 'cup')]),
    ]);

    const { toCreate, toUpdate, toDeleteIds } = reconcile('fam1', lines, existing);

    expect(toCreate).toEqual([]);
    expect(toDeleteIds).toEqual([]);
    expect(toUpdate).toHaveLength(1);
    expect(toUpdate[0].id).toBe('i1');
    expect(toUpdate[0].changes.quantity).toEqual({ amount: 4, unit: 'cup' });
    expect(toUpdate[0].changes.days).toEqual(['Monday', 'Friday']);
    // Adding Friday's dinner must not empty the cart.
    expect(toUpdate[0].changes).not.toHaveProperty('isChecked');
  });

  it('leaves an unchanged line alone', () => {
    const existing = [
      item('i1', 'Rice', { amount: 2, unit: 'cup' }, { days: ['Monday'], count: 1 }),
    ];
    const lines = aggregatePlan([meal('a', 'Monday', [ingredient('Rice', 2, 'cup')])]);

    const plan = reconcile('fam1', lines, existing);

    expect(plan).toEqual({ toCreate: [], toUpdate: [], toDeleteIds: [] });
  });

  it('deletes derived lines whose meal is no longer planned', () => {
    const existing = [item('i1', 'Rice', { amount: 2, unit: 'cup' })];

    const { toDeleteIds } = reconcile('fam1', [], existing);

    expect(toDeleteIds).toEqual(['i1']);
  });

  it('never touches manual items', () => {
    const existing = [
      item('m1', 'Paper towels', { amount: 0, unit: '' }, { isManual: true }),
    ];

    // The plan is empty, so a derived line would be deleted here.
    const plan = reconcile('fam1', [], existing);

    expect(plan).toEqual({ toCreate: [], toUpdate: [], toDeleteIds: [] });
  });

  it('does not merge a plan line into a manual item of the same name', () => {
    // The person typed "Rice" themselves; the plan's rice is its own line so
    // clearing the week can remove one without destroying the other.
    const existing = [item('m1', 'Rice', { amount: 0, unit: 'cup' }, { isManual: true })];
    const lines = aggregatePlan([meal('a', 'Monday', [ingredient('Rice', 2, 'cup')])]);

    const { toCreate, toUpdate, toDeleteIds } = reconcile('fam1', lines, existing);

    expect(toCreate).toHaveLength(1);
    expect(toUpdate).toEqual([]);
    expect(toDeleteIds).toEqual([]);
  });

  it('preserves the at-home flag across an amount change', () => {
    const existing = [
      item('i1', 'Olive oil', { amount: 2, unit: 'tbsp' }, { isPantry: true, days: ['Monday'] }),
    ];
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Olive oil', 2, 'tbsp')]),
      meal('b', 'Tuesday', [ingredient('Olive oil', 2, 'tbsp')]),
    ]);

    const { toUpdate } = reconcile('fam1', lines, existing);

    expect(toUpdate[0].changes).not.toHaveProperty('isPantry');
  });

  it('moves a line to a new aisle when its category changes', () => {
    const existing = [
      item('i1', 'Sourdough', { amount: 4, unit: 'slice' }, {
        category: 'Pantry',
        days: ['Monday'],
      }),
    ];
    const lines = aggregatePlan([
      meal('a', 'Monday', [ingredient('Sourdough', 4, 'slice', 'Bakery')]),
    ]);

    const { toUpdate } = reconcile('fam1', lines, existing);

    expect(toUpdate[0].changes.category).toBe('Bakery');
  });
});

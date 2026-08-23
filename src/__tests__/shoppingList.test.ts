import { describe, expect, it } from 'vitest';
import {
  buildList, countLines, groupByAisle, lineKey, makeExtra, manualKey,
  MANUAL_LABEL, staleKeys, toneFor,
} from '../lib/shoppingList';
import { CATEGORIES, slotKey } from '../types';
import type { Category, Extra, Ingredient, Meal, Week } from '../types';

/** An extra as the UI would build it. */
const extra = (name: string, qty = '', category?: Category): Extra =>
  makeExtra(name, qty, category)!;

function meal(name: string, ingredients: Ingredient[]): Meal {
  return { name, subtitle: '', prepTime: '', ingredients };
}

const chicken: Ingredient = {
  name: 'Chicken thighs', amount: 2, unit: 'lb', category: 'Meat & Seafood',
};
const oil: Ingredient = {
  name: 'Olive oil', amount: 2, unit: 'tbsp', category: 'Pantry',
};

describe('buildList', () => {
  it('is empty for an empty plan', () => {
    expect(buildList({}, [])).toEqual([]);
  });

  it('sums the same ingredient across meals and records both days', () => {
    const lines = buildList(
      {
        [slotKey('Monday', 'dinner')]: meal('Roast', [chicken]),
        [slotKey('Thursday', 'dinner')]: meal('Traybake', [chicken]),
      },
      []
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBe(4);
    expect(lines[0].days).toEqual(['Monday', 'Thursday']);
  });

  it('lists days in week order regardless of insertion order', () => {
    const lines = buildList(
      {
        [slotKey('Saturday', 'dinner')]: meal('A', [oil]),
        [slotKey('Tuesday', 'lunch')]: meal('B', [oil]),
        [slotKey('Friday', 'breakfast')]: meal('C', [oil]),
      },
      []
    );

    expect(lines[0].days).toEqual(['Tuesday', 'Friday', 'Saturday']);
  });

  it('merges names that differ only by case or padding', () => {
    const lines = buildList(
      {
        [slotKey('Monday', 'dinner')]: meal('A', [oil]),
        [slotKey('Tuesday', 'dinner')]: meal('B', [{ ...oil, name: 'olive oil ' }]),
      },
      []
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBe(4);
  });

  it('keeps different units apart — there is no safe conversion', () => {
    const lines = buildList(
      {
        [slotKey('Monday', 'dinner')]: meal('A', [
          { name: 'Potatoes', amount: 2, unit: 'lb', category: 'Produce' },
        ]),
        [slotKey('Tuesday', 'dinner')]: meal('B', [
          { name: 'Potatoes', amount: 3, unit: '', category: 'Produce' },
        ]),
      },
      []
    );

    expect(lines).toHaveLength(2);
  });

  it('rounds away floating-point drift from summing thirds', () => {
    const third: Ingredient = { name: 'Cream', amount: 0.33, unit: 'cup', category: 'Dairy & Eggs' };
    const lines = buildList(
      {
        [slotKey('Monday', 'dinner')]: meal('A', [third]),
        [slotKey('Tuesday', 'dinner')]: meal('B', [third]),
        [slotKey('Wednesday', 'dinner')]: meal('C', [third]),
      },
      []
    );

    expect(lines[0].amount).toBe(0.99);
  });

  it('skips ingredients with a blank name', () => {
    const lines = buildList(
      { [slotKey('Monday', 'dinner')]: meal('A', [{ ...oil, name: '  ' }]) },
      []
    );

    expect(lines).toEqual([]);
  });

  it('tolerates a meal saved without an ingredients array', () => {
    const lines = buildList(
      { [slotKey('Monday', 'dinner')]: { name: 'Leftovers' } as Meal },
      []
    );

    expect(lines).toEqual([]);
  });

  it('adds manual extras under their own namespaced key', () => {
    const lines = buildList({}, [extra('Dish soap')]);

    expect(lines).toHaveLength(1);
    expect(lines[0].isManual).toBe(true);
    expect(lines[0].key).toBe(manualKey('Dish soap'));
    expect(lines[0].days).toEqual([]);
  });

  it('never lets a manual item collide with a planned one of the same name', () => {
    const lines = buildList(
      { [slotKey('Monday', 'dinner')]: meal('A', [oil]) },
      [extra('Olive oil')]
    );

    expect(lines).toHaveLength(2);
    expect(new Set(lines.map((l) => l.key)).size).toBe(2);
  });
});

describe('groupByAisle', () => {
  it('orders aisles as you walk the store and puts manual items last', () => {
    const lines = buildList(
      {
        [slotKey('Monday', 'dinner')]: meal('A', [
          oil,
          chicken,
          { name: 'Kale', amount: 1, unit: 'bunch', category: 'Produce' },
        ]),
      },
      [extra('Batteries')]
    );

    expect(groupByAisle(lines).map((g) => g.label)).toEqual([
      'Produce',
      'Meat & Seafood',
      'Pantry',
      'Added by you',
    ]);
  });

  it('drops empty aisles', () => {
    const groups = groupByAisle(
      buildList({ [slotKey('Monday', 'dinner')]: meal('A', [oil]) }, [])
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Pantry');
  });

  it('sorts within an aisle by name', () => {
    const lines = buildList(
      {
        [slotKey('Monday', 'dinner')]: meal('A', [
          { name: 'Zucchini', amount: 1, unit: '', category: 'Produce' },
          { name: 'Apples', amount: 1, unit: '', category: 'Produce' },
        ]),
      },
      []
    );

    expect(groupByAisle(lines)[0].lines.map((l) => l.name)).toEqual(['Apples', 'Zucchini']);
  });
});

describe('countLines', () => {
  const week = (over: Partial<Week>): Week => ({
    meals: {}, checked: [], pantry: [], extras: [], ...over,
  });

  it('counts everything as to-buy by default', () => {
    const lines = buildList({ [slotKey('Monday', 'dinner')]: meal('A', [oil, chicken]) }, []);

    expect(countLines(lines, week({}))).toEqual({ toBuy: 2, inCart: 0, atHome: 0 });
  });

  it('moves a ticked line into the cart', () => {
    const lines = buildList({ [slotKey('Monday', 'dinner')]: meal('A', [oil, chicken]) }, []);
    const counts = countLines(lines, week({ checked: [lineKey('Olive oil', 'tbsp')] }));

    expect(counts).toEqual({ toBuy: 1, inCart: 1, atHome: 0 });
  });

  it('counts an at-home line once, not in two buckets', () => {
    const lines = buildList({ [slotKey('Monday', 'dinner')]: meal('A', [oil]) }, []);
    const counts = countLines(lines, week({ pantry: [lineKey('Olive oil', 'tbsp')] }));

    expect(counts).toEqual({ toBuy: 0, inCart: 0, atHome: 1 });
    expect(counts.toBuy + counts.inCart + counts.atHome).toBe(lines.length);
  });

  it('ignores stale state for lines that are no longer planned', () => {
    const counts = countLines([], week({ checked: ['gone|lb'], pantry: ['also-gone|'] }));

    expect(counts).toEqual({ toBuy: 0, inCart: 0, atHome: 0 });
  });
});

/**
 * The pruning rule useWeek folds into every plan write: state belonging to lines
 * the next plan no longer produces is dropped, so re-planning an ingredient
 * never shows it already ticked.
 */
describe('staleKeys', () => {
  it('drops the state of a line the new plan no longer produces', () => {
    const held = [lineKey('Chicken thighs', 'lb')];

    expect(staleKeys({}, [], held)).toEqual(held);
  });

  it('keeps the state of a line that survives the change', () => {
    const next = { [slotKey('Friday', 'dinner')]: meal('Roast', [chicken]) };

    expect(staleKeys(next, [], [lineKey('Chicken thighs', 'lb')])).toEqual([]);
  });

  it('keeps a manual line ticked when the plan changes around it', () => {
    const held = [manualKey('Dish soap')];
    const extras: Week['extras'] = [extra('Dish soap')];

    expect(staleKeys({}, extras, held)).toEqual([]);
  });

  it('drops only the lines that actually went', () => {
    const before = [lineKey('Chicken thighs', 'lb'), lineKey('Olive oil', 'tbsp')];
    const next = { [slotKey('Monday', 'dinner')]: meal('Salad', [oil]) };

    expect(staleKeys(next, [], before)).toEqual([lineKey('Chicken thighs', 'lb')]);
  });
});


describe('makeExtra', () => {
  it('returns null when there is nothing to add', () => {
    expect(makeExtra('')).toBeNull();
    expect(makeExtra('   ')).toBeNull();
  });

  it('takes a bare name with no quantity', () => {
    expect(makeExtra('Paper towels')).toEqual({
      name: 'Paper towels', amount: 0, unit: '', category: 'Other', inAisle: false,
    });
  });

  it('reads a quantity from its own field', () => {
    expect(makeExtra('Paper towels', '2')).toMatchObject({ amount: 2, unit: '' });
    expect(makeExtra('Milk', '1 qt')).toMatchObject({ amount: 1, unit: 'qt' });
  });

  it('reads a quantity embedded in the name, because that is how people type', () => {
    expect(makeExtra('2 lb ground beef')).toMatchObject({
      name: 'ground beef', amount: 2, unit: 'lb', category: 'Meat & Seafood',
    });
  });

  it('lets the quantity field win over one embedded in the name', () => {
    expect(makeExtra('2 lb ground beef', '3 lb')).toMatchObject({ amount: 3, unit: 'lb' });
  });

  it('guesses the aisle but does not place the item in it', () => {
    const e = makeExtra('Bananas')!;
    expect(e.category).toBe('Produce');
    expect(e.inAisle).toBe(false);
  });

  it('places the item when an aisle is named, overriding the guess', () => {
    const e = makeExtra('Bananas', '', 'Frozen')!;
    expect(e.category).toBe('Frozen');
    expect(e.inAisle).toBe(true);
  });

  it('understands hand-written units like pack and box', () => {
    expect(makeExtra('Tissues', '2 packs')).toMatchObject({ amount: 2, unit: 'pack' });
    expect(makeExtra('Cereal', '1 box')).toMatchObject({ amount: 1, unit: 'box' });
  });

  it('ignores an unreadable quantity rather than failing', () => {
    expect(makeExtra('Paper towels', 'a few')).toMatchObject({ amount: 0, unit: '' });
  });
});

describe('placing extras in aisles', () => {
  it('shows an aisle-placed extra inside that aisle', () => {
    const groups = groupByAisle(buildList({}, [extra('Bell pepper', '2', 'Produce')]));

    expect(groups.map((g) => g.label)).toEqual(['Produce']);
    expect(groups[0].lines[0].name).toBe('Bell pepper');
  });

  it('keeps an unplaced extra under its own header', () => {
    const groups = groupByAisle(buildList({}, [extra('Bananas')]));

    expect(groups.map((g) => g.label)).toEqual(['Added by you']);
  });

  it('sorts an aisle-placed extra alongside the planned items', () => {
    const lines = buildList(
      {
        [slotKey('Monday', 'dinner')]: meal('A', [
          { name: 'Zucchini', amount: 1, unit: '', category: 'Produce' },
        ]),
      },
      [extra('Apples', '3', 'Produce')]
    );
    const produce = groupByAisle(lines).find((g) => g.label === 'Produce')!;

    expect(produce.lines.map((l) => l.name)).toEqual(['Apples', 'Zucchini']);
  });

  it('shows a quantity on an aisle-placed extra', () => {
    const line = buildList({}, [extra('Bell pepper', '2', 'Produce')])[0];

    expect(line.amount).toBe(2);
    expect(line.isManual).toBe(true);
  });

  it('defaults an extra saved before quantities existed', () => {
    const legacy = { name: 'Dish soap', category: 'Other' } as Extra;
    const line = buildList({}, [legacy])[0];

    expect(line.amount).toBe(0);
    expect(line.unit).toBe('');
    expect(line.inAisle).toBe(false);
  });
});

describe('toneFor', () => {
  it('gives every aisle its own tone', () => {
    const tones = CATEGORIES.map(toneFor);
    expect(new Set(tones).size).toBe(CATEGORIES.length);
  });

  it('gives the manual group its own tone too', () => {
    expect(toneFor(MANUAL_LABEL)).toBe('added');
    expect(CATEGORIES.map(toneFor)).not.toContain('added');
  });

  it('falls back rather than returning nothing for an unknown label', () => {
    expect(toneFor('Nonsense')).toBe('other');
  });
});

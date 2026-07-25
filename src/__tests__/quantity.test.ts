import { formatAmount, formatQuantity, formatProvenance } from '../utils/quantity';
import { parseIngredientText, normalizeRecipe } from '../types/recipe';

describe('formatAmount', () => {
  it('writes whole numbers plainly', () => {
    expect(formatAmount(3)).toBe('3');
    expect(formatAmount(28)).toBe('28');
  });

  it('uses fraction glyphs the way a recipe card would', () => {
    expect(formatAmount(0.5)).toBe('½');
    expect(formatAmount(0.25)).toBe('¼');
    expect(formatAmount(0.75)).toBe('¾');
    expect(formatAmount(0.33)).toBe('⅓');
    expect(formatAmount(0.67)).toBe('⅔');
  });

  it('combines a whole part with a fraction', () => {
    expect(formatAmount(1.5)).toBe('1½');
    expect(formatAmount(2.25)).toBe('2¼');
  });

  it('falls back to a decimal for amounts with no glyph', () => {
    expect(formatAmount(1.4)).toBe('1.4');
  });
});

describe('formatQuantity', () => {
  it('appends the unit when there is one', () => {
    expect(formatQuantity({ amount: 1.5, unit: 'lb' })).toBe('1½ lb');
  });

  it('omits the unit for countable things', () => {
    expect(formatQuantity({ amount: 3, unit: '' })).toBe('3');
  });

  it('renders nothing when there is no amount', () => {
    // Manual items have no quantity; the row shows just the name.
    expect(formatQuantity({ amount: 0, unit: '' })).toBe('');
  });
});

describe('formatProvenance', () => {
  it('abbreviates the days an ingredient came from', () => {
    expect(formatProvenance(['Monday', 'Wednesday'])).toBe('Mon Wed');
  });

  it('reads "added" for manual items with no days', () => {
    expect(formatProvenance([])).toBe('added');
  });
});

describe('parseIngredientText', () => {
  it('splits an amount, unit and name', () => {
    expect(parseIngredientText('2 lb chicken thighs')).toEqual({
      amount: 2,
      unit: 'lb',
      name: 'chicken thighs',
    });
  });

  it('singularises the unit so lines match across recipes', () => {
    expect(parseIngredientText('3 cups farro')).toEqual({
      amount: 3,
      unit: 'cup',
      name: 'farro',
    });
  });

  it('reads decimals and vulgar fractions', () => {
    expect(parseIngredientText('1.5 cup milk')).toMatchObject({ amount: 1.5 });
    expect(parseIngredientText('½ cup honey')).toMatchObject({ amount: 0.5 });
    expect(parseIngredientText('1½ lb salmon')).toMatchObject({ amount: 1.5 });
    expect(parseIngredientText('1/2 cup soy sauce')).toMatchObject({ amount: 0.5 });
  });

  it('leaves the unit empty for countable things', () => {
    expect(parseIngredientText('3 bananas')).toEqual({
      amount: 3,
      unit: '',
      name: 'bananas',
    });
  });

  it('treats an unparseable line as a bare name', () => {
    expect(parseIngredientText('Salt to taste')).toEqual({
      amount: 0,
      unit: '',
      name: 'Salt to taste',
    });
  });

  it('does not swallow the name when only a number is given', () => {
    expect(parseIngredientText('12')).toEqual({ amount: 0, unit: '', name: '12' });
  });
});

describe('normalizeRecipe', () => {
  it('reads a pre-redesign recipe with string ingredients', () => {
    // Recipes written before this redesign are not migrated — they are parsed on
    // read, so an untouched library still works.
    const recipe = normalizeRecipe('r1', {
      familyId: 'fam1',
      name: 'Old Recipe',
      ingredients: ['2 lb chicken thighs', '1 bunch kale'],
      isKetoFriendly: true,
      createdBy: 'u1',
    });

    expect(recipe.ingredients).toEqual([
      { name: 'chicken thighs', amount: 2, unit: 'lb', category: 'Meat & Seafood' },
      { name: 'kale', amount: 1, unit: 'bunch', category: 'Produce' },
    ]);
    // Fields the old shape lacked get usable defaults rather than undefined.
    expect(recipe.mealType).toBe('dinner');
    expect(recipe.servings).toBe(4);
    expect(recipe.steps).toEqual([]);
    expect(recipe.prepTime).toBe('');
    expect(recipe.isKetoFriendly).toBe(true);
  });

  it('passes a structured recipe through untouched', () => {
    const recipe = normalizeRecipe('r2', {
      familyId: 'fam1',
      name: 'New Recipe',
      subtitle: 'Fast.',
      mealType: 'lunch',
      prepTime: '20 min',
      servings: 6,
      ingredients: [{ name: 'Farro', amount: 1.5, unit: 'cup', category: 'Pantry' }],
      steps: ['Boil it.'],
      createdBy: 'u1',
    });

    expect(recipe.ingredients).toEqual([
      { name: 'Farro', amount: 1.5, unit: 'cup', category: 'Pantry' },
    ]);
    expect(recipe.mealType).toBe('lunch');
    expect(recipe.servings).toBe(6);
    expect(recipe.steps).toEqual(['Boil it.']);
  });

  it('converts a legacy numeric prepTime to minutes', () => {
    const recipe = normalizeRecipe('r3', { name: 'X', prepTime: 25, ingredients: [] });
    expect(recipe.prepTime).toBe('25 min');
  });

  it('drops blank and malformed ingredient entries', () => {
    const recipe = normalizeRecipe('r4', {
      name: 'X',
      ingredients: ['', '   ', null, 42, { amount: 2 }, 'Rice'],
    });

    expect(recipe.ingredients.map((i) => i.name)).toEqual(['Rice']);
  });
});

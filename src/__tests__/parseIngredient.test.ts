import { describe, expect, it } from 'vitest';
import { parseIngredient, parseIngredientLines, parseQuantity } from '../lib/parseIngredient';

describe('parseIngredient', () => {
  it('reads a whole amount and a unit', () => {
    expect(parseIngredient('2 lb chicken thighs')).toEqual({
      name: 'chicken thighs', amount: 2, unit: 'lb', category: 'Meat & Seafood',
    });
  });

  it('singularises the unit so lb and lbs sum together', () => {
    expect(parseIngredient('3 lbs potatoes').unit).toBe('lb');
    expect(parseIngredient('2 cups farro').unit).toBe('cup');
  });

  it('reads a fraction glyph', () => {
    const parsed = parseIngredient('½ cup farro');
    expect(parsed.amount).toBe(0.5);
    expect(parsed.name).toBe('farro');
  });

  it('reads a mixed number written with a glyph', () => {
    expect(parseIngredient('1½ lb kale').amount).toBe(1.5);
  });

  it('reads a written fraction', () => {
    expect(parseIngredient('1/2 cup rice').amount).toBe(0.5);
  });

  it('reads a decimal', () => {
    expect(parseIngredient('1.5 lb salmon').amount).toBe(1.5);
  });

  it('treats a countable amount as unitless', () => {
    expect(parseIngredient('3 bananas')).toEqual({
      name: 'bananas', amount: 3, unit: '', category: 'Produce',
    });
  });

  it('handles a name with no amount at all', () => {
    expect(parseIngredient('olive oil')).toEqual({
      name: 'olive oil', amount: 0, unit: '', category: 'Pantry',
    });
  });

  it('keeps the raw text when there is an amount but no name', () => {
    expect(parseIngredient('2')).toEqual({
      name: '2', amount: 0, unit: '', category: 'Other',
    });
  });

  it('categorises from the name, not the whole line', () => {
    expect(parseIngredient('1 loaf sourdough').category).toBe('Bakery');
    expect(parseIngredient('1 lb frozen green beans').category).toBe('Frozen');
  });

  it('trims surrounding whitespace', () => {
    expect(parseIngredient('  2 lb beef  ').name).toBe('beef');
  });
});

describe('parseIngredientLines', () => {
  it('parses each line and skips blanks', () => {
    const parsed = parseIngredientLines('2 lb beef\n\n  \n1 bunch kale\n');

    expect(parsed.map((i) => i.name)).toEqual(['beef', 'kale']);
  });

  it('is empty for empty input', () => {
    expect(parseIngredientLines('')).toEqual([]);
    expect(parseIngredientLines('\n \n')).toEqual([]);
  });
});

describe('parseQuantity', () => {
  it('reads a bare number', () => {
    expect(parseQuantity('2')).toEqual({ amount: 2, unit: '' });
  });

  it('reads a number and a unit', () => {
    expect(parseQuantity('1 lb')).toEqual({ amount: 1, unit: 'lb' });
    expect(parseQuantity('2 cups')).toEqual({ amount: 2, unit: 'cup' });
  });

  it('reads fractions', () => {
    expect(parseQuantity('½ cup')).toEqual({ amount: 0.5, unit: 'cup' });
    expect(parseQuantity('1½ lb')).toEqual({ amount: 1.5, unit: 'lb' });
  });

  it('is no quantity at all when blank or unreadable', () => {
    expect(parseQuantity('')).toEqual({ amount: 0, unit: '' });
    expect(parseQuantity('   ')).toEqual({ amount: 0, unit: '' });
    expect(parseQuantity('a few')).toEqual({ amount: 0, unit: '' });
  });

  it('drops a trailing word that is not a unit', () => {
    expect(parseQuantity('3 bananas')).toEqual({ amount: 3, unit: '' });
  });
});

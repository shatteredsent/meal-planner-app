import { describe, expect, it } from 'vitest';
import { parseIngredient, parseIngredientLines } from '../lib/parseIngredient';

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

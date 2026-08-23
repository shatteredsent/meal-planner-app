import { describe, expect, it } from 'vitest';
import { formatAmount, formatDays, formatQuantity } from '../lib/quantity';

describe('formatAmount', () => {
  it('leaves whole numbers alone', () => {
    expect(formatAmount(2)).toBe('2');
    expect(formatAmount(12)).toBe('12');
  });

  it('writes common fractions as glyphs', () => {
    expect(formatAmount(0.5)).toBe('½');
    expect(formatAmount(0.25)).toBe('¼');
    expect(formatAmount(0.75)).toBe('¾');
    expect(formatAmount(0.33)).toBe('⅓');
    expect(formatAmount(0.67)).toBe('⅔');
  });

  it('writes mixed numbers as a whole plus a glyph', () => {
    expect(formatAmount(1.5)).toBe('1½');
    expect(formatAmount(2.25)).toBe('2¼');
  });

  it('falls back to a decimal when no glyph fits', () => {
    expect(formatAmount(1.4)).toBe('1.4');
  });

  it('does not leave floating-point noise on screen', () => {
    expect(formatAmount(0.30000000000000004)).toBe('0.3');
  });
});

describe('formatQuantity', () => {
  it('joins amount and unit', () => {
    expect(formatQuantity(1.5, 'lb')).toBe('1½ lb');
  });

  it('omits the unit for countable things', () => {
    expect(formatQuantity(3, '')).toBe('3');
  });

  it('is blank when there is no amount, so the row shows just a name', () => {
    expect(formatQuantity(0, 'lb')).toBe('');
    expect(formatQuantity(0, '')).toBe('');
  });
});

describe('formatDays', () => {
  it('abbreviates to three letters', () => {
    expect(formatDays(['Monday', 'Wednesday'])).toBe('Mon Wed');
  });

  it('reads "added" for a hand-typed line', () => {
    expect(formatDays([])).toBe('added');
  });
});

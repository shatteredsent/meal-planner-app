/**
 * Turns what a person types — '2 lb chicken thighs', '½ cup farro', 'olive oil'
 * — into a quantified ingredient.
 *
 * This is an *input* helper, used by the recipe form and the quick-meal field.
 * Nothing stored is ever parsed on read: quantities are structured in Firestore.
 */

import { categorize } from './categorize';
import type { Ingredient } from '../types';

const UNITS = [
  'lb', 'lbs', 'oz', 'cup', 'cups', 'tbsp', 'tsp', 'clove', 'cloves',
  'bunch', 'bunches', 'head', 'heads', 'slice', 'slices', 'pint', 'pints',
  'can', 'cans', 'package', 'packages', 'pkg', 'g', 'kg', 'ml', 'l', 'qt',
];

const FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67, '⅛': 0.125,
};

/** '2', '1.5', '1/2', '½', '1½' — followed by an optional unit, then the name. */
const LEADING_AMOUNT = /^(\d+\s*\/\s*\d+|\d*\.?\d+|[½¼¾⅓⅔⅛])\s*([½¼¾⅓⅔⅛])?\s*(.*)$/;

export function parseIngredient(raw: string): Ingredient {
  const text = raw.trim();
  const plain = (name: string): Ingredient => ({
    name,
    amount: 0,
    unit: '',
    category: categorize(name),
  });

  const match = LEADING_AMOUNT.exec(text);
  if (!match) return plain(text);

  const [, head, trailingFraction, rest] = match;

  let amount: number;
  if (FRACTIONS[head] !== undefined) {
    amount = FRACTIONS[head];
  } else if (head.includes('/')) {
    const [numerator, denominator] = head.split('/').map((s) => Number(s.trim()));
    amount = denominator ? numerator / denominator : 0;
  } else {
    amount = Number(head);
  }
  if (trailingFraction) amount += FRACTIONS[trailingFraction] ?? 0;
  if (!Number.isFinite(amount)) return plain(text);

  const words = rest.trim().split(/\s+/);
  const candidate = (words[0] ?? '').toLowerCase().replace(/\.$/, '');
  const hasUnit = UNITS.includes(candidate);

  const unit = hasUnit ? candidate.replace(/s$/, '') : '';
  const name = (hasUnit ? words.slice(1) : words).join(' ').trim();

  // '2 chicken' is fine; '2' on its own is not — keep the raw text instead.
  if (!name) return plain(text);

  return { name, amount, unit, category: categorize(name) };
}

/** Parses a textarea of one-ingredient-per-line, skipping blanks. */
export function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredient);
}

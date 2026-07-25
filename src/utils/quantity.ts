/**
 * Quantity display. The design writes amounts the way a recipe card does —
 * '½ cup', '1½ lb', '3' — not '0.5 cup'.
 */
import { Quantity } from '../types/shoppingItem';

const FRACTION_GLYPHS: Record<string, string> = {
  '0.5': '½',
  '0.25': '¼',
  '0.75': '¾',
  '0.33': '⅓',
  '0.67': '⅔',
  '0.13': '⅛',
};

/** 1.5 → '1½'; 0.33 → '⅓'; 2 → '2'; 1.4 → '1.4' */
export function formatAmount(amount: number): string {
  const whole = Math.floor(amount);
  const fraction = Number((amount - whole).toFixed(2));
  const glyph = FRACTION_GLYPHS[String(fraction)];

  if (!glyph) return String(Number(amount.toFixed(2)));
  return (whole ? String(whole) : '') + glyph;
}

/** '1½ lb'; '3'; '' when there is no amount to show. */
export function formatQuantity(quantity: Quantity): string {
  if (!quantity.amount) return '';
  return formatAmount(quantity.amount) + (quantity.unit ? ` ${quantity.unit}` : '');
}

/**
 * Abbreviates day names for the provenance column — 'Monday' → 'Mon'.
 * Manual items have no days and read 'added' instead.
 */
export function formatProvenance(days: string[]): string {
  if (days.length === 0) return 'added';
  return days.map((d) => d.slice(0, 3)).join(' ');
}

/**
 * The shopping list, derived from the meal plan.
 *
 * Nothing here is stored. The list is recomputed from `week.meals` on every
 * render, which is why there is no reconciler, no plan fingerprint, no
 * re-entrancy guard and no create/update/delete diff — a plan change simply
 * produces a different list next render.
 *
 * The only persisted list state is what the plan cannot know: which lines are
 * ticked, which you already have at home, and what you typed in by hand.
 */

import { CATEGORIES, dayOfSlot, DAYS } from '../types';
import type { Category, Extra, Meal, Week } from '../types';

export interface Line {
  /** Stable identity across renders — this is what `checked`/`pantry` store. */
  key: string;
  name: string;
  amount: number;
  unit: string;
  category: Category;
  /** Days that contributed, in week order. Empty for manual lines. */
  days: string[];
  isManual: boolean;
}

/**
 * Same name, same unit → one line whose amounts sum. Case- and
 * whitespace-insensitive, so 'Olive oil' and 'olive oil' from two recipes don't
 * split into two rows.
 *
 * Different units stay separate ('2 lb potatoes' and '3 potatoes'): there is no
 * safe conversion, and a shopper reconciles that better than we can.
 */
export function lineKey(name: string, unit: string): string {
  return `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`;
}

const DAY_ORDER = new Map(DAYS.map((day, index) => [day as string, index]));

export function buildList(meals: Record<string, Meal>, extras: Extra[]): Line[] {
  const byKey = new Map<string, Line>();

  for (const [slot, meal] of Object.entries(meals)) {
    const day = dayOfSlot(slot);

    for (const ingredient of meal.ingredients ?? []) {
      if (!ingredient.name?.trim()) continue;

      const key = lineKey(ingredient.name, ingredient.unit);
      const existing = byKey.get(key);

      if (existing) {
        existing.amount += ingredient.amount;
        if (day && !existing.days.includes(day)) existing.days.push(day);
      } else {
        byKey.set(key, {
          key,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          category: ingredient.category,
          days: day ? [day] : [],
          isManual: false,
        });
      }
    }
  }

  for (const line of byKey.values()) {
    line.days.sort((a, b) => (DAY_ORDER.get(a) ?? 99) - (DAY_ORDER.get(b) ?? 99));
    // Summing thirds and eighths would otherwise surface as '1.9800000000000002 cup'.
    line.amount = Number(line.amount.toFixed(2));
  }

  for (const extra of extras) {
    if (!extra.name?.trim()) continue;
    byKey.set(manualKey(extra.name), {
      key: manualKey(extra.name),
      name: extra.name,
      amount: 0,
      unit: '',
      category: extra.category,
      days: [],
      isManual: true,
    });
  }

  return [...byKey.values()];
}

/** Manual lines are namespaced so typing 'Milk' never collides with a planned one. */
export function manualKey(name: string): string {
  return `manual|${name.toLowerCase().trim()}`;
}

export interface Group {
  label: string;
  lines: Line[];
}

/** Header for the manual group, which ignores aisles. */
export const MANUAL_LABEL = 'Added by you';

/**
 * Groups by aisle in walk-the-store order, with hand-typed items collected at
 * the end under their own header so what you added stays where you can find it.
 */
export function groupByAisle(lines: Line[]): Group[] {
  const byName = (a: Line, b: Line) => a.name.localeCompare(b.name);

  const aisles: Group[] = CATEGORIES.map((category) => ({
    label: category,
    lines: lines.filter((l) => !l.isManual && l.category === category).sort(byName),
  }));

  const manual = lines.filter((l) => l.isManual).sort(byName);

  return [...aisles, { label: MANUAL_LABEL, lines: manual }].filter(
    (group) => group.lines.length > 0
  );
}

/**
 * Line state that a given plan no longer justifies keeping.
 *
 * Ticked / at-home state is stored per line key, so removing a meal would
 * otherwise leave its lines' state behind and re-planning the same ingredient
 * would show it already in the cart. Callers fold the result into the same write
 * that changes the plan — a pure diff, not a listener reacting to one.
 */
export function staleKeys(
  nextMeals: Record<string, Meal>,
  extras: Extra[],
  held: string[]
): string[] {
  const live = new Set(buildList(nextMeals, extras).map((line) => line.key));
  return [...new Set(held)].filter((key) => !live.has(key));
}

export interface Counts {
  toBuy: number;
  inCart: number;
  atHome: number;
}

export function countLines(lines: Line[], week: Week): Counts {
  const checked = new Set(week.checked);
  const pantry = new Set(week.pantry);

  let toBuy = 0;
  let inCart = 0;
  let atHome = 0;

  for (const line of lines) {
    if (checked.has(line.key)) inCart += 1;
    else if (pantry.has(line.key)) atHome += 1;
    else toBuy += 1;
  }

  return { toBuy, inCart, atHome };
}

/**
 * Pure aggregation of a week's meal plan into shopping-list lines, and the
 * diff that reconciles those lines against what is already in Firestore.
 *
 * Kept free of Firestore so the summing rules are directly testable — this is
 * the piece the live-reconciling list depends on being exactly right.
 */
import { Meal, DAYS_OF_WEEK } from '../types/meal';
import { ShoppingItem, NewShoppingItem, itemKey } from '../types/shoppingItem';

/** One aggregated line: an ingredient summed across every meal that needs it. */
export interface AggregatedLine {
  key: string;
  name: string;
  amount: number;
  unit: string;
  category: ShoppingItem['category'];
  /** Days that contributed, in week order. */
  days: string[];
  /** How many planned meals contributed. */
  count: number;
}

const DAY_ORDER = new Map<string, number>(
  DAYS_OF_WEEK.map((day, index) => [day, index])
);

/**
 * Sums the plan by `name|unit`.
 *
 * Same name, same unit → one line whose amounts add up. Same name, *different*
 * units ('2 lb potatoes' and '3 potatoes') stay separate lines, because there
 * is no safe conversion between them — the shopper can reconcile that better
 * than we can.
 */
export function aggregatePlan(meals: Meal[]): AggregatedLine[] {
  const lines = new Map<string, AggregatedLine>();

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      if (!ingredient.name?.trim()) continue;

      const key = itemKey(ingredient.name, ingredient.unit);
      const existing = lines.get(key);

      if (existing) {
        existing.amount += ingredient.amount;
        existing.count += 1;
        if (meal.dayOfWeek && !existing.days.includes(meal.dayOfWeek)) {
          existing.days.push(meal.dayOfWeek);
        }
      } else {
        lines.set(key, {
          key,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          category: ingredient.category,
          days: meal.dayOfWeek ? [meal.dayOfWeek] : [],
          count: 1,
        });
      }
    }
  }

  for (const line of lines.values()) {
    line.days.sort(
      (a, b) => (DAY_ORDER.get(a) ?? 99) - (DAY_ORDER.get(b) ?? 99)
    );
    // Floating-point drift from summing thirds and eighths would surface as
    // '1.9800000000000002 cup' in the UI.
    line.amount = Number(line.amount.toFixed(2));
  }

  return [...lines.values()];
}

export interface ReconcilePlan {
  /** Lines not on the list yet. */
  toCreate: NewShoppingItem[];
  /** Existing auto lines whose amount, aisle or provenance moved. */
  toUpdate: Array<{ id: string; changes: Partial<ShoppingItem> }>;
  /** Auto lines whose meal is no longer planned. */
  toDeleteIds: string[];
}

/**
 * Works out the minimal set of writes that brings the stored list in line with
 * the plan.
 *
 * Two invariants the design depends on:
 *   - **Manual items are never touched.** They were typed by a person; the plan
 *     has no opinion about them.
 *   - **`isChecked` and `isPantry` are preserved** on an existing line even as
 *     its amount changes. Adding Thursday's dinner must not uncheck what is
 *     already in the cart.
 */
export function reconcile(
  familyId: string,
  lines: AggregatedLine[],
  existing: ShoppingItem[]
): ReconcilePlan {
  const autoByKey = new Map<string, ShoppingItem>();
  for (const item of existing) {
    if (item.isManual) continue;
    autoByKey.set(itemKey(item.name, item.quantity.unit), item);
  }

  const toCreate: NewShoppingItem[] = [];
  const toUpdate: ReconcilePlan['toUpdate'] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    seen.add(line.key);
    const current = autoByKey.get(line.key);

    if (!current) {
      toCreate.push({
        familyId,
        name: line.name,
        category: line.category,
        quantity: { amount: line.amount, unit: line.unit },
        isChecked: false,
        isPantry: false,
        isManual: false,
        days: line.days,
        count: line.count,
      });
      continue;
    }

    const changes: Partial<ShoppingItem> = {};
    if (current.quantity.amount !== line.amount) {
      changes.quantity = { amount: line.amount, unit: line.unit };
    }
    if (current.category !== line.category) changes.category = line.category;
    if (current.count !== line.count) changes.count = line.count;
    if (current.days.join('|') !== line.days.join('|')) changes.days = line.days;

    if (Object.keys(changes).length > 0) {
      toUpdate.push({ id: current.id, changes });
    }
  }

  const toDeleteIds: string[] = [];
  for (const [key, item] of autoByKey) {
    if (!seen.has(key)) toDeleteIds.push(item.id);
  }

  return { toCreate, toUpdate, toDeleteIds };
}

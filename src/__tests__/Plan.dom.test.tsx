// @vitest-environment jsdom

/**
 * The Plan screen's picker, exercised through the DOM.
 *
 * Note for anyone extending this: use `fireEvent`, never `element.click()`.
 * A bare `.click()` dispatches the event but doesn't flush React's state update
 * inside `act`, so the sheet appears not to open and the test lies to you.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Plan from '../screens/Plan';
import type { WeekApi } from '../hooks/useWeek';
import type { RecipesApi } from '../hooks/useRecipes';
import { EMPTY_WEEK, slotKey } from '../types';
import { addWeeks, getWeekDates, getWeekId } from '../lib/week';
import type { Meal, Recipe } from '../types';

function weekApi(meals: Record<string, Meal> = {}): WeekApi {
  return {
    week: { ...EMPTY_WEEK, meals },
    weekId: '2026-08-17',
    isLoading: false,
    hasError: false,
    mealAt: (day, mealType) => meals[slotKey(day, mealType)],
    setMeal: vi.fn().mockResolvedValue(undefined),
    clearSlot: vi.fn().mockResolvedValue(undefined),
    copyDay: vi.fn().mockResolvedValue(undefined),
    clearWeek: vi.fn().mockResolvedValue(undefined),
    toggleChecked: vi.fn().mockResolvedValue(undefined),
    togglePantry: vi.fn().mockResolvedValue(undefined),
    addExtra: vi.fn().mockResolvedValue(undefined),
    removeExtra: vi.fn().mockResolvedValue(undefined),
  };
}

function recipesApi(recipes: Recipe[] = []): RecipesApi {
  return {
    recipes,
    isLoading: false,
    hasError: false,
    addRecipe: vi.fn().mockResolvedValue(undefined),
    deleteRecipe: vi.fn().mockResolvedValue(undefined),
  };
}

const dinner: Recipe = {
  id: 'r1',
  name: 'Adobo',
  subtitle: '',
  prepTime: '',
  servings: 4,
  mealType: 'dinner',
  ingredients: [{ name: 'Chicken thighs', amount: 0, unit: '', category: 'Meat & Seafood' }],
  steps: [],
};

const WEEK_DATES = getWeekDates(new Date(2026, 7, 26)); // Mon 24 – Sun 30 Aug

function renderPlan(
  week = weekApi(),
  recipes = recipesApi(),
  weekProps: Partial<{
    weekDates: Date[];
    weekOffset: number;
    onShiftWeek: (by: number) => void;
    onResetWeek: () => void;
  }> = {}
) {
  return render(
    <Plan
      week={week}
      recipes={recipes}
      focus={null}
      onFocusHandled={vi.fn()}
      weekDates={weekProps.weekDates ?? WEEK_DATES}
      weekOffset={weekProps.weekOffset ?? 0}
      onShiftWeek={weekProps.onShiftWeek ?? vi.fn()}
      onResetWeek={weekProps.onResetWeek ?? vi.fn()}
    />
  );
}

beforeEach(() => cleanup());

describe('Plan', () => {
  it('offers a Choose button for every empty slot', () => {
    renderPlan();

    expect(screen.getByText(/choose breakfast/i)).toBeTruthy();
    expect(screen.getByText(/choose lunch/i)).toBeTruthy();
    expect(screen.getByText(/choose dinner/i)).toBeTruthy();
  });

  it.each(['breakfast', 'lunch', 'dinner'])('opens the picker for %s', (slot) => {
    renderPlan();

    fireEvent.click(screen.getByText(new RegExp(`choose ${slot}`, 'i')));

    expect(screen.queryByText(/what are we having/i)).toBeTruthy();
    expect(document.querySelector('.sheet-scrim')).toBeTruthy();
  });

  it('names the slot it is filling, so the sheet is not ambiguous', () => {
    renderPlan();

    fireEvent.click(screen.getByText(/choose lunch/i));

    expect(screen.getByText(/· Lunch/i)).toBeTruthy();
  });

  it('offers library recipes for the slot they belong to', () => {
    renderPlan(weekApi(), recipesApi([dinner]));

    fireEvent.click(screen.getByText(/choose dinner/i));

    expect(screen.getByText('Adobo')).toBeTruthy();
  });

  it('offers no recipes for a slot none are tagged for, but still opens', () => {
    renderPlan(weekApi(), recipesApi([dinner]));

    fireEvent.click(screen.getByText(/choose breakfast/i));

    // The picker must still open — typing a meal is always available.
    expect(screen.queryByText(/what are we having/i)).toBeTruthy();
    expect(screen.queryByText('Adobo')).toBeNull();
  });

  it('closes again on Close, leaving no overlay behind', () => {
    renderPlan();

    fireEvent.click(screen.getByText(/choose dinner/i));
    expect(document.querySelector('.sheet-scrim')).toBeTruthy();

    fireEvent.click(screen.getByText(/^close$/i));
    expect(document.querySelector('.sheet-scrim')).toBeNull();
  });

  it('plans a typed meal into the slot that was open', () => {
    const week = weekApi();
    renderPlan(week, recipesApi());

    fireEvent.click(screen.getByText(/choose dinner/i));
    fireEvent.change(screen.getByLabelText(/meal name/i), {
      target: { value: 'Leftovers' },
    });
    fireEvent.click(screen.getByText(/put this on the plan/i));

    expect(week.setMeal).toHaveBeenCalledTimes(1);
    const [, mealType, meal] = (week.setMeal as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(mealType).toBe('dinner');
    expect(meal.name).toBe('Leftovers');
  });

  it('shows a planned meal rather than a Choose button', () => {
    const meals = {
      [slotKey('Monday', 'dinner')]: {
        name: 'Jambalaya', subtitle: '', prepTime: '', ingredients: [],
      },
    };
    renderPlan(weekApi(meals), recipesApi());

    // Land on Monday so the planned slot is the one on screen.
    fireEvent.click(screen.getByText('Mon'));

    expect(screen.getByText('Jambalaya')).toBeTruthy();
    expect(screen.queryByText(/choose dinner/i)).toBeNull();
  });
});


/**
 * The app used to pin itself to the current week, so on a Sunday you were
 * looking at a week that was over with no way to reach the next one.
 */
describe('moving between weeks', () => {
  it('offers a way forward and back', () => {
    renderPlan();

    expect(screen.getByLabelText(/previous week/i)).toBeTruthy();
    expect(screen.getByLabelText(/next week/i)).toBeTruthy();
  });

  it('steps forward a week', () => {
    const onShiftWeek = vi.fn();
    renderPlan(weekApi(), recipesApi(), { onShiftWeek });

    fireEvent.click(screen.getByLabelText(/next week/i));

    expect(onShiftWeek).toHaveBeenCalledWith(1);
  });

  it('steps back a week', () => {
    const onShiftWeek = vi.fn();
    renderPlan(weekApi(), recipesApi(), { onShiftWeek });

    fireEvent.click(screen.getByLabelText(/previous week/i));

    expect(onShiftWeek).toHaveBeenCalledWith(-1);
  });

  it('names the week you are on', () => {
    renderPlan(weekApi(), recipesApi(), { weekOffset: 0 });
    expect(screen.getByText('This week')).toBeTruthy();

    cleanup();
    renderPlan(weekApi(), recipesApi(), { weekOffset: 1 });
    expect(screen.getByText('Next week')).toBeTruthy();

    cleanup();
    renderPlan(weekApi(), recipesApi(), { weekOffset: -1 });
    expect(screen.getByText('Last week')).toBeTruthy();

    cleanup();
    renderPlan(weekApi(), recipesApi(), { weekOffset: 3 });
    expect(screen.getByText('In 3 weeks')).toBeTruthy();
  });

  it('offers a way back to this week only when you have left it', () => {
    renderPlan(weekApi(), recipesApi(), { weekOffset: 0 });
    expect(screen.getByText('This week').closest('button')?.disabled).toBe(true);

    cleanup();
    const onResetWeek = vi.fn();
    renderPlan(weekApi(), recipesApi(), { weekOffset: 2, onResetWeek });
    fireEvent.click(screen.getByText('In 2 weeks'));
    expect(onResetWeek).toHaveBeenCalled();
  });

  it('shows the dates of the week being viewed, not always today', () => {
    const next = getWeekDates(addWeeks(new Date(2026, 7, 26), 1)); // Mon 31 Aug
    renderPlan(weekApi(), recipesApi(), { weekDates: next, weekOffset: 1 });

    expect(screen.getByText('31')).toBeTruthy();
  });
});

describe('week ids', () => {
  it('a Sunday and the following Monday are different weeks', () => {
    const sunday = new Date(2026, 7, 30);
    const monday = new Date(2026, 7, 31);

    expect(getWeekId(sunday)).not.toBe(getWeekId(monday));
  });

  it('stepping forward from a Sunday reaches the next week', () => {
    const sunday = new Date(2026, 7, 30);

    expect(getWeekId(addWeeks(sunday, 1))).toBe(getWeekId(new Date(2026, 8, 1)));
  });

  it('stepping back and forward returns to where it started', () => {
    const d = new Date(2026, 7, 26);
    expect(getWeekId(addWeeks(addWeeks(d, -3), 3))).toBe(getWeekId(d));
  });

  it('steps across a month boundary', () => {
    expect(getWeekId(addWeeks(new Date(2026, 7, 26), 1))).toBe('2026-08-31');
  });
});

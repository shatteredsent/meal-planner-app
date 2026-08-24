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

function renderPlan(week = weekApi(), recipes = recipesApi()) {
  return render(
    <Plan week={week} recipes={recipes} focus={null} onFocusHandled={vi.fn()} />
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

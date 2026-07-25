import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import PlannerScreen from '../screens/PlannerScreen';
import { Meal } from '../types/meal';
import { Recipe } from '../types/recipe';

// ─── Fixtures ─────────────────────────────────────────────────────

// The Plan tab always opens on today, so fixtures are pinned to whatever day
// that is rather than hard-coding one.
const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];
const TODAY = DAYS[(new Date().getDay() + 6) % 7];
const YESTERDAY = DAYS[(DAYS.indexOf(TODAY) + 6) % 7];

const DINNER_RECIPE: Recipe = {
  id: 'r1',
  familyId: 'fam1',
  name: 'Sheet-Pan Chicken & Roots',
  subtitle: 'One pan, one rack, no fuss.',
  ingredients: [
    { name: 'Chicken thighs', amount: 2.5, unit: 'lb', category: 'Meat & Seafood' },
  ],
  prepTime: '50 min',
  servings: 4,
  steps: ['Heat the oven to 425°F.'],
  mealType: 'dinner',
  isKetoFriendly: false,
  createdAt: null,
  createdBy: 'u1',
};

const BREAKFAST_RECIPE: Recipe = {
  ...DINNER_RECIPE,
  id: 'r2',
  name: 'Cheddar Egg Scramble',
  subtitle: 'Soft eggs, sharp cheddar, thick toast.',
  prepTime: '10 min',
  mealType: 'breakfast',
};

function dinnerMeal(dayOfWeek: string): Meal {
  return {
    id: 'm1',
    familyId: 'fam1',
    recipeId: 'r1',
    recipeName: 'Sheet-Pan Chicken & Roots',
    subtitle: 'One pan, one rack, no fuss.',
    ingredients: DINNER_RECIPE.ingredients,
    prepTime: '50 min',
    mealType: 'dinner',
    dayOfWeek,
    weekId: '2025-W30',
    createdAt: null,
  };
}

// ─── Mocks ────────────────────────────────────────────────────────

const mockSetMeal = jest.fn().mockResolvedValue(undefined);
const mockClearSlot = jest.fn().mockResolvedValue(undefined);
const mockCopyDay = jest.fn().mockResolvedValue(undefined);
const mockClearSlotFocus = jest.fn();

// `mock`-prefixed so jest's module factory is allowed to close over them.
let mockMeals: Meal[] = [];
let mockRecipeLibrary: Recipe[] = [];

jest.mock('../context/PlannerData', () => ({
  usePlannerData: () => ({
    familyId: 'fam1',
    plan: {
      meals: mockMeals,
      isLoading: false,
      hasError: false,
      mealAt: (day: string, mealType: string) =>
        mockMeals.find((m) => m.dayOfWeek === day && m.mealType === mealType),
      setMeal: mockSetMeal,
      clearSlot: mockClearSlot,
      copyDay: mockCopyDay,
    },
    recipes: { recipes: mockRecipeLibrary },
    slotFocus: null,
    clearSlotFocus: mockClearSlotFocus,
  }),
}));

// Spy on the real Alert rather than mocking its internal module path, which
// moves between React Native versions.
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
  mockMeals = [];
  mockRecipeLibrary = [DINNER_RECIPE, BREAKFAST_RECIPE];
});

// ─── Tests ────────────────────────────────────────────────────────

describe('PlannerScreen', () => {
  it('shows all three meal slots, breakfast included', () => {
    const { getByText } = render(<PlannerScreen />);

    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('Dinner')).toBeTruthy();
  });

  it('opens on today', () => {
    const { getByText } = render(<PlannerScreen />);
    expect(getByText(TODAY)).toBeTruthy();
  });

  it('shows the blank-day nudge and 0/3 when nothing is planned', () => {
    const { getByText, getAllByText } = render(<PlannerScreen />);

    expect(getByText('0/3 chosen')).toBeTruthy();
    expect(
      getByText('Blank day. Copying yesterday is a perfectly good answer.')
    ).toBeTruthy();
    expect(
      getAllByText('Nothing planned yet — pick something')
    ).toHaveLength(3);
  });

  it('shows the planned meal, and the two-of-three nudge', () => {
    mockMeals = [dinnerMeal(TODAY)];
    const { getByText, getAllByText } = render(<PlannerScreen />);

    expect(getByText('Sheet-Pan Chicken & Roots')).toBeTruthy();
    expect(getByText('50 min')).toBeTruthy();
    expect(getByText('1/3 chosen')).toBeTruthy();
    expect(
      getByText('Two of three down. Fill the last slot or borrow from the day before.')
    ).toBeTruthy();
    expect(getAllByText('Nothing planned yet — pick something')).toHaveLength(2);
  });

  it('offers Recipe, Swap and Clear on a meal that came from the library', () => {
    mockMeals = [dinnerMeal(TODAY)];
    const { getByText } = render(<PlannerScreen />);

    expect(getByText('Recipe')).toBeTruthy();
    expect(getByText('Swap')).toBeTruthy();
    expect(getByText('Clear')).toBeTruthy();
  });

  it('hides Recipe on a custom built meal, which has no method to show', () => {
    const built = dinnerMeal(TODAY);
    delete built.recipeId;
    built.recipeName = 'Flank steak & Broccoli';
    mockMeals = [built];

    const { queryByText, getByText } = render(<PlannerScreen />);

    expect(queryByText('Recipe')).toBeNull();
    expect(getByText('Swap')).toBeTruthy();
  });

  it('opens the picker on the tapped slot and offers only that slot\'s recipes', () => {
    const { getAllByText, getByText, queryByText } = render(<PlannerScreen />);

    // The first empty slot is breakfast.
    fireEvent.press(getAllByText('Nothing planned yet — pick something')[0]);

    expect(getByText("What's for breakfast?")).toBeTruthy();
    expect(getByText('Cheddar Egg Scramble')).toBeTruthy();
    // The dinner recipe must not be offered for breakfast.
    expect(queryByText('Sheet-Pan Chicken & Roots')).toBeNull();
  });

  it('plans the chosen recipe into the slot it was opened from', async () => {
    const { getAllByText, getByText } = render(<PlannerScreen />);

    fireEvent.press(getAllByText('Nothing planned yet — pick something')[0]);

    await act(async () => {
      fireEvent.press(getByText('Cheddar Egg Scramble'));
    });

    expect(mockSetMeal).toHaveBeenCalledWith(
      TODAY,
      'breakfast',
      expect.objectContaining({
        recipeId: 'r2',
        recipeName: 'Cheddar Egg Scramble',
        prepTime: '10 min',
        ingredients: BREAKFAST_RECIPE.ingredients,
      })
    );
  });

  it('saves a built meal with the composed name and every picked ingredient', async () => {
    const { getAllByText, getByText } = render(<PlannerScreen />);

    fireEvent.press(getAllByText('Nothing planned yet — pick something')[2]); // dinner
    fireEvent.press(getByText('Build your own'));

    fireEvent.press(getByText('Flank steak'));
    fireEvent.press(getByText('Broccoli'));

    await act(async () => {
      fireEvent.press(getByText('Add to dinner'));
    });

    expect(mockSetMeal).toHaveBeenCalledWith(
      TODAY,
      'dinner',
      expect.objectContaining({
        recipeName: 'Flank steak & Broccoli',
        ingredients: [
          { name: 'Flank steak', amount: 1.5, unit: 'lb', category: 'Meat & Seafood' },
          { name: 'Broccoli', amount: 1.5, unit: 'lb', category: 'Produce' },
        ],
      })
    );
  });

  it('will not save a built meal with only a base and a seasoning', () => {
    const { getAllByText, getByText } = render(<PlannerScreen />);

    fireEvent.press(getAllByText('Nothing planned yet — pick something')[2]);
    fireEvent.press(getByText('Build your own'));
    fireEvent.press(getByText('Jasmine rice'));

    // The save button reads as disabled and does nothing.
    fireEvent.press(getByText('Choose at least one part'));

    expect(mockSetMeal).not.toHaveBeenCalled();
  });

  it('confirms before clearing a slot, and clears on confirm', () => {
    mockMeals = [dinnerMeal(TODAY)];
    const { getByText } = render(<PlannerScreen />);

    fireEvent.press(getByText('Clear'));

    // The prototype clears immediately; the shipped app keeps its confirm.
    expect(mockAlert).toHaveBeenCalledWith(
      'Remove meal',
      'Are you sure?',
      expect.any(Array)
    );
    expect(mockClearSlot).not.toHaveBeenCalled();

    // Take the confirm's "Remove" action and run it, as a tap would.
    const buttons = mockAlert.mock.calls[0][2] ?? [];
    const remove = buttons.find((b) => b.text === 'Remove');
    expect(remove).toBeDefined();
    remove!.onPress!();

    expect(mockClearSlot).toHaveBeenCalledWith(TODAY, 'dinner');
  });

  it('copies the previous day when it has meals', async () => {
    mockMeals = [dinnerMeal(YESTERDAY)];
    const { getByText } = render(<PlannerScreen />);

    await act(async () => {
      fireEvent.press(getByText('Repeat the day before'));
    });

    expect(mockCopyDay).toHaveBeenCalledWith(YESTERDAY, TODAY);
  });

  it('says so rather than copying nothing when the previous day is empty', async () => {
    const { getByText } = render(<PlannerScreen />);

    await act(async () => {
      fireEvent.press(getByText('Repeat the day before'));
    });

    expect(mockCopyDay).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      'Nothing to copy',
      `${YESTERDAY} has no meals planned yet.`
    );
  });

  it('prefills the builder from a recipe\'s parts on "swap the parts around"', () => {
    mockMeals = [dinnerMeal(TODAY)];
    mockRecipeLibrary = [
      { ...DINNER_RECIPE, parts: { protein: 'p1', veg: 'v3', base: 'x3', finish: 'f1' } },
      BREAKFAST_RECIPE,
    ];

    const { getByText } = render(<PlannerScreen />);

    fireEvent.press(getByText('Recipe'));
    fireEvent.press(getByText('Swap the parts around'));

    // The builder opens with this recipe's four parts already chosen.
    expect(getByText('Chicken thighs & Carrots')).toBeTruthy();
    expect(getByText('on potatoes, lemon & herb')).toBeTruthy();
  });
});

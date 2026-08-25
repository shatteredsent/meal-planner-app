/**
 * Plan — one day at a time.
 *
 * A day strip picks the day, three slot cards fill it, and a footer nudge reacts
 * to how full the day is.
 */

import { useEffect, useMemo, useState } from 'react';
import { DAYS, MEAL_TYPES, MEAL_TYPE_LABELS } from '../types';
import type { Meal, MealType, Recipe } from '../types';
import type { WeekApi } from '../hooks/useWeek';
import type { RecipesApi } from '../hooks/useRecipes';
import { formatWeekRange, getWeekDates, weekdayIndex } from '../lib/week';
import { Button, ErrorState, Header } from '../components/ui';
import MealPicker, { mealFromRecipe } from '../components/MealPicker';
import type { SlotTarget } from '../components/MealPicker';
import RecipeDetail from '../components/RecipeDetail';

interface Props {
  week: WeekApi;
  recipes: RecipesApi;
  /** Set when arriving from the Week screen: select this day and open its picker. */
  focus: SlotTarget | null;
  onFocusHandled: () => void;
}

function nudgeFor(empty: number): string {
  if (empty === 0) {
    return 'This day is set. Nice work — the shopping list already knows about it.';
  }
  if (empty === 3) return 'Blank day. Copying yesterday is a perfectly good answer.';
  return 'Two of three down. Fill the last slot or borrow from the day before.';
}

export default function Plan({ week, recipes, focus, onFocusHandled }: Props) {
  const [dayIndex, setDayIndex] = useState(() => weekdayIndex(new Date()));
  const [target, setTarget] = useState<SlotTarget | null>(null);
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);

  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const todayIndex = weekdayIndex(new Date());

  // A hand-off from the Week screen: select that day and open its picker, then
  // clear the request so it doesn't reopen on every later render.
  useEffect(() => {
    if (!focus) return;

    const index = DAYS.indexOf(focus.day as (typeof DAYS)[number]);
    if (index >= 0) setDayIndex(index);
    setTarget(focus);
    onFocusHandled();
  }, [focus, onFocusHandled]);

  // Deliberately not blocked on isLoading. An empty week renders perfectly
  // well, and waiting on the listen stream can take tens of seconds on a cold
  // connection — which looks like an app that has died. The header says
  // "Syncing…" until the first snapshot lands.
  if (week.hasError) return <ErrorState what="meal plan" />;

  const day = DAYS[dayIndex];
  const slots = MEAL_TYPES.map((mealType) => ({
    mealType,
    meal: week.mealAt(day, mealType),
  }));
  const empty = slots.filter((slot) => !slot.meal).length;

  async function pick(meal: Meal) {
    if (!target) return;
    const slot = target;
    setTarget(null);

    try {
      await week.setMeal(slot.day, slot.mealType, meal);
    } catch {
      window.alert('Could not plan that meal. Please try again.');
    }
  }

  function clearSlot(mealType: MealType) {
    if (!window.confirm(`Remove ${MEAL_TYPE_LABELS[mealType].toLowerCase()} on ${day}?`)) {
      return;
    }
    void week.clearSlot(day, mealType);
  }

  async function repeatPreviousDay() {
    const source = DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
    const hasMeals = Object.keys(week.week.meals).some((key) =>
      key.startsWith(`${source}_`)
    );

    if (!hasMeals) {
      window.alert(`${source} has no meals planned yet.`);
      return;
    }

    try {
      await week.copyDay(source, day);
    } catch {
      window.alert('Could not copy that day. Please try again.');
    }
  }

  /** The recipe behind a planned meal, if it's still in the library. */
  function recipeFor(meal: Meal): Recipe | undefined {
    return meal.recipeId ? recipes.recipes.find((r) => r.id === meal.recipeId) : undefined;
  }

  return (
    <>
      <Header
        kicker={formatWeekRange(weekDates)}
        meta={`${3 - empty}/3 chosen`}
        title={day}
        syncing={week.isLoading}
      />

      <div className="scroll">
        <div className="day-strip">
          {DAYS.map((name, index) => {
            const filled = MEAL_TYPES.filter((t) => week.mealAt(name, t)).length;
            return (
              <button
                key={name}
                className={[
                  'day-cell',
                  index === dayIndex ? 'is-selected' : '',
                  index === todayIndex ? 'is-today' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setDayIndex(index)}
                aria-pressed={index === dayIndex}
              >
                <span className="day-name">{name.slice(0, 3)}</span>
                <span className="day-date">{weekDates[index].getDate()}</span>
                <span className="day-dots">{'•'.repeat(filled)}</span>
              </button>
            );
          })}
        </div>

        {slots.map(({ mealType, meal }) => {
          const recipe = meal && recipeFor(meal);

          return (
            <section className={`slot meal-${mealType}`} key={mealType}>
              <div className="slot-head">
                <span className="slot-type">{MEAL_TYPE_LABELS[mealType]}</span>
                {meal?.prepTime && <span className="t-meta">{meal.prepTime}</span>}
              </div>

              {meal ? (
                <>
                  <p className="t-meal">{meal.name}</p>
                  {meal.subtitle && <p className="t-sec">{meal.subtitle}</p>}
                  <div className="slot-actions">
                    {recipe && (
                      <Button
                        label="Recipe"
                        inline
                        onClick={() => setOpenRecipe(recipe)}
                      />
                    )}
                    <Button
                      label="Swap"
                      inline
                      onClick={() => setTarget({ day, mealType })}
                    />
                    <Button
                      label="Remove"
                      inline
                      variant="danger"
                      onClick={() => clearSlot(mealType)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="slot-empty-copy">Nothing here yet.</p>
                  <Button
                    label={`Choose ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`}
                    variant="solid"
                    onClick={() => setTarget({ day, mealType })}
                  />
                </>
              )}
            </section>
          );
        })}

        <div className="pad stack">
          <p className="t-sec-sm">{nudgeFor(empty)}</p>
          <Button label="Repeat the day before" variant="solid" onClick={repeatPreviousDay} />
        </div>
      </div>

      <MealPicker
        target={target}
        recipes={recipes.recipes}
        isLoadingRecipes={recipes.isLoading}
        onPick={pick}
        onViewRecipe={setOpenRecipe}
        onClose={() => setTarget(null)}
      />

      <RecipeDetail
        recipe={openRecipe}
        onPlan={
          target && openRecipe
            ? () => {
                const recipe = openRecipe;
                setOpenRecipe(null);
                void pick(mealFromRecipe(recipe));
              }
            : undefined
        }
        onClose={() => setOpenRecipe(null)}
      />
    </>
  );
}

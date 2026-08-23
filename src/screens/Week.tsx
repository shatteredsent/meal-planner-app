/**
 * Week — read the whole week and jump to any gap.
 *
 * Twenty-one slots at a glance. Tapping any row hands the slot to Plan, which
 * selects that day and opens its picker.
 */

import { useMemo } from 'react';
import { DAYS, MEAL_TYPES, MEAL_TYPE_LABELS, TOTAL_SLOTS } from '../types';
import type { MealType } from '../types';
import type { WeekApi } from '../hooks/useWeek';
import { formatWeekDayLabel, getWeekDates, weekdayIndex } from '../lib/week';
import { Button, ErrorState, Header, Loading } from '../components/ui';

interface Props {
  week: WeekApi;
  onOpenSlot: (day: string, mealType: MealType) => void;
  onOpenSettings: () => void;
  onOpenList: () => void;
}

function nudgeFor(filled: number): string {
  if (filled >= 18) return 'the week is basically sorted.';
  if (filled >= 12) return 'the backbone is there.';
  return 'plenty of room left.';
}

export default function Week({
  week,
  onOpenSlot,
  onOpenSettings,
  onOpenList,
}: Props) {
  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const todayIndex = weekdayIndex(new Date());

  if (week.isLoading) return <Loading />;
  if (week.hasError) return <ErrorState what="meal plan" />;

  const filled = Object.keys(week.week.meals).length;

  function clearWeek() {
    if (filled === 0) {
      window.alert('This week has no meals planned yet.');
      return;
    }

    const ok = window.confirm(
      'Start the week over?\n\nThis removes every planned meal and everything the ' +
        'shopping list built from it. Items you added by hand stay.'
    );
    if (ok) void week.clearWeek();
  }

  return (
    <>
      <Header kicker="This week" meta={`${filled}/${TOTAL_SLOTS}`} title="The week" />

      <div className="scroll">
        <div className="week-summary">
          <span className="t-stat">{filled}</span>
          <span className="t-sec-sm">
            of {TOTAL_SLOTS} meals planned — {nudgeFor(filled)}
          </span>
        </div>

        {DAYS.map((day, index) => (
          <section
            className={index === todayIndex ? 'week-day is-today' : 'week-day'}
            key={day}
          >
            <div className="week-day-head">
              <span className="t-label">{formatWeekDayLabel(weekDates[index])}</span>
              <span className="t-meta">
                {MEAL_TYPES.filter((t) => week.mealAt(day, t)).length}/3
              </span>
            </div>

            {MEAL_TYPES.map((mealType) => {
              const meal = week.mealAt(day, mealType);
              return (
                <button
                  className="week-slot"
                  key={mealType}
                  onClick={() => onOpenSlot(day, mealType)}
                >
                  <span className="week-slot-type t-label">
                    {MEAL_TYPE_LABELS[mealType].slice(0, 5)}
                  </span>
                  <span
                    className={meal ? 'week-slot-name t-row' : 'week-slot-name t-row is-empty'}
                  >
                    {meal ? meal.name : 'empty'}
                  </span>
                </button>
              );
            })}
          </section>
        ))}

        <div className="pad stack">
          <Button label="See the shopping list" variant="accent" onClick={onOpenList} />
          <Button label="Start the week over" variant="quiet" onClick={clearWeek} />
        </div>

        {/* Recipes has its own tab now. Settings is a destination rather than
            somewhere you live, so it stays here. */}
        <div className="pad stack rule-top">
          <span className="t-label">Elsewhere</span>
          <Button label="Family & settings" onClick={onOpenSettings} />
        </div>
      </div>
    </>
  );
}

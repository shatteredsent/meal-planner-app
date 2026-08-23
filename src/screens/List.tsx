/**
 * List — shop the plan.
 *
 * There is no "Generate" button, and nothing to keep in sync: the list *is* the
 * plan, summed by ingredient. Ticking a row and marking something as already at
 * home are the only things stored.
 */

import { useMemo, useState } from 'react';
import type { WeekApi } from '../hooks/useWeek';
import { buildList, countLines, groupByAisle, MANUAL_LABEL } from '../lib/shoppingList';
import { formatDays, formatQuantity } from '../lib/quantity';
import { ErrorState, GroupHead, Header, Loading } from '../components/ui';

export default function List({ week }: { week: WeekApi }) {
  const [draft, setDraft] = useState('');

  const lines = useMemo(
    () => buildList(week.week.meals, week.week.extras),
    [week.week.meals, week.week.extras]
  );

  if (week.isLoading) return <Loading />;
  if (week.hasError) return <ErrorState what="shopping list" />;

  const groups = groupByAisle(lines);
  const counts = countLines(lines, week.week);
  const checked = new Set(week.week.checked);
  const pantry = new Set(week.week.pantry);
  const mealCount = Object.keys(week.week.meals).length;

  function add() {
    const name = draft.trim();
    if (!name) return;
    setDraft('');
    void week.addExtra(name);
  }

  return (
    <>
      <Header
        kicker={`From ${mealCount} planned ${mealCount === 1 ? 'meal' : 'meals'}`}
        meta={`${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`}
        title="Shopping list"
      />

      <div className="scroll">
        <div className="stat-bar">
          {[
            ['To buy', counts.toBuy],
            ['In cart', counts.inCart],
            ['At home', counts.atHome],
          ].map(([label, value]) => (
            <div className="stat-cell" key={label}>
              <p className="t-stat">{value}</p>
              <p className="t-label">{label}</p>
            </div>
          ))}
        </div>

        <div className="add-row">
          <input
            className="input"
            placeholder="Add something to the list"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            aria-label="Add an item"
          />
          <button onClick={add}>Add</button>
        </div>

        {lines.length === 0 && (
          <div className="empty">
            <p className="t-body">
              Your list fills itself in as you plan meals. Head to Plan and pick a
              dinner to start.
            </p>
          </div>
        )}

        {groups.map((group) => (
          <section key={group.label}>
            <GroupHead
              label={group.label}
              meta={String(group.lines.length)}
              ruleAbove={group.label === MANUAL_LABEL}
            />
            <ul>
              {group.lines.map((line) => {
                const isChecked = checked.has(line.key);
                const isPantry = pantry.has(line.key);
                const classes = ['shop-row'];
                if (isChecked) classes.push('is-checked');
                if (isPantry) classes.push('is-pantry');

                return (
                  <li className={classes.join(' ')} key={line.key}>
                    <button
                      className={isChecked ? 'check is-on' : 'check'}
                      onClick={() => week.toggleChecked(line.key, isChecked)}
                      aria-label={`${isChecked ? 'Uncheck' : 'Check'} ${line.name}`}
                      aria-pressed={isChecked}
                    >
                      {isChecked ? '✓' : ''}
                    </button>

                    <span className="shop-main">
                      <span className="shop-name t-row">{line.name}</span>
                      <span className="t-meta">{formatDays(line.days)}</span>
                    </span>

                    {formatQuantity(line.amount, line.unit) && (
                      <span className="shop-qty t-strong">
                        {formatQuantity(line.amount, line.unit)}
                      </span>
                    )}

                    <button
                      className={isPantry ? 'pantry-btn is-on' : 'pantry-btn'}
                      onClick={() => week.togglePantry(line.key, isPantry)}
                      aria-pressed={isPantry}
                    >
                      Have
                    </button>

                    {line.isManual && (
                      <button
                        className="pantry-btn"
                        onClick={() => week.removeExtra(line.name)}
                        aria-label={`Remove ${line.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

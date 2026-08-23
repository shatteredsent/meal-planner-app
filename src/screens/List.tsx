/**
 * List — shop the plan.
 *
 * There is no "Generate" button, and nothing to keep in sync: the list *is* the
 * plan, summed by ingredient. Ticking a row, marking something as already at
 * home, and anything you add by hand are the only things stored.
 *
 * Two ways to add. The block at the top takes anything and collects it under
 * "Added by you"; the + on an aisle header drops something straight into that
 * aisle, next to the planned items you'll pick up at the same time.
 */

import { useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '../types';
import type { Category } from '../types';
import type { WeekApi } from '../hooks/useWeek';
import {
  buildList, countLines, groupByAisle, makeExtra, MANUAL_LABEL,
} from '../lib/shoppingList';
import { formatDays, formatQuantity } from '../lib/quantity';
import { Button, ErrorState, GroupHead, Header, Loading } from '../components/ui';

const AISLES = new Set<string>(CATEGORIES);

export default function List({ week }: { week: WeekApi }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const nameField = useRef<HTMLInputElement>(null);

  // Which aisle has its inline add field open, and what is typed into it.
  const [openAisle, setOpenAisle] = useState<Category | null>(null);
  const [aisleName, setAisleName] = useState('');
  const [aisleQty, setAisleQty] = useState('');

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

  /** From the block at the top: unplaced, so it lands under "Added by you". */
  function addOwn() {
    const extra = makeExtra(name, qty);
    if (!extra) return;

    setName('');
    setQty('');
    // Keep the field live so several things can be rattled off in a row.
    nameField.current?.focus();
    void week.addExtra(extra);
  }

  /** From an aisle's +: placed in that aisle. */
  function addToAisle(category: Category) {
    const extra = makeExtra(aisleName, aisleQty, category);
    if (!extra) return;

    setAisleName('');
    setAisleQty('');
    void week.addExtra(extra);
  }

  function toggleAisle(category: Category) {
    setAisleName('');
    setAisleQty('');
    setOpenAisle((current) => (current === category ? null : category));
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
          {([['To buy', counts.toBuy], ['In cart', counts.inCart], ['At home', counts.atHome]] as const).map(
            ([label, value]) => (
              <div className="stat-cell" key={label}>
                <p className="t-stat">{value}</p>
                <p className="t-label">{label}</p>
              </div>
            )
          )}
        </div>

        <section className="add-block">
          <p className="t-label">Add your own</p>
          <div className="add-fields">
            <input
              ref={nameField}
              className="input"
              placeholder="Paper towels"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOwn()}
              aria-label="Item name"
            />
            <input
              className="input add-qty"
              placeholder="2"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOwn()}
              aria-label="Quantity"
            />
          </div>
          <Button
            label="Add to list"
            variant="solid"
            onClick={addOwn}
            disabled={!name.trim()}
          />
          <p className="t-sec-sm">
            Quantity is optional — “1 qt”, “2”, or nothing at all. Typing
            “2&nbsp;lb ground beef” into the name works too.
          </p>
        </section>

        {lines.length === 0 && (
          <div className="empty">
            <p className="t-body">
              Your list fills itself in as you plan meals. Head to Plan and pick a
              dinner to start — or add something above.
            </p>
          </div>
        )}

        {groups.map((group) => {
          const isAisle = AISLES.has(group.label);
          const category = group.label as Category;
          const isOpen = isAisle && openAisle === category;

          return (
            <section key={group.label}>
              <GroupHead
                label={group.label}
                meta={String(group.lines.length)}
                ruleAbove={group.label === MANUAL_LABEL}
                action={
                  isAisle
                    ? {
                        label: isOpen ? '×' : '+',
                        title: isOpen ? 'Cancel' : `Add to ${group.label}`,
                        isOn: isOpen,
                        onClick: () => toggleAisle(category),
                      }
                    : undefined
                }
              />

              {isOpen && (
                <div className="aisle-add">
                  <input
                    className="input"
                    placeholder={`Add to ${group.label}`}
                    value={aisleName}
                    onChange={(e) => setAisleName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToAisle(category)}
                    aria-label={`Item for ${group.label}`}
                    autoFocus
                  />
                  <input
                    className="input add-qty"
                    placeholder="2"
                    value={aisleQty}
                    onChange={(e) => setAisleQty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToAisle(category)}
                    aria-label="Quantity"
                  />
                  <button
                    className="aisle-add-go"
                    onClick={() => addToAisle(category)}
                    disabled={!aisleName.trim()}
                  >
                    Add
                  </button>
                </div>
              )}

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
                          title={`Remove ${line.name}`}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

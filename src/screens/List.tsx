/**
 * List — shop the plan.
 *
 * There is no "Generate" button, and nothing to keep in sync: the list *is* the
 * plan, summed by ingredient. Ticking a row, marking something as already at
 * home, and anything you add by hand are the only things stored.
 *
 * Every aisle is always shown, empty or not, so its + is always there — you can
 * start a list by aisle rather than only adding to what the plan produced. Each
 * aisle carries its own pastel, so the list can be navigated by colour.
 */

import { useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '../types';
import type { Category } from '../types';
import type { WeekApi } from '../hooks/useWeek';
import {
  buildList, countLines, groupByAisle, makeExtra, MANUAL_LABEL, toneFor,
} from '../lib/shoppingList';
import type { Group } from '../lib/shoppingList';
import { formatDays, formatQuantity } from '../lib/quantity';
import { Button, ErrorState, GroupHead, Header, Loading } from '../components/ui';

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

  const filled = groupByAisle(lines);
  const byLabel = new Map(filled.map((g) => [g.label, g]));

  // Every aisle in walk-the-store order whether or not it has anything in it,
  // then hand-added items, only if there are any.
  const groups: Group[] = [
    ...CATEGORIES.map((c) => byLabel.get(c) ?? { label: c, lines: [] }),
    ...(byLabel.has(MANUAL_LABEL) ? [byLabel.get(MANUAL_LABEL)!] : []),
  ];

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
          <div className="stat-cell is-tobuy">
            <p className="t-stat">{counts.toBuy}</p>
            <p className="t-label">To buy</p>
          </div>
          <div className="stat-cell is-incart">
            <p className="t-stat">{counts.inCart}</p>
            <p className="t-label">In cart</p>
          </div>
          <div className="stat-cell is-athome">
            <p className="t-stat">{counts.atHome}</p>
            <p className="t-label">At home</p>
          </div>
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
            variant="accent"
            onClick={addOwn}
            disabled={!name.trim()}
          />
          <p className="t-sec-sm">
            Quantity is optional. Or use the + on any aisle below to put
            something straight where you'll pick it up.
          </p>
        </section>

        {lines.length === 0 && (
          <div className="empty">
            <p className="t-body">
              Your list fills itself in as you plan meals. Head to Plan and pick a
              dinner to start — or add something here.
            </p>
          </div>
        )}

        {groups.map((group) => {
          const isManualGroup = group.label === MANUAL_LABEL;
          const category = group.label as Category;
          const isOpen = !isManualGroup && openAisle === category;
          const isVacant = group.lines.length === 0 && !isOpen;

          return (
            <section key={group.label}>
              <GroupHead
                label={group.label}
                meta={group.lines.length > 0 ? String(group.lines.length) : undefined}
                tone={toneFor(group.label)}
                isVacant={isVacant}
                action={
                  isManualGroup
                    ? undefined
                    : {
                        label: isOpen ? '×' : '+',
                        title: isOpen ? 'Cancel' : `Add to ${group.label}`,
                        isOn: isOpen,
                        onClick: () => toggleAisle(category),
                      }
                }
              />

              {(isOpen || group.lines.length > 0) && (
                <div className="aisle-body">
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
                            ✓
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

                          <span className="row-actions">
                            <button
                              className={isPantry ? 'pantry-btn is-on' : 'pantry-btn'}
                              onClick={() => week.togglePantry(line.key, isPantry)}
                              aria-pressed={isPantry}
                              title="Already have this at home"
                            >
                              Have
                            </button>

                            {line.isManual && (
                              <button
                                className="pantry-btn is-remove"
                                onClick={() => week.removeExtra(line.name)}
                                aria-label={`Remove ${line.name}`}
                                title={`Remove ${line.name}`}
                              >
                                ✕
                              </button>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

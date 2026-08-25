/**
 * The whole app: an auth gate, four tabs, and Settings reached from Week.
 *
 * The data hooks run here, once, and are passed down as props. There is no
 * context and no router library — with six screens and one live document,
 * neither pays for itself. Back is wired to the history stack by hand, which is
 * a dozen lines and the difference between a web page and something that feels
 * like an app on a phone.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TOTAL_SLOTS } from './types';
import type { MealType } from './types';
import { useSession } from './hooks/useSession';
import { useWeek } from './hooks/useWeek';
import { useRecipes } from './hooks/useRecipes';
import { buildList, countLines } from './lib/shoppingList';
import { addWeeks, getWeekDates, getWeekId } from './lib/week';
import { Loading } from './components/ui';
import type { SlotTarget } from './components/MealPicker';
import Login from './screens/Login';
import FamilySetup from './screens/FamilySetup';
import Plan from './screens/Plan';
import List from './screens/List';
import Week from './screens/Week';
import Recipes from './screens/Recipes';
import Settings from './screens/Settings';

const VIEWS = ['plan', 'list', 'week', 'recipes', 'settings'] as const;
type View = (typeof VIEWS)[number];

/** Recipes earns a tab: it was three taps deep behind the Week screen. */
const TABS: { view: View; label: string }[] = [
  { view: 'plan', label: 'Plan' },
  { view: 'list', label: 'List' },
  { view: 'week', label: 'Week' },
  { view: 'recipes', label: 'Recipes' },
];

function isView(value: unknown): value is View {
  return typeof value === 'string' && (VIEWS as readonly string[]).includes(value);
}

export default function App() {
  const session = useSession();

  if (session.status === 'loading') {
    return <div className="app"><Loading /></div>;
  }

  if (session.status === 'signed-out') {
    return <div className="app"><Login /></div>;
  }

  if (session.status === 'no-family') {
    return (
      <div className="app">
        <FamilySetup uid={session.user!.uid} email={session.user!.email ?? ''} />
      </div>
    );
  }

  // Remounts on a family change, resetting every screen's local state along
  // with the subscriptions.
  return <Signed key={session.familyId} familyId={session.familyId} session={session} />;
}

function Signed({
  familyId,
  session,
}: {
  familyId: string;
  session: ReturnType<typeof useSession>;
}) {
  // Which week every screen is looking at. Held here rather than per-screen so
  // Plan, List and Week can never disagree about which week they mean.
  const [weekOffset, setWeekOffset] = useState(0);
  const anchor = useMemo(() => addWeeks(new Date(), weekOffset), [weekOffset]);
  const weekId = useMemo(() => getWeekId(anchor), [anchor]);
  const weekDates = useMemo(() => getWeekDates(anchor), [anchor]);

  const week = useWeek(familyId, weekId);
  const recipes = useRecipes(session.cookbookId);

  const [view, setView] = useState<View>('plan');
  const [focus, setFocus] = useState<SlotTarget | null>(null);

  const shiftWeek = useCallback((by: number) => setWeekOffset((n) => n + by), []);
  const resetWeek = useCallback(() => setWeekOffset(0), []);

  const clearFocus = useCallback(() => setFocus(null), []);

  /**
   * Navigation that the Back gesture understands.
   *
   * Each move pushes an entry, so Back returns to the previous screen instead of
   * closing the app. Sheets push their own entry (see useDismiss in ui.tsx), so
   * Back closes an open sheet first and only then changes screen.
   */
  const go = useCallback((next: View) => {
    setView((current) => {
      if (current !== next) window.history.pushState({ view: next }, '');
      return next;
    });
  }, []);

  useEffect(() => {
    // Stamp the entry we start on, so returning to it restores the right screen.
    window.history.replaceState({ view: 'plan' }, '');

    function onPop(event: PopStateEvent) {
      const next = (event.state as { view?: unknown } | null)?.view;
      // Entries a sheet pushed carry no view. Landing on one means a sheet just
      // closed, which is not a reason to change screen.
      if (isView(next)) setView(next);
    }

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const lines = useMemo(
    () => buildList(week.week.meals, week.week.extras),
    [week.week.meals, week.week.extras]
  );
  const counts = countLines(lines, week.week);
  const filled = Object.keys(week.week.meals).length;

  const metas: Record<string, string> = {
    plan: weekOffset === 0 ? 'pick meals' : 'other week',
    list: `${counts.toBuy} to buy`,
    week: `${filled}/${TOTAL_SLOTS}`,
    recipes: `${recipes.recipes.length}`,
  };

  /** From the Week screen: hand the slot to Plan and switch to it. */
  function openSlot(day: string, mealType: MealType) {
    setFocus({ day, mealType });
    go('plan');
  }

  return (
    <div className="app">
      {view === 'plan' && (
        <Plan
          week={week}
          recipes={recipes}
          focus={focus}
          onFocusHandled={clearFocus}
          weekDates={weekDates}
          weekOffset={weekOffset}
          onShiftWeek={shiftWeek}
          onResetWeek={resetWeek}
        />
      )}
      {view === 'list' && (
        <List
          week={week}
          weekDates={weekDates}
          weekOffset={weekOffset}
          onShiftWeek={shiftWeek}
          onResetWeek={resetWeek}
        />
      )}
      {view === 'week' && (
        <Week
          week={week}
          onOpenSlot={openSlot}
          onOpenList={() => go('list')}
          onOpenSettings={() => go('settings')}
          weekDates={weekDates}
          weekOffset={weekOffset}
          onShiftWeek={shiftWeek}
          onResetWeek={resetWeek}
        />
      )}
      {view === 'recipes' && <Recipes recipes={recipes} />}
      {view === 'settings' && (
        <Settings
          user={session.user}
          familyId={familyId}
          cookbookId={session.cookbookId}
          onBack={() => window.history.back()}
        />
      )}

      {/* Settings is a destination rather than a place you live, so it sits
          outside the bar and comes back with Back. */}
      {view !== 'settings' && (
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.view}
              className={view === tab.view ? 'tab is-active' : 'tab'}
              onClick={() => go(tab.view)}
              aria-current={view === tab.view ? 'page' : undefined}
            >
              <span className="tab-label">{tab.label}</span>
              <span className="tab-meta">{metas[tab.view]}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

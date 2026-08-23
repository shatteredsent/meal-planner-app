/**
 * The whole app: an auth gate, three tabs, and two screens reached from Week.
 *
 * The data hooks run here, once, and are passed down as props. There is no
 * context and no router — with five screens and one live document, neither pays
 * for itself.
 */

import { useCallback, useMemo, useState } from 'react';
import { MEAL_TYPES, TOTAL_SLOTS } from './types';
import type { MealType } from './types';
import { useSession } from './hooks/useSession';
import { useWeek } from './hooks/useWeek';
import { useRecipes } from './hooks/useRecipes';
import { buildList, countLines } from './lib/shoppingList';
import { Loading } from './components/ui';
import type { SlotTarget } from './components/MealPicker';
import Login from './screens/Login';
import FamilySetup from './screens/FamilySetup';
import Plan from './screens/Plan';
import List from './screens/List';
import Week from './screens/Week';
import Recipes from './screens/Recipes';
import Settings from './screens/Settings';

type View = 'plan' | 'list' | 'week' | 'recipes' | 'settings';

const TABS: { view: View; label: string }[] = [
  { view: 'plan', label: 'Plan' },
  { view: 'list', label: 'List' },
  { view: 'week', label: 'Week' },
];

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

  // Remounts on a family change, which resets every screen's local state along
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
  const week = useWeek(familyId);
  const recipes = useRecipes(familyId);

  const [view, setView] = useState<View>('plan');
  const [focus, setFocus] = useState<SlotTarget | null>(null);

  const clearFocus = useCallback(() => setFocus(null), []);

  const lines = useMemo(
    () => buildList(week.week.meals, week.week.extras),
    [week.week.meals, week.week.extras]
  );
  const counts = countLines(lines, week.week);
  const filled = Object.keys(week.week.meals).length;

  const metas: Record<string, string> = {
    plan: `${MEAL_TYPES.length} a day`,
    list: `${counts.toBuy} to buy`,
    week: `${filled}/${TOTAL_SLOTS}`,
  };

  /** From the Week screen: hand the slot to Plan and switch to it. */
  function openSlot(day: string, mealType: MealType) {
    setFocus({ day, mealType });
    setView('plan');
  }

  return (
    <div className="app">
      {view === 'plan' && (
        <Plan
          week={week}
          recipes={recipes}
          focus={focus}
          onFocusHandled={clearFocus}
        />
      )}
      {view === 'list' && <List week={week} />}
      {view === 'week' && (
        <Week
          week={week}
          onOpenSlot={openSlot}
          onOpenList={() => setView('list')}
          onOpenRecipes={() => setView('recipes')}
          onOpenSettings={() => setView('settings')}
        />
      )}
      {view === 'recipes' && <Recipes recipes={recipes} onBack={() => setView('week')} />}
      {view === 'settings' && (
        <Settings
          user={session.user}
          familyId={familyId}
          onBack={() => setView('week')}
        />
      )}

      {/* Recipes and Settings sit outside the three-cell bar, as in the design. */}
      {view !== 'recipes' && view !== 'settings' && (
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.view}
              className={view === tab.view ? 'tab is-active' : 'tab'}
              onClick={() => setView(tab.view)}
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

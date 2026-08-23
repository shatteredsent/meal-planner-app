/**
 * List tab — shop the plan.
 *
 * There is no "Generate" button by design: the list reconciles itself against the
 * meal plan (see PlannerDataProvider), so what's on screen always matches what's
 * planned. Items are grouped by aisle in the order you walk the store, with
 * manually added things collected at the end.
 */
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { usePlannerData } from '../context/PlannerData';
import {
  GROCERY_CATEGORIES, MANUAL_GROUP_LABEL, ShoppingItem,
} from '../types/shoppingItem';
import StatBar from '../components/shopping/StatBar';
import AisleGroup from '../components/shopping/AisleGroup';
import AddItemRow from '../components/shopping/AddItemRow';
import ShoppingListSkeleton from '../components/ShoppingListSkeleton';
import ScreenHeader from '../components/ui/ScreenHeader';
import { color, type, GUTTER, RULE } from '../theme/tokens';
import { notify } from '../utils/dialog';

interface Group {
  label: string;
  items: ShoppingItem[];
}

export default function ShoppingListScreen() {
  const { plan, shopping } = usePlannerData();
  const {
    items, isLoading, hasError, addItem, toggleItem, togglePantry,
  } = shopping;

  const toBuy = items.filter((i) => !i.isChecked && !i.isPantry).length;
  const inCart = items.filter((i) => i.isChecked).length;
  const atHome = items.filter((i) => i.isPantry).length;

  const groups = useMemo<Group[]>(() => {
    const byAisle = GROCERY_CATEGORIES.map((category) => ({
      label: category,
      items: items
        .filter((item) => !item.isManual && item.category === category)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));

    // Manual items ignore their aisle — the design collects them at the end
    // under their own header, so what you typed stays where you can find it.
    const manual = items
      .filter((item) => item.isManual)
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...byAisle, { label: MANUAL_GROUP_LABEL, items: manual }].filter(
      (group) => group.items.length > 0
    );
  }, [items]);

  async function handleAddItem(name: string): Promise<void> {
    try {
      await addItem(name);
    } catch {
      notify('Error', 'Could not add the item. Please try again.');
    }
  }

  if (isLoading) return <ShoppingListSkeleton />;

  if (hasError) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Could not load your shopping list.</Text>
        <Text style={styles.errorSubText}>Check your connection and try again.</Text>
      </View>
    );
  }

  const plannedMeals = plan.meals.length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        kicker={`From ${plannedMeals} planned ${plannedMeals === 1 ? 'meal' : 'meals'}`}
        meta={`${items.length} ${items.length === 1 ? 'line' : 'lines'}`}
        title="Shopping list"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <StatBar toBuy={toBuy} inCart={inCart} atHome={atHome} />

          {items.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={type.body}>
                Your list fills itself in as you plan meals. Head to Plan and pick a
                dinner to start.
              </Text>
            </View>
          )}

          {groups.map((group) => (
            <AisleGroup
              key={group.label}
              label={group.label}
              items={group.items}
              onToggleChecked={toggleItem}
              onTogglePantry={togglePantry}
            />
          ))}

          <AddItemRow onAdd={handleAddItem} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  flex: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: 28,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: GUTTER,
    backgroundColor: color.bg,
  },
  errorText: {
    ...type.mealNameSmall,
    marginBottom: 4,
  },
  errorSubText: type.secondary,
});

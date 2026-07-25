/**
 * useShoppingList — manages the family shopping list in Firestore.
 *
 * The list has no "Generate" button: it reconciles itself against the meal plan
 * whenever the plan changes. Manual items and each row's checked / at-home state
 * survive that reconciliation untouched.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  updateDoc, doc, query, where, serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ShoppingItem, NewShoppingItem, normalizeShoppingItem,
} from '../types/shoppingItem';
import { Meal } from '../types/meal';
import { categorizeIngredient } from '../utils/categorize';
import { aggregatePlan, reconcile } from '../utils/aggregateShoppingList';

interface UseShoppingListResult {
  items: ShoppingItem[];
  isLoading: boolean;
  hasError: boolean;
  addItem: (name: string) => Promise<void>;
  toggleItem: (itemId: string, currentValue: boolean) => Promise<void>;
  togglePantry: (itemId: string, currentValue: boolean) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  clearCheckedItems: () => Promise<void>;
  /** Brings plan-derived rows in line with `meals`. Safe to call repeatedly. */
  reconcileFromPlan: (meals: Meal[]) => Promise<void>;
}

/**
 * A cheap fingerprint of what the plan should produce. Reconciliation is skipped
 * when this is unchanged, so a snapshot that only touched `isChecked` doesn't
 * trigger a pointless round of writes.
 */
function planSignature(meals: Meal[]): string {
  return aggregatePlan(meals)
    .map((line) => `${line.key}:${line.amount}:${line.days.join(',')}`)
    .sort()
    .join('|');
}

export function useShoppingList(familyId: string): UseShoppingListResult {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Latest snapshot, readable from reconcileFromPlan without making it a
  // dependency — otherwise every list change would re-trigger reconciliation.
  const itemsRef = useRef<ShoppingItem[]>([]);
  itemsRef.current = items;

  const isReconcilingRef = useRef(false);
  const lastSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!familyId) return;

    const itemsQuery = query(
      collection(db, 'shoppingItems'),
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => normalizeShoppingItem(d.id, d.data())));
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [familyId]);

  // A different family means a different list; forget what we reconciled.
  useEffect(() => {
    lastSignatureRef.current = null;
  }, [familyId]);

  async function addItem(name: string): Promise<void> {
    const trimmed = name.trim();
    const newItem: NewShoppingItem = {
      familyId,
      name: trimmed,
      category: categorizeIngredient(trimmed),
      quantity: { amount: 0, unit: '' },
      isChecked: false,
      isPantry: false,
      isManual: true,
      days: [],
      count: 1,
    };
    await addDoc(collection(db, 'shoppingItems'), {
      ...newItem,
      createdAt: serverTimestamp(),
    });
  }

  async function toggleItem(itemId: string, currentValue: boolean): Promise<void> {
    await updateDoc(doc(db, 'shoppingItems', itemId), {
      isChecked: !currentValue,
    });
  }

  async function togglePantry(itemId: string, currentValue: boolean): Promise<void> {
    await updateDoc(doc(db, 'shoppingItems', itemId), {
      isPantry: !currentValue,
    });
  }

  async function deleteItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'shoppingItems', itemId));
  }

  async function clearCheckedItems(): Promise<void> {
    const checkedItems = itemsRef.current.filter((item) => item.isChecked);
    if (checkedItems.length === 0) return;
    const batch = writeBatch(db);
    checkedItems.forEach((item) => {
      batch.delete(doc(db, 'shoppingItems', item.id));
    });
    await batch.commit();
  }

  /**
   * Sums the week's ingredients by `name|unit` and writes the difference.
   *
   * Guarded twice over, because this runs from an effect on live snapshots: the
   * signature check skips no-op runs, and the in-flight flag stops the writes
   * this call makes from re-entering through the listener they trigger.
   */
  const reconcileFromPlan = useCallback(
    async (meals: Meal[]): Promise<void> => {
      if (!familyId || isReconcilingRef.current) return;

      const signature = planSignature(meals);
      if (signature === lastSignatureRef.current) return;

      const lines = aggregatePlan(meals);
      const { toCreate, toUpdate, toDeleteIds } = reconcile(
        familyId,
        lines,
        itemsRef.current
      );

      if (toCreate.length === 0 && toUpdate.length === 0 && toDeleteIds.length === 0) {
        lastSignatureRef.current = signature;
        return;
      }

      isReconcilingRef.current = true;
      try {
        const batch = writeBatch(db);

        toCreate.forEach((item) => {
          batch.set(doc(collection(db, 'shoppingItems')), {
            ...item,
            createdAt: serverTimestamp(),
          });
        });
        toUpdate.forEach(({ id, changes }) => {
          batch.update(doc(db, 'shoppingItems', id), changes);
        });
        toDeleteIds.forEach((id) => {
          batch.delete(doc(db, 'shoppingItems', id));
        });

        await batch.commit();
        lastSignatureRef.current = signature;
      } catch {
        // Leave the signature unset so the next snapshot retries rather than
        // silently leaving the list out of step with the plan.
        setHasError(true);
      } finally {
        isReconcilingRef.current = false;
      }
    },
    [familyId]
  );

  return {
    items,
    isLoading,
    hasError,
    addItem,
    toggleItem,
    togglePantry,
    deleteItem,
    clearCheckedItems,
    reconcileFromPlan,
  };
}

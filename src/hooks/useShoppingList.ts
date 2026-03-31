/**
 * useShoppingList — manages the family shopping list in Firestore.
 * Supports auto-generating items from the week's meal plan and manual additions.
 */
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  updateDoc, doc, query, where, serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShoppingItem, NewShoppingItem, GroceryCategory } from '../types/shoppingItem';
import { Recipe } from '../types/recipe';
import { Meal } from '../types/meal';
import { categorizeIngredient } from '../utils/categorize';

interface UseShoppingListResult {
  items: ShoppingItem[];
  isLoading: boolean;
  hasError: boolean;
  addItem: (name: string) => Promise<void>;
  toggleItem: (itemId: string, currentValue: boolean) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  clearCheckedItems: () => Promise<void>;
  generateFromMealPlan: (meals: Meal[], recipes: Recipe[]) => Promise<void>;
}

export function useShoppingList(familyId: string): UseShoppingListResult {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    const itemsQuery = query(
      collection(db, 'shoppingItems'),
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const loadedItems: ShoppingItem[] = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<ShoppingItem, 'id'>),
        }));
        setItems(loadedItems);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [familyId]);

  async function addItem(name: string): Promise<void> {
    const newItem: NewShoppingItem = {
      familyId,
      name: name.trim(),
      category: categorizeIngredient(name),
      isChecked: false,
      isManual: true,
      count: 1
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

  async function deleteItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'shoppingItems', itemId));
  }

  async function clearCheckedItems(): Promise<void> {
    const checkedItems = items.filter((item) => item.isChecked);
    const batch = writeBatch(db);
    checkedItems.forEach((item) => {
      batch.delete(doc(db, 'shoppingItems', item.id));
    });
    await batch.commit();
  }

  // Aggregates ingredients from all recipes used in the current week's meal plan
  async function generateFromMealPlan(meals: Meal[], recipes: Recipe[]): Promise<void> {
  const recipeMap = new Map<string, string[]>();
  recipes.forEach((recipe) => {
    recipeMap.set(recipe.name.toLowerCase(), recipe.ingredients);
  });

  // Count how many times each ingredient appears across all recipes
  const ingredientCounts = new Map<string, number>();
  meals.forEach((meal) => {
    const ingredients = recipeMap.get(meal.recipeName.toLowerCase());
    if (!ingredients) return;
    ingredients.forEach((ingredient) => {
      const key = ingredient.toLowerCase().trim();
      ingredientCounts.set(key, (ingredientCounts.get(key) ?? 0) + 1);
    });
  });

  if (ingredientCounts.size === 0) return;

  // Skip ingredients already on the list
  const existingNames = new Set(items.map((i) => i.name.toLowerCase().trim()));

  const batch = writeBatch(db);
  ingredientCounts.forEach((count, key) => {
    if (existingNames.has(key)) return;

    // Find original casing from the recipes
    const originalName = meals
      .flatMap((meal) => recipeMap.get(meal.recipeName.toLowerCase()) ?? [])
      .find((i) => i.toLowerCase().trim() === key) ?? key;

    const docRef = doc(collection(db, 'shoppingItems'));
    const newItem: NewShoppingItem = {
      familyId,
      name: originalName,
      category: categorizeIngredient(originalName),
      isChecked: false,
      isManual: false,
      count,
    };
    batch.set(docRef, { ...newItem, createdAt: serverTimestamp() });
  });

  await batch.commit();
}

  return {
    items,
    isLoading,
    hasError,
    addItem,
    toggleItem,
    deleteItem,
    clearCheckedItems,
    generateFromMealPlan,
  };
}
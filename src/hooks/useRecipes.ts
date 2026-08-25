/**
 * The shared recipe library — a subcollection of the cookbook, so it needs no
 * owner field and no `where` clause.
 *
 * Keyed on cookbookId rather than familyId: several families can cook from one
 * library while each keeps its own week and shopping list.
 */

import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { NewRecipe, Recipe } from '../types';

export interface RecipesApi {
  recipes: Recipe[];
  isLoading: boolean;
  hasError: boolean;
  addRecipe: (recipe: NewRecipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

export function useRecipes(cookbookId: string): RecipesApi {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!cookbookId) return;

    setIsLoading(true);
    const ref = collection(db, 'cookbooks', cookbookId, 'recipes');

    return onSnapshot(
      ref,
      (snap) => {
        setRecipes(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Recipe)
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );
  }, [cookbookId]);

  return {
    recipes,
    isLoading,
    hasError,
    addRecipe: async (recipe) => {
      await addDoc(collection(db, 'cookbooks', cookbookId, 'recipes'), recipe);
    },
    deleteRecipe: async (id) => {
      await deleteDoc(doc(db, 'cookbooks', cookbookId, 'recipes', id));
    },
  };
}

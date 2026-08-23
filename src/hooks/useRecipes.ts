/**
 * The family's recipe library — a subcollection, so it needs no familyId field
 * and no `where` clause.
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

export function useRecipes(familyId: string): RecipesApi {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    setIsLoading(true);
    const ref = collection(db, 'families', familyId, 'recipes');

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
  }, [familyId]);

  return {
    recipes,
    isLoading,
    hasError,
    addRecipe: async (recipe) => {
      await addDoc(collection(db, 'families', familyId, 'recipes'), recipe);
    },
    deleteRecipe: async (id) => {
      await deleteDoc(doc(db, 'families', familyId, 'recipes', id));
    },
  };
}

/**
 * useRecipes — loads and manages recipes for the current family.
 * Subscribes to Firestore in real time so all family members see new recipes instantly.
 */
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc,
  deleteDoc, doc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Recipe, NewRecipe } from '../types/recipe';

interface UseRecipesResult {
  recipes: Recipe[];
  isLoading: boolean;
  hasError: boolean;
  addRecipe: (newRecipe: NewRecipe) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
}

export function useRecipes(familyId: string): UseRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    // Real-time listener scoped to this family's recipes
    const recipesQuery = query(
      collection(db, 'recipes'),
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(
      recipesQuery,
      (snapshot) => {
        const loadedRecipes: Recipe[] = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Recipe, 'id'>),
        }));
        setRecipes(loadedRecipes);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [familyId]);

  async function addRecipe(newRecipe: NewRecipe): Promise<void> {
    await addDoc(collection(db, 'recipes'), {
      ...newRecipe,
      createdAt: serverTimestamp(),
    });
  }

  async function deleteRecipe(recipeId: string): Promise<void> {
    await deleteDoc(doc(db, 'recipes', recipeId));
  }

  return { recipes, isLoading, hasError, addRecipe, deleteRecipe };
}
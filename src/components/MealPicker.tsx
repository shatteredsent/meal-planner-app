/**
 * Fill one slot: pick a recipe from the library, or just type what you're
 * having.
 */

import { useEffect, useState } from 'react';
import { MEAL_TYPE_LABELS } from '../types';
import type { Meal, MealType, Recipe } from '../types';
import { parseIngredientLines } from '../lib/parseIngredient';
import { Button, GroupHead, Sheet } from './ui';

export interface SlotTarget {
  day: string;
  mealType: MealType;
}

interface Props {
  target: SlotTarget | null;
  recipes: Recipe[];
  onPick: (meal: Meal) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onClose: () => void;
}

export function mealFromRecipe(recipe: Recipe): Meal {
  return {
    name: recipe.name,
    subtitle: recipe.subtitle,
    prepTime: recipe.prepTime,
    // Snapshot, so editing the recipe later doesn't rewrite this week.
    ingredients: recipe.ingredients,
    recipeId: recipe.id,
  };
}

export default function MealPicker({
  target,
  recipes,
  onPick,
  onViewRecipe,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [ingredientText, setIngredientText] = useState('');

  // A fresh sheet each time it opens, rather than last time's half-typed meal.
  useEffect(() => {
    if (target) {
      setName('');
      setIngredientText('');
    }
  }, [target]);

  if (!target) return null;

  const forThisSlot = recipes.filter((r) => r.mealType === target.mealType);

  function saveTyped() {
    const trimmed = name.trim();
    if (!trimmed) return;

    onPick({
      name: trimmed,
      subtitle: '',
      prepTime: '',
      ingredients: parseIngredientLines(ingredientText),
    });
  }

  return (
    <Sheet
      isOpen
      kicker={`${target.day} · ${MEAL_TYPE_LABELS[target.mealType]}`}
      title="What are we having?"
      onClose={onClose}
    >
      <div className="pad stack">
        <input
          className="input"
          placeholder="Type a meal — 'Leftovers', 'Tacos'"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveTyped()}
          aria-label="Meal name"
        />
        <textarea
          className="input"
          rows={3}
          placeholder={'Ingredients, one per line (optional)\n2 lb chicken thighs\n1 bunch kale'}
          value={ingredientText}
          onChange={(e) => setIngredientText(e.target.value)}
          aria-label="Ingredients"
        />
        <Button
          label="Put this on the plan"
          variant="accent"
          onClick={saveTyped}
          disabled={!name.trim()}
        />
        <p className="t-sec-sm">
          Ingredients are optional, but only what you list here reaches the
          shopping list.
        </p>
      </div>

      {forThisSlot.length > 0 && (
        <>
          <GroupHead
            label={`From your ${MEAL_TYPE_LABELS[target.mealType].toLowerCase()} recipes`}
            meta={String(forThisSlot.length)}
            ruleAbove
          />
          <ul>
            {forThisSlot.map((recipe) => (
              <li key={recipe.id} className="picker-row">
                <button
                  className="picker-pick"
                  onClick={() => onPick(mealFromRecipe(recipe))}
                >
                  <span className="t-meal-sm">{recipe.name}</span>
                  {recipe.subtitle && <span className="t-sec">{recipe.subtitle}</span>}
                  {recipe.prepTime && <span className="t-meta">{recipe.prepTime}</span>}
                </button>
                <button
                  className="picker-view t-meta"
                  onClick={() => onViewRecipe(recipe)}
                  aria-label={`View ${recipe.name}`}
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}

/** The recipe library, grouped by the slot each recipe belongs to. */

import { useState } from 'react';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '../types';
import type { NewRecipe, Recipe } from '../types';
import type { RecipesApi } from '../hooks/useRecipes';
import { Button, ErrorState, GroupHead, Header, Loading } from '../components/ui';
import RecipeDetail from '../components/RecipeDetail';
import RecipeForm from '../components/RecipeForm';

export default function Recipes({ recipes }: { recipes: RecipesApi }) {
  const [isAdding, setIsAdding] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);

  if (recipes.isLoading) return <Loading />;
  if (recipes.hasError) return <ErrorState what="recipes" />;

  const groups = MEAL_TYPES.map((mealType) => ({
    mealType,
    items: recipes.recipes.filter((r) => r.mealType === mealType),
  })).filter((group) => group.items.length > 0);

  async function save(recipe: NewRecipe) {
    await recipes.addRecipe(recipe);
    setIsAdding(false);
  }

  function remove() {
    const recipe = selected;
    if (!recipe) return;

    const ok = window.confirm(
      `Delete "${recipe.name}"?\n\nThis cannot be undone. Meals already planned ` +
        'from it stay planned.'
    );
    if (!ok) return;

    setSelected(null);
    void recipes.deleteRecipe(recipe.id);
  }

  return (
    <>
      <Header
        kicker={`${recipes.recipes.length} ${recipes.recipes.length === 1 ? 'recipe' : 'recipes'}`}
        title="Recipe library"
      />

      <div className="scroll">
        {recipes.recipes.length === 0 ? (
          <div className="empty">
            <p className="t-body">
              No recipes yet. Add one and it becomes available in the picker for
              whichever meal you assign it to.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.mealType}>
              <GroupHead
                label={MEAL_TYPE_LABELS[group.mealType]}
                meta={String(group.items.length)}
                ruleAbove
              />
              <ul>
                {group.items.map((recipe) => (
                  <li key={recipe.id}>
                    <button className="recipe-row" onClick={() => setSelected(recipe)}>
                      <span className="t-meal-sm">{recipe.name}</span>
                      {recipe.subtitle && <span className="t-sec">{recipe.subtitle}</span>}
                      <span className="recipe-row-meta">
                        {recipe.prepTime && <span className="t-meta">{recipe.prepTime}</span>}
                        <span className="t-meta">
                          {recipe.ingredients.length} ingredients
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <div className="pad">
          <Button label="Add a recipe" variant="accent" onClick={() => setIsAdding(true)} />
        </div>
      </div>

      <RecipeForm isOpen={isAdding} onSave={save} onClose={() => setIsAdding(false)} />

      {/* Opened from the library, so there is no slot to plan into. */}
      <RecipeDetail
        recipe={selected}
        onDelete={remove}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

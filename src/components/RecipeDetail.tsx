/**
 * One recipe, in full. Shown from the picker (where it can be planned) and from
 * the library (where it can be deleted).
 */

import { MEAL_TYPE_LABELS } from '../types';
import type { Recipe } from '../types';
import { formatQuantity } from '../lib/quantity';
import { Button, GroupHead, Sheet } from './ui';

interface Props {
  recipe: Recipe | null;
  /** Shown when the sheet was opened from a slot that can be filled. */
  onPlan?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function RecipeDetail({ recipe, onPlan, onDelete, onClose }: Props) {
  if (!recipe) return null;

  const meta = [
    recipe.prepTime,
    recipe.servings ? `serves ${recipe.servings}` : '',
    MEAL_TYPE_LABELS[recipe.mealType],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Sheet isOpen kicker={meta} title={recipe.name} onClose={onClose}>
      {recipe.subtitle && (
        <div className="empty">
          <p className="t-body">{recipe.subtitle}</p>
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <>
          <GroupHead label="Ingredients" meta={String(recipe.ingredients.length)} />
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${ingredient.name}-${index}`} className="shop-row">
                <span className="shop-main t-row">{ingredient.name}</span>
                <span className="shop-qty t-strong">
                  {formatQuantity(ingredient.amount, ingredient.unit)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {recipe.steps.length > 0 && (
        <>
          <GroupHead label="Method" meta={`${recipe.steps.length} steps`} ruleAbove />
          <ol>
            {recipe.steps.map((step, index) => (
              <li key={index} className="step">
                <span className="t-meta step-num">{index + 1}</span>
                <span className="t-body">{step}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="pad stack rule-top">
        {onPlan && <Button label="Put this on the plan" variant="accent" onClick={onPlan} />}
        {onDelete && <Button label="Delete recipe" variant="danger" onClick={onDelete} />}
      </div>
    </Sheet>
  );
}

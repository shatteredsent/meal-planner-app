/**
 * Add a recipe. Ingredients and steps are one-per-line textareas rather than
 * repeatable field rows — it's faster to type and there's no list state to keep.
 */

import { useState } from 'react';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '../types';
import type { MealType, NewRecipe } from '../types';
import { parseIngredientLines } from '../lib/parseIngredient';
import { Button, Sheet } from './ui';

interface Props {
  isOpen: boolean;
  onSave: (recipe: NewRecipe) => Promise<void>;
  onClose: () => void;
}

export default function RecipeForm({ isOpen, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('4');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [ingredientText, setIngredientText] = useState('');
  const [stepText, setStepText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function reset() {
    setName('');
    setSubtitle('');
    setPrepTime('');
    setServings('4');
    setMealType('dinner');
    setIngredientText('');
    setStepText('');
  }

  async function save() {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        subtitle: subtitle.trim(),
        prepTime: prepTime.trim(),
        servings: Number(servings) || 4,
        mealType,
        ingredients: parseIngredientLines(ingredientText),
        steps: stepText.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      reset();
    } catch {
      window.alert('Could not save that recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Sheet isOpen kicker="New recipe" title="Add a recipe" onClose={onClose}>
      <div className="pad stack">
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Recipe name"
        />
        <input
          className="input"
          placeholder="One-line description (optional)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          aria-label="Description"
        />

        <p className="t-sec-sm">
          Usually eaten at — a hint only. Every recipe can fill any slot.
        </p>
        <div className="seg">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              className={mealType === type ? 'is-on' : undefined}
              onClick={() => setMealType(type)}
              aria-pressed={mealType === type}
            >
              {MEAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="field-pair">
          <input
            className="input"
            placeholder="25 min"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            aria-label="Prep time"
          />
          <input
            className="input"
            type="number"
            min="1"
            placeholder="Serves"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            aria-label="Servings"
          />
        </div>

        <textarea
          className="input"
          rows={5}
          placeholder={'Ingredients, one per line\n2 lb chicken thighs\n1 bunch kale\n½ cup farro'}
          value={ingredientText}
          onChange={(e) => setIngredientText(e.target.value)}
          aria-label="Ingredients"
        />
        <textarea
          className="input"
          rows={4}
          placeholder={'Method, one step per line (optional)'}
          value={stepText}
          onChange={(e) => setStepText(e.target.value)}
          aria-label="Method"
        />

        <Button
          label={isSaving ? 'Saving…' : 'Save recipe'}
          variant="accent"
          onClick={save}
          disabled={isSaving || !name.trim()}
        />
      </div>
    </Sheet>
  );
}

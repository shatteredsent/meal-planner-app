// @vitest-environment jsdom

/** The duplicate-name guard. Three recipes reached the library twice without it. */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import RecipeForm from '../components/RecipeForm';

function open(existingNames: string[] = []) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <RecipeForm isOpen existingNames={existingNames} onSave={onSave} onClose={vi.fn()} />
  );
  return onSave;
}

const typeName = (value: string) =>
  fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value } });

beforeEach(() => cleanup());

describe('RecipeForm duplicate guard', () => {
  it('says nothing for a name that is not taken', () => {
    open(["Meatloaf (Faye's)"]);
    typeName('Pot Roast');

    expect(screen.queryByText(/already has a recipe/i)).toBeNull();
    expect(screen.getByText(/save recipe/i)).toBeTruthy();
  });

  it('warns when the name is already in the cookbook', () => {
    open(["Meatloaf (Faye's)"]);
    typeName("Meatloaf (Faye's)");

    expect(screen.getByText(/already has a recipe/i)).toBeTruthy();
  });

  it('ignores case and surrounding space', () => {
    open(['Hamburger Steaks']);
    typeName('  hamburger steaks  ');

    expect(screen.getByText(/already has a recipe/i)).toBeTruthy();
  });

  it('still allows it, but makes it deliberate', () => {
    const onSave = open(['Pancakes']);
    typeName('Pancakes');

    const button = screen.getByText(/save anyway/i);
    expect(button).toBeTruthy();

    fireEvent.click(button);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('does not warn on an empty name', () => {
    open(['Pancakes']);
    typeName('');

    expect(screen.queryByText(/already has a recipe/i)).toBeNull();
  });

  it('saves the typed name and parsed ingredients', async () => {
    const onSave = open([]);
    typeName('Pot Roast');
    fireEvent.change(screen.getByLabelText(/^ingredients$/i), {
      target: { value: '3 lb chuck roast\n1 lb carrots' },
    });
    fireEvent.click(screen.getByText(/save recipe/i));

    expect(onSave).toHaveBeenCalledTimes(1);
    const recipe = onSave.mock.calls[0][0];
    expect(recipe.name).toBe('Pot Roast');
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.ingredients[0]).toMatchObject({
      name: 'chuck roast', amount: 3, unit: 'lb', category: 'Meat & Seafood',
    });
    expect(recipe.ingredients[1]).toMatchObject({ name: 'carrots', category: 'Produce' });
  });
});

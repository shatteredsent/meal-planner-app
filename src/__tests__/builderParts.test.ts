import {
  describeSelection, selectionIngredients, EMPTY_SELECTION, PART_GROUPS,
  PART_GROUP_KEYS,
} from '../data/builderParts';

describe('describeSelection', () => {
  it('is not saveable with nothing picked, and shows the prompt copy', () => {
    const { name, subtitle, isReady } = describeSelection(EMPTY_SELECTION);

    expect(isReady).toBe(false);
    expect(name).toBe('Pick a protein or a vegetable');
    expect(subtitle).toBe('Add a base and a seasoning to round it out');
  });

  it('becomes saveable on a protein alone', () => {
    const result = describeSelection({ ...EMPTY_SELECTION, protein: 'p1' });

    expect(result.isReady).toBe(true);
    expect(result.name).toBe('Chicken thighs');
  });

  it('becomes saveable on a vegetable alone', () => {
    const result = describeSelection({ ...EMPTY_SELECTION, veg: 'v1' });

    expect(result.isReady).toBe(true);
    expect(result.name).toBe('Broccoli');
  });

  it('joins the protein and vegetable into the name', () => {
    const result = describeSelection({ ...EMPTY_SELECTION, protein: 'p4', veg: 'v1' });

    expect(result.name).toBe('Flank steak & Broccoli');
  });

  it('puts the base and seasoning in the subtitle', () => {
    const result = describeSelection({
      protein: 'p4',
      veg: 'v1',
      base: 'x1',
      finish: 'f2',
    });

    expect(result.subtitle).toBe('on jasmine rice, garlic soy glaze');
  });

  it('is not saveable on a base and seasoning alone', () => {
    // A pile of rice with a glaze on it is not a meal.
    const result = describeSelection({ ...EMPTY_SELECTION, base: 'x1', finish: 'f2' });

    expect(result.isReady).toBe(false);
    expect(result.name).toBe('Pick a protein or a vegetable');
  });
});

describe('selectionIngredients', () => {
  it('collects every picked option\'s ingredients', () => {
    const ingredients = selectionIngredients({
      protein: 'p4',
      veg: 'v1',
      base: 'x1',
      finish: 'f2',
    });

    // Flank steak + broccoli + rice + 3 glaze ingredients
    expect(ingredients).toHaveLength(6);
    expect(ingredients.map((i) => i.name)).toEqual([
      'Flank steak',
      'Broccoli',
      'Jasmine rice',
      'Soy sauce',
      'Sesame oil',
      'Garlic',
    ]);
  });

  it('returns nothing when nothing is picked', () => {
    expect(selectionIngredients(EMPTY_SELECTION)).toEqual([]);
  });
});

describe('PART_GROUPS', () => {
  it('carries the 28 options from the prototype', () => {
    const total = PART_GROUP_KEYS.reduce(
      (n, key) => n + PART_GROUPS[key].options.length,
      0
    );
    expect(total).toBe(28);
  });

  it('gives every option a quantified ingredient list', () => {
    for (const key of PART_GROUP_KEYS) {
      for (const option of PART_GROUPS[key].options) {
        expect(option.ingredients.length).toBeGreaterThan(0);
        for (const ingredient of option.ingredients) {
          expect(ingredient.name).toBeTruthy();
          expect(ingredient.amount).toBeGreaterThan(0);
          expect(ingredient.category).toBeTruthy();
        }
      }
    }
  });

  it('keeps option ids unique across all groups', () => {
    const ids = PART_GROUP_KEYS.flatMap((key) =>
      PART_GROUPS[key].options.map((o) => o.id)
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});

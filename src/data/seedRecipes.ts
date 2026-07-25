/**
 * The 14 recipes from the design prototype — 4 breakfast, 4 lunch, 6 dinner —
 * with full quantified ingredients and method steps.
 *
 * Used by `seed-recipes.js` to populate a family's library, and by the tests as
 * realistic fixtures. Aisle codes from the prototype map as:
 *   P → Produce, M → Meat & Seafood, D → Dairy & Eggs, N → Pantry, B → Bakery
 */
import { Ingredient } from '../types/recipe';
import { MealType } from '../types/meal';

export interface SeedRecipe {
  name: string;
  subtitle: string;
  mealType: MealType;
  prepTime: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  parts?: { protein?: string; veg?: string; base?: string; finish?: string };
}

export const SEED_RECIPES: SeedRecipe[] = [
  // ── Breakfast ───────────────────────────────────────────────────
  {
    name: 'Yogurt & Berry Bowls',
    subtitle: 'Nothing to cook — set it out and let everyone build their own.',
    mealType: 'breakfast',
    prepTime: '5 min',
    servings: 4,
    ingredients: [
      { name: 'Greek yogurt', amount: 32, unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Blueberries',  amount: 1,  unit: 'pint',  category: 'Produce' },
      { name: 'Bananas',      amount: 3,  unit: '',      category: 'Produce' },
      { name: 'Granola',      amount: 2,  unit: 'cup',   category: 'Pantry' },
      { name: 'Honey',        amount: 2,  unit: 'tbsp',  category: 'Pantry' },
    ],
    steps: [
      'Spoon yogurt into four bowls.',
      'Top with berries and sliced banana.',
      'Finish with granola and a drizzle of honey.',
    ],
  },
  {
    name: 'Cheddar Egg Scramble',
    subtitle: 'Soft eggs, sharp cheddar, thick toast. Ten minutes, start to plate.',
    mealType: 'breakfast',
    prepTime: '10 min',
    servings: 4,
    ingredients: [
      { name: 'Eggs',          amount: 8, unit: '',      category: 'Dairy & Eggs' },
      { name: 'Sharp cheddar', amount: 4, unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Butter',        amount: 2, unit: 'tbsp',  category: 'Dairy & Eggs' },
      { name: 'Scallions',     amount: 3, unit: '',      category: 'Produce' },
      { name: 'Sourdough',     amount: 4, unit: 'slice', category: 'Bakery' },
    ],
    steps: [
      'Beat the eggs with a good pinch of salt.',
      'Melt butter over low heat and add the eggs, stirring slowly.',
      'Off the heat, fold in cheddar and scallions.',
      'Toast the sourdough and serve straight away.',
    ],
  },
  {
    name: 'Cinnamon Oat Pancakes',
    subtitle: 'A weekend batch — double it and freeze half for Tuesday.',
    mealType: 'breakfast',
    prepTime: '25 min',
    servings: 4,
    ingredients: [
      { name: 'Flour',         amount: 2,   unit: 'cup',  category: 'Pantry' },
      { name: 'Rolled oats',   amount: 1,   unit: 'cup',  category: 'Pantry' },
      { name: 'Baking powder', amount: 2,   unit: 'tsp',  category: 'Pantry' },
      { name: 'Cinnamon',      amount: 1,   unit: 'tsp',  category: 'Pantry' },
      { name: 'Maple syrup',   amount: 0.5, unit: 'cup',  category: 'Pantry' },
      { name: 'Milk',          amount: 1.5, unit: 'cup',  category: 'Dairy & Eggs' },
      { name: 'Eggs',          amount: 2,   unit: '',     category: 'Dairy & Eggs' },
      { name: 'Butter',        amount: 3,   unit: 'tbsp', category: 'Dairy & Eggs' },
    ],
    steps: [
      'Whisk the dry ingredients together.',
      'Stir in milk, eggs and melted butter until just combined.',
      'Rest the batter 5 minutes, then griddle in butter until golden.',
      'Warm the syrup while the last batch cooks.',
    ],
  },
  {
    name: 'Overnight Oats',
    subtitle: 'Made the night before — grab and go on the busy mornings.',
    mealType: 'breakfast',
    prepTime: '5 min',
    servings: 4,
    ingredients: [
      { name: 'Rolled oats',    amount: 2, unit: 'cup',  category: 'Pantry' },
      { name: 'Chia seeds',     amount: 3, unit: 'tbsp', category: 'Pantry' },
      { name: 'Peanut butter',  amount: 4, unit: 'tbsp', category: 'Pantry' },
      { name: 'Milk',           amount: 2, unit: 'cup',  category: 'Dairy & Eggs' },
      { name: 'Bananas',        amount: 2, unit: '',     category: 'Produce' },
    ],
    steps: [
      'Divide oats, chia and peanut butter between four jars.',
      'Pour over the milk and stir well.',
      'Refrigerate overnight; top with banana in the morning.',
    ],
  },

  // ── Lunch ───────────────────────────────────────────────────────
  {
    name: 'Chicken Caesar Wraps',
    subtitle: 'Roast the chicken the night before and these come together cold.',
    mealType: 'lunch',
    prepTime: '20 min',
    servings: 4,
    ingredients: [
      { name: 'Chicken breast',   amount: 1, unit: 'lb',   category: 'Meat & Seafood' },
      { name: 'Romaine',          amount: 2, unit: 'head', category: 'Produce' },
      { name: 'Lemon',            amount: 1, unit: '',     category: 'Produce' },
      { name: 'Parmesan',         amount: 3, unit: 'oz',   category: 'Dairy & Eggs' },
      { name: 'Tortillas',        amount: 6, unit: '',     category: 'Bakery' },
      { name: 'Caesar dressing',  amount: 1, unit: 'cup',  category: 'Pantry' },
    ],
    steps: [
      'Slice the cooked chicken thin.',
      'Toss romaine with dressing, lemon and parmesan.',
      'Pile into tortillas, roll tight, halve on the diagonal.',
    ],
  },
  {
    name: 'Tomato Soup & Grilled Cheese',
    subtitle: 'The one everybody asks for when the weather turns.',
    mealType: 'lunch',
    prepTime: '35 min',
    servings: 4,
    ingredients: [
      { name: 'Crushed tomatoes', amount: 28, unit: 'oz',    category: 'Pantry' },
      { name: 'Olive oil',        amount: 2,  unit: 'tbsp',  category: 'Pantry' },
      { name: 'Onion',            amount: 1,  unit: '',      category: 'Produce' },
      { name: 'Garlic',           amount: 3,  unit: 'clove', category: 'Produce' },
      { name: 'Basil',            amount: 1,  unit: 'bunch', category: 'Produce' },
      { name: 'Sharp cheddar',    amount: 6,  unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Butter',           amount: 3,  unit: 'tbsp',  category: 'Dairy & Eggs' },
      { name: 'Sourdough',        amount: 8,  unit: 'slice', category: 'Bakery' },
    ],
    steps: [
      'Soften onion and garlic in olive oil.',
      'Add tomatoes, simmer 20 minutes, then blend smooth with the basil.',
      'Butter the bread, fill with cheddar, griddle until deep gold.',
      'Cut on the diagonal and serve with the soup.',
    ],
  },
  {
    name: 'Harvest Grain Bowl',
    subtitle: 'Roast the sweet potato in the same oven as tonight’s dinner.',
    mealType: 'lunch',
    prepTime: '40 min',
    servings: 4,
    ingredients: [
      { name: 'Farro',          amount: 1.5, unit: 'cup',   category: 'Pantry' },
      { name: 'Olive oil',      amount: 3,   unit: 'tbsp',  category: 'Pantry' },
      { name: 'Pumpkin seeds',  amount: 0.5, unit: 'cup',   category: 'Pantry' },
      { name: 'Sweet potato',   amount: 2,   unit: '',      category: 'Produce' },
      { name: 'Kale',           amount: 1,   unit: 'bunch', category: 'Produce' },
      { name: 'Lemon',          amount: 1,   unit: '',      category: 'Produce' },
      { name: 'Feta',           amount: 4,   unit: 'oz',    category: 'Dairy & Eggs' },
    ],
    steps: [
      'Cube and roast the sweet potato at 425°F for 25 minutes.',
      'Cook the farro until chewy-tender; drain.',
      'Massage the kale with lemon and oil.',
      'Build the bowls and scatter feta and seeds over.',
    ],
  },
  {
    name: 'Turkey & Havarti Sandwiches',
    subtitle: 'Packed lunch, no cooking. Wrap them tight the night before.',
    mealType: 'lunch',
    prepTime: '10 min',
    servings: 4,
    ingredients: [
      { name: 'Sliced turkey', amount: 1, unit: 'lb',    category: 'Meat & Seafood' },
      { name: 'Havarti',       amount: 6, unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Lettuce',       amount: 1, unit: 'head',  category: 'Produce' },
      { name: 'Tomato',        amount: 2, unit: '',      category: 'Produce' },
      { name: 'Rye bread',     amount: 8, unit: 'slice', category: 'Bakery' },
      { name: 'Mustard',       amount: 2, unit: 'tbsp',  category: 'Pantry' },
    ],
    steps: [
      'Spread mustard right to the edges of the bread.',
      'Layer turkey, havarti, tomato and lettuce.',
      'Wrap in paper and press flat.',
    ],
  },

  // ── Dinner ──────────────────────────────────────────────────────
  {
    name: 'Sheet-Pan Chicken & Roots',
    subtitle: 'One pan, one rack, no fuss. The pan does the washing-up favour.',
    mealType: 'dinner',
    prepTime: '50 min',
    servings: 4,
    parts: { protein: 'p1', veg: 'v3', base: 'x3', finish: 'f1' },
    ingredients: [
      { name: 'Chicken thighs', amount: 2.5, unit: 'lb',    category: 'Meat & Seafood' },
      { name: 'Carrots',        amount: 1,   unit: 'lb',    category: 'Produce' },
      { name: 'Potatoes',       amount: 2,   unit: 'lb',    category: 'Produce' },
      { name: 'Red onion',      amount: 2,   unit: '',      category: 'Produce' },
      { name: 'Rosemary',       amount: 1,   unit: 'bunch', category: 'Produce' },
      { name: 'Olive oil',      amount: 3,   unit: 'tbsp',  category: 'Pantry' },
    ],
    steps: [
      'Heat the oven to 425°F.',
      'Toss the vegetables with oil, salt and rosemary; spread on the pan.',
      'Nestle the thighs in skin-side up and season well.',
      'Roast 40–45 minutes until the skin crackles and the potatoes give.',
    ],
  },
  {
    name: 'Turkey Chili',
    subtitle: 'Makes enough for tomorrow’s lunch — that’s the whole point.',
    mealType: 'dinner',
    prepTime: '55 min',
    servings: 6,
    ingredients: [
      { name: 'Ground turkey',    amount: 2,  unit: 'lb',    category: 'Meat & Seafood' },
      { name: 'Kidney beans',     amount: 30, unit: 'oz',    category: 'Pantry' },
      { name: 'Crushed tomatoes', amount: 28, unit: 'oz',    category: 'Pantry' },
      { name: 'Chili powder',     amount: 2,  unit: 'tbsp',  category: 'Pantry' },
      { name: 'Onion',            amount: 2,  unit: '',      category: 'Produce' },
      { name: 'Bell pepper',      amount: 2,  unit: '',      category: 'Produce' },
      { name: 'Garlic',           amount: 4,  unit: 'clove', category: 'Produce' },
      { name: 'Sour cream',       amount: 8,  unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Sharp cheddar',    amount: 4,  unit: 'oz',    category: 'Dairy & Eggs' },
    ],
    steps: [
      'Brown the turkey hard in a wide pot; don’t stir too soon.',
      'Add onion, pepper and garlic, then the chili powder.',
      'Tip in tomatoes and beans and simmer 35 minutes.',
      'Serve with sour cream and cheddar on the table.',
    ],
  },
  {
    name: 'Lemon Salmon & Greens',
    subtitle: 'Fastest dinner of the week — twelve minutes in a hot oven.',
    mealType: 'dinner',
    prepTime: '25 min',
    servings: 4,
    parts: { protein: 'p3', veg: 'v2', finish: 'f1' },
    ingredients: [
      { name: 'Salmon fillets', amount: 2,   unit: 'lb',    category: 'Meat & Seafood' },
      { name: 'Lemon',          amount: 3,   unit: '',      category: 'Produce' },
      { name: 'Green beans',    amount: 1.5, unit: 'lb',    category: 'Produce' },
      { name: 'Dill',           amount: 1,   unit: 'bunch', category: 'Produce' },
      { name: 'Olive oil',      amount: 2,   unit: 'tbsp',  category: 'Pantry' },
      { name: 'Butter',         amount: 2,   unit: 'tbsp',  category: 'Dairy & Eggs' },
    ],
    steps: [
      'Heat the oven to 450°F.',
      'Oil the beans, spread on a tray, roast 6 minutes.',
      'Add the salmon, lemon slices and butter; roast 10–12 minutes more.',
      'Shower with dill and squeeze over the last lemon.',
    ],
  },
  {
    name: 'Baked Ziti',
    subtitle: 'Assemble in the afternoon, bake when everyone lands.',
    mealType: 'dinner',
    prepTime: '1 hr',
    servings: 6,
    ingredients: [
      { name: 'Ziti',             amount: 1,  unit: 'lb',    category: 'Pantry' },
      { name: 'Marinara',         amount: 24, unit: 'oz',    category: 'Pantry' },
      { name: 'Olive oil',        amount: 2,  unit: 'tbsp',  category: 'Pantry' },
      { name: 'Mozzarella',       amount: 12, unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Ricotta',          amount: 15, unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Parmesan',         amount: 2,  unit: 'oz',    category: 'Dairy & Eggs' },
      { name: 'Italian sausage',  amount: 1,  unit: 'lb',    category: 'Meat & Seafood' },
      { name: 'Basil',            amount: 1,  unit: 'bunch', category: 'Produce' },
    ],
    steps: [
      'Boil the ziti two minutes shy of the packet time.',
      'Brown the sausage and stir it through the marinara.',
      'Layer pasta, sauce, ricotta and mozzarella twice over.',
      'Bake at 400°F for 30 minutes; rest 10 before cutting.',
    ],
  },
  {
    name: 'Black Bean Tacos',
    subtitle: 'Meat-free and nobody minds. Set the toppings out in bowls.',
    mealType: 'dinner',
    prepTime: '20 min',
    servings: 4,
    ingredients: [
      { name: 'Black beans',     amount: 30, unit: 'oz',    category: 'Pantry' },
      { name: 'Corn tortillas',  amount: 12, unit: '',      category: 'Pantry' },
      { name: 'Cumin',           amount: 1,  unit: 'tbsp',  category: 'Pantry' },
      { name: 'Avocado',         amount: 3,  unit: '',      category: 'Produce' },
      { name: 'Lime',            amount: 3,  unit: '',      category: 'Produce' },
      { name: 'Cabbage',         amount: 1,  unit: 'head',  category: 'Produce' },
      { name: 'Cilantro',        amount: 1,  unit: 'bunch', category: 'Produce' },
      { name: 'Cotija',          amount: 4,  unit: 'oz',    category: 'Dairy & Eggs' },
    ],
    steps: [
      'Warm the beans with cumin and a splash of their liquid; mash lightly.',
      'Shred the cabbage and dress it with lime.',
      'Char the tortillas straight over the flame.',
      'Fill, then top with avocado, cotija and cilantro.',
    ],
  },
  {
    name: 'Beef & Broccoli Stir-Fry',
    subtitle: 'Cut everything first — the cooking takes eight minutes flat.',
    mealType: 'dinner',
    prepTime: '30 min',
    servings: 4,
    parts: { protein: 'p4', veg: 'v1', base: 'x1', finish: 'f2' },
    ingredients: [
      { name: 'Flank steak',  amount: 1.5,  unit: 'lb',    category: 'Meat & Seafood' },
      { name: 'Broccoli',     amount: 2,    unit: 'lb',    category: 'Produce' },
      { name: 'Ginger',       amount: 1,    unit: '',      category: 'Produce' },
      { name: 'Garlic',       amount: 4,    unit: 'clove', category: 'Produce' },
      { name: 'Scallions',    amount: 4,    unit: '',      category: 'Produce' },
      { name: 'Jasmine rice', amount: 2,    unit: 'cup',   category: 'Pantry' },
      { name: 'Soy sauce',    amount: 0.33, unit: 'cup',   category: 'Pantry' },
      { name: 'Sesame oil',   amount: 1,    unit: 'tbsp',  category: 'Pantry' },
    ],
    steps: [
      'Start the rice.',
      'Slice the steak thin against the grain.',
      'Sear the beef in batches, then the broccoli with a splash of water.',
      'Return everything to the pan with soy, ginger, garlic and sesame oil.',
    ],
  },
];

/**
 * Adds a set of plain breakfasts to a cookbook.
 *
 * Quantities are real, unlike the recipes carried over from the old app, so
 * these actually feed the shopping list. Everything serves 4.
 *
 * Idempotent: a recipe whose name already exists in the cookbook is skipped,
 * so this can be re-run safely.
 *
 * Run:
 *   node scripts/seed-breakfasts.cjs <service-account.json> <cookbookId> [--commit]
 */
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const keyPath = process.argv[2];
const cookbookId = process.argv[3];
const commit = process.argv.includes('--commit');

if (!keyPath || !cookbookId) {
  console.error('Usage: node scripts/seed-breakfasts.cjs <key.json> <cookbookId> [--commit]');
  process.exit(1);
}

initializeApp({ credential: cert(require(path.resolve(keyPath))) });
const db = getFirestore();

const P = 'Produce';
const M = 'Meat & Seafood';
const D = 'Dairy & Eggs';
const N = 'Pantry';
const B = 'Bakery';

const i = (name, amount, unit, category) => ({ name, amount, unit, category });

const BREAKFASTS = [
  {
    name: 'Bacon & Eggs',
    subtitle: 'The one everybody agrees on. Fifteen minutes, one pan if you rush it.',
    prepTime: '15 min',
    ingredients: [
      i('Bacon', 1, 'lb', M),
      i('Eggs', 8, '', D),
      i('Butter', 2, 'tbsp', D),
      i('Sourdough', 4, 'slice', B),
    ],
    steps: [
      'Lay the bacon in a cold pan and bring it up to medium — it renders better than dropping it into a hot one.',
      'Drain on paper towel, leaving a little fat in the pan.',
      'Fry the eggs in the bacon fat to your liking.',
      'Toast the bread and butter it while the eggs finish.',
    ],
  },
  {
    name: 'Pancakes',
    subtitle: 'From scratch in about the time the griddle takes to heat.',
    prepTime: '20 min',
    ingredients: [
      i('Flour', 2, 'cup', N),
      i('Sugar', 2, 'tbsp', N),
      i('Baking powder', 1, 'tbsp', N),
      i('Milk', 1.5, 'cup', D),
      i('Eggs', 2, '', D),
      i('Butter', 4, 'tbsp', D),
      i('Maple syrup', 1, 'cup', N),
    ],
    steps: [
      'Whisk the dry ingredients with a good pinch of salt.',
      'Beat in the milk, eggs and melted butter until just combined — lumps are fine, overmixing makes them tough.',
      'Rest the batter for five minutes while the griddle heats.',
      'Cook until bubbles hold on the surface, then flip once.',
    ],
  },
  {
    name: 'French Toast',
    subtitle: 'Best with bread a day past its prime.',
    prepTime: '20 min',
    ingredients: [
      i('Brioche', 8, 'slice', B),
      i('Eggs', 4, '', D),
      i('Milk', 1, 'cup', D),
      i('Cinnamon', 1, 'tsp', N),
      i('Vanilla extract', 1, 'tsp', N),
      i('Butter', 3, 'tbsp', D),
      i('Maple syrup', 1, 'cup', N),
    ],
    steps: [
      'Beat the eggs, milk, cinnamon and vanilla in a wide dish.',
      'Soak each slice for a few seconds a side — long enough to take up custard, not so long it falls apart.',
      'Fry in butter over medium until deep gold on both sides.',
    ],
  },
  {
    name: 'Biscuits & Gravy',
    subtitle: 'Sausage gravy over split biscuits. Not a light one.',
    prepTime: '30 min',
    ingredients: [
      i('Breakfast sausage', 1, 'lb', M),
      i('Flour', 0.25, 'cup', N),
      i('Milk', 3, 'cup', D),
      i('Biscuits', 8, '', B),
      i('Black pepper', 1, 'tsp', N),
    ],
    steps: [
      'Brown the sausage in a heavy pan, breaking it up as it goes.',
      'Scatter the flour over and cook it out for a minute in the fat.',
      'Add the milk a splash at a time, stirring, until it thickens.',
      'Season hard with black pepper. Spoon over split warm biscuits.',
    ],
  },
  {
    name: 'Scrambled Eggs & Toast',
    subtitle: 'Ten minutes, and better slow than fast.',
    prepTime: '10 min',
    ingredients: [
      i('Eggs', 8, '', D),
      i('Butter', 2, 'tbsp', D),
      i('Sharp cheddar', 4, 'oz', D),
      i('Scallions', 3, '', P),
      i('Sourdough', 4, 'slice', B),
    ],
    steps: [
      'Beat the eggs with a pinch of salt.',
      'Melt the butter over low heat, add the eggs and stir slowly and constantly.',
      'Pull them off while still glossy — they carry on cooking in the pan.',
      'Fold in the cheddar and scallions. Serve on toast.',
    ],
  },
  {
    name: 'Breakfast Burritos',
    subtitle: 'Make a batch and freeze what you do not eat.',
    prepTime: '25 min',
    ingredients: [
      i('Flour tortillas', 8, '', N),
      i('Eggs', 10, '', D),
      i('Breakfast sausage', 1, 'lb', M),
      i('Potatoes', 1, 'lb', P),
      i('Sharp cheddar', 8, 'oz', D),
      i('Salsa', 1, 'cup', N),
    ],
    steps: [
      'Dice and fry the potatoes until crisp; set aside.',
      'Brown the sausage, then scramble the eggs in the same pan.',
      'Warm the tortillas so they roll without splitting.',
      'Fill with potato, sausage, egg and cheese, then roll tightly.',
    ],
  },
  {
    name: 'Oatmeal',
    subtitle: 'Five minutes and endlessly adjustable.',
    prepTime: '10 min',
    ingredients: [
      i('Oats', 2, 'cup', N),
      i('Milk', 2, 'cup', D),
      i('Brown sugar', 4, 'tbsp', N),
      i('Cinnamon', 1, 'tsp', N),
      i('Bananas', 2, '', P),
      i('Walnuts', 0.5, 'cup', N),
    ],
    steps: [
      'Bring the milk and an equal splash of water to a simmer with a pinch of salt.',
      'Stir in the oats and cook for about five minutes.',
      'Top with brown sugar, cinnamon, sliced banana and walnuts.',
    ],
  },
  {
    name: 'Waffles',
    subtitle: 'Crisper than pancakes and no harder to make.',
    prepTime: '25 min',
    ingredients: [
      i('Flour', 2, 'cup', N),
      i('Sugar', 2, 'tbsp', N),
      i('Baking powder', 1, 'tbsp', N),
      i('Milk', 1.75, 'cup', D),
      i('Eggs', 2, '', D),
      i('Butter', 6, 'tbsp', D),
      i('Maple syrup', 1, 'cup', N),
    ],
    steps: [
      'Whisk the dry ingredients together with a pinch of salt.',
      'Beat in the milk, egg yolks and melted butter.',
      'Whip the whites to soft peaks and fold them through — this is what makes them light.',
      'Cook until the iron stops steaming.',
    ],
  },
  {
    name: 'Cheese Omelettes',
    subtitle: 'One pan, one at a time, three minutes each.',
    prepTime: '20 min',
    ingredients: [
      i('Eggs', 12, '', D),
      i('Butter', 4, 'tbsp', D),
      i('Sharp cheddar', 6, 'oz', D),
      i('Mushrooms', 8, 'oz', P),
      i('Bell pepper', 1, '', P),
    ],
    steps: [
      'Soften the mushrooms and pepper in a little butter; set aside.',
      'Beat three eggs per omelette with a pinch of salt.',
      'Pour into a buttered pan over medium-low, drawing the set edges in.',
      'While the top is still soft, add filling and cheese, then fold and slide out.',
    ],
  },
  {
    name: 'Yogurt & Berry Bowls',
    subtitle: 'Nothing to cook — set it out and let everyone build their own.',
    prepTime: '5 min',
    ingredients: [
      i('Greek yogurt', 32, 'oz', D),
      i('Blueberries', 1, 'pint', P),
      i('Strawberries', 1, 'lb', P),
      i('Granola', 2, 'cup', N),
      i('Honey', 2, 'tbsp', N),
    ],
    steps: [
      'Spoon the yogurt into bowls.',
      'Top with berries and granola.',
      'Finish with a drizzle of honey.',
    ],
  },
];

(async () => {
  console.log(commit ? 'SEEDING\n' : 'DRY RUN — nothing will be written\n');

  const recipesRef = db.collection('cookbooks').doc(cookbookId).collection('recipes');
  const existing = await recipesRef.get();
  if (existing.empty && !(await db.collection('cookbooks').doc(cookbookId).get()).exists) {
    throw new Error(`cookbook ${cookbookId} does not exist`);
  }

  const haveNames = new Set(
    existing.docs.map((d) => String(d.data().name ?? '').toLowerCase().trim())
  );
  console.log(`cookbook ${cookbookId} currently holds ${existing.size} recipes\n`);

  let added = 0;
  for (const r of BREAKFASTS) {
    if (haveNames.has(r.name.toLowerCase())) {
      console.log(`  skip   ${r.name} — already in the cookbook`);
      continue;
    }
    console.log(`  add    ${r.name}  (${r.ingredients.length} ingredients, ${r.steps.length} steps)`);
    added += 1;
    if (!commit) continue;

    await recipesRef.add({
      name: r.name,
      subtitle: r.subtitle,
      prepTime: r.prepTime,
      servings: 4,
      mealType: 'breakfast',
      ingredients: r.ingredients,
      steps: r.steps,
    });
  }

  console.log(`\n${added} to add.`);
  if (commit) {
    const after = await recipesRef.get();
    console.log(`cookbook now holds ${after.size} recipes`);
  } else {
    console.log('Re-run with --commit to write.');
  }
})().catch((e) => { console.error(e.message); process.exit(1); });

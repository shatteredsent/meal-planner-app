/**
 * One-time migration from the old flat collections to the nested family layout.
 *
 *   old: families/{uid} + recipes/{id} with a familyId field
 *   new: families/{CODE} + families/{CODE}/recipes/{id} + users/{uid}
 *
 * Recipes are carried over. Meal plans and shopping lists are not: they are
 * week-scoped and expire on their own, and the new shape derives the list from
 * the plan rather than storing it.
 *
 * Ingredients written as free text ('2 lb chicken thighs') are parsed *here*,
 * once, so the app itself never has to. The parser below is a deliberate copy of
 * src/lib/parseIngredient.ts — this file is throwaway, and a one-shot script
 * shouldn't need a build step to share code with the app.
 *
 * Run:
 *   npm i --no-save firebase-admin
 *   node scripts/migrate.cjs path/to/service-account.json
 *   node scripts/migrate.cjs path/to/service-account.json --commit
 *
 * Without --commit it only reports what it would do.
 *
 * CommonJS (.cjs) on purpose: package.json declares "type": "module", and this
 * script wants plain `require` without a build step.
 */

const path = require('path');
const admin = require('firebase-admin');

const keyPath = process.argv[2];
const commit = process.argv.includes('--commit');

if (!keyPath) {
  console.error('Usage: node scripts/migrate.cjs <service-account.json> [--commit]');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(keyPath))),
});
const db = admin.firestore();

// ─── Ingredient parsing (copy of src/lib/parseIngredient.ts) ─────────

const UNITS = [
  'lb', 'lbs', 'oz', 'cup', 'cups', 'tbsp', 'tsp', 'clove', 'cloves',
  'bunch', 'bunches', 'head', 'heads', 'slice', 'slices', 'pint', 'pints',
  'can', 'cans', 'package', 'packages', 'pkg', 'g', 'kg', 'ml', 'l', 'qt',
];

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67, '⅛': 0.125 };

const KEYWORDS = {
  'Produce': ['lettuce', 'romaine', 'spinach', 'kale', 'arugula', 'cabbage', 'broccoli', 'brussels', 'cauliflower', 'zucchini', 'cucumber', 'celery', 'carrot', 'onion', 'scallion', 'shallot', 'garlic', 'ginger', 'tomato', 'pepper', 'mushroom', 'avocado', 'lemon', 'lime', 'berry', 'berries', 'blueberr', 'strawberr', 'raspberr', 'apple', 'banana', 'orange', 'grape', 'herb', 'basil', 'cilantro', 'parsley', 'dill', 'rosemary', 'thyme', 'sage', 'green bean', 'asparagus', 'squash', 'radish', 'beet', 'potato', 'sweet potato', 'leek', 'fennel', 'peach', 'pear'],
  'Meat & Seafood': ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham', 'steak', 'flank', 'ground beef', 'ground turkey', 'brisket', 'ribs', 'thigh', 'breast', 'salmon', 'tuna', 'shrimp', 'tilapia', 'cod', 'fish', 'fillet', 'seafood', 'crab', 'lobster', 'scallop', 'pepperoni', 'prosciutto', 'salami'],
  'Dairy & Eggs': ['egg', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie', 'havarti', 'cotija', 'ricotta', 'half and half', 'heavy cream', 'whipping cream', 'ghee', 'tofu'],
  'Pantry': ['oil', 'olive oil', 'sesame oil', 'coconut oil', 'vinegar', 'salt', 'spice', 'paprika', 'cumin', 'oregano', 'cinnamon', 'chili powder', 'baking powder', 'sauce', 'marinara', 'broth', 'stock', 'mayo', 'mustard', 'dijon', 'ketchup', 'soy sauce', 'hot sauce', 'dressing', 'almond flour', 'coconut flour', 'flour', 'sugar', 'honey', 'maple syrup', 'syrup', 'nuts', 'almond', 'walnut', 'pecan', 'peanut butter', 'seed', 'chia', 'granola', 'oats', 'rice', 'farro', 'couscous', 'quinoa', 'pasta', 'ziti', 'noodle', 'bean', 'lentil', 'chickpea', 'canned', 'crushed tomato', 'tomato paste', 'coconut milk', 'baking', 'extract', 'tortilla'],
  'Bakery': ['bread', 'sourdough', 'rye', 'baguette', 'roll', 'bun', 'bagel', 'pita', 'wrap', 'naan', 'croissant', 'muffin', 'brioche', 'ciabatta'],
  'Frozen': ['frozen', 'ice cream', 'frozen vegetable', 'frozen fruit', 'edamame'],
};

const MATCH_ORDER = ['Frozen', 'Bakery', 'Meat & Seafood', 'Dairy & Eggs', 'Produce', 'Pantry'];

function categorize(name) {
  const normalized = String(name).toLowerCase().trim();
  for (const category of MATCH_ORDER) {
    if (KEYWORDS[category].some((keyword) => normalized.includes(keyword))) return category;
  }
  return 'Other';
}

function parseIngredient(raw) {
  const text = String(raw).trim();
  const plain = (name) => ({ name, amount: 0, unit: '', category: categorize(name) });

  const match = /^(\d+\s*\/\s*\d+|\d*\.?\d+|[½¼¾⅓⅔⅛])\s*([½¼¾⅓⅔⅛])?\s*(.*)$/.exec(text);
  if (!match) return plain(text);

  const [, head, trailingFraction, rest] = match;

  let amount;
  if (FRACTIONS[head] !== undefined) {
    amount = FRACTIONS[head];
  } else if (head.includes('/')) {
    const [n, d] = head.split('/').map((s) => Number(s.trim()));
    amount = d ? n / d : 0;
  } else {
    amount = Number(head);
  }
  if (trailingFraction) amount += FRACTIONS[trailingFraction] ?? 0;
  if (!Number.isFinite(amount)) return plain(text);

  const words = rest.trim().split(/\s+/);
  const candidate = (words[0] ?? '').toLowerCase().replace(/\.$/, '');
  const hasUnit = UNITS.includes(candidate);

  const unit = hasUnit ? candidate.replace(/s$/, '') : '';
  const name = (hasUnit ? words.slice(1) : words).join(' ').trim();
  if (!name) return plain(text);

  return { name, amount, unit, category: categorize(name) };
}

// ─── Normalising an old recipe ───────────────────────────────────────

function normalizeIngredient(raw) {
  if (typeof raw === 'string') {
    return raw.trim() ? parseIngredient(raw) : null;
  }
  if (raw && typeof raw === 'object' && typeof raw.name === 'string' && raw.name.trim()) {
    return {
      name: raw.name,
      amount: typeof raw.amount === 'number' ? raw.amount : 0,
      unit: typeof raw.unit === 'string' ? raw.unit : '',
      category: raw.category ?? categorize(raw.name),
    };
  }
  return null;
}

function normalizeRecipe(data) {
  return {
    name: data.name ?? 'Untitled',
    subtitle: data.subtitle ?? '',
    prepTime:
      typeof data.prepTime === 'string'
        ? data.prepTime
        : typeof data.prepTime === 'number'
          ? `${data.prepTime} min`
          : '',
    servings: typeof data.servings === 'number' ? data.servings : 4,
    mealType: ['breakfast', 'lunch', 'dinner'].includes(data.mealType)
      ? data.mealType
      : 'dinner',
    ingredients: (Array.isArray(data.ingredients) ? data.ingredients : [])
      .map(normalizeIngredient)
      .filter(Boolean),
    steps: (Array.isArray(data.steps) ? data.steps : []).filter(
      (s) => typeof s === 'string' && s.trim()
    ),
  };
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function freshCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = Array.from(
      { length: 6 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');

    if (!(await db.collection('families').doc(code).get()).exists) return code;
  }
  throw new Error('Could not find an unused family code.');
}

// ─── Migrate ─────────────────────────────────────────────────────────

async function main() {
  console.log(commit ? 'MIGRATING\n' : 'DRY RUN — nothing will be written\n');

  const oldFamilies = await db.collection('families').get();
  const seenUsers = new Map();

  for (const familyDoc of oldFamilies.docs) {
    const data = familyDoc.data();

    // A doc that already has `members` is in the new shape — skip it, so
    // re-running this is safe.
    if (Array.isArray(data.members)) {
      console.log(`- ${familyDoc.id}: already migrated, skipping`);
      continue;
    }

    const members = Array.isArray(data.adminUids) ? data.adminUids : [];
    const recipes = await db
      .collection('recipes')
      .where('familyId', '==', familyDoc.id)
      .get();

    const code = commit ? await freshCode() : 'DRYRUN';

    console.log(`- ${data.name ?? '(unnamed)'} -> families/${code}`);
    console.log(`    members: ${members.length}, recipes: ${recipes.size}`);

    for (const uid of members) {
      if (seenUsers.has(uid)) {
        console.log(
          `    ! ${uid} was already mapped to ${seenUsers.get(uid)}; ` +
            `pointing them at ${code} instead`
        );
      }
      seenUsers.set(uid, code);
    }

    if (!commit) continue;

    const batch = db.batch();
    batch.set(db.collection('families').doc(code), {
      name: data.name ?? 'My Family',
      members,
    });

    for (const recipeDoc of recipes.docs) {
      batch.set(
        db.collection('families').doc(code).collection('recipes').doc(recipeDoc.id),
        normalizeRecipe(recipeDoc.data())
      );
    }

    for (const uid of members) {
      batch.set(db.collection('users').doc(uid), { familyId: code }, { merge: true });
    }

    await batch.commit();
    console.log(`    written. Share this code to join: ${code}`);
  }

  console.log(
    commit
      ? '\nDone. The old families/recipes/mealPlans/shoppingItems documents were ' +
          'left in place — delete them from the console once you have checked the app.'
      : '\nDry run complete. Re-run with --commit to write.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

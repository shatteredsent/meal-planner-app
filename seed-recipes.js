/**
 * Seeds a family's recipe library with the 14 recipes from the design prototype.
 *
 * Run with:  node seed-recipes.js <familyId>
 *
 * Idempotent by name: a recipe whose name already exists for that family is
 * skipped, so re-running after adding a recipe to SEED_RECIPES only writes the
 * new one. Existing recipes are never modified.
 *
 * Needs ./new-service-account.json (gitignored) for admin credentials.
 */
const admin = require('firebase-admin');

// The seed data lives in TypeScript next to the app code so the app and this
// script can't drift. Strip the annotations with esbuild's transform at load
// time rather than duplicating 300 lines of recipes here.
const { readFileSync } = require('fs');
const path = require('path');

function loadSeedRecipes() {
  const source = readFileSync(
    path.join(__dirname, 'src', 'data', 'seedRecipes.ts'),
    'utf8'
  );

  // The file's only runtime export is SEED_RECIPES, a plain array literal.
  // Everything else is types, so lifting the literal out is enough.
  const start = source.indexOf('export const SEED_RECIPES');
  if (start === -1) throw new Error('SEED_RECIPES not found in seedRecipes.ts');

  const arrayStart = source.indexOf('[', start);
  const literal = source.slice(arrayStart, source.lastIndexOf(']') + 1);

  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal};`)();
}

async function main() {
  const familyId = process.argv[2];
  if (!familyId) {
    console.error('Usage: node seed-recipes.js <familyId>');
    console.error("The familyId is the owning user's Firebase uid.");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(require('./new-service-account.json')),
  });
  const db = admin.firestore();

  const recipes = loadSeedRecipes();
  console.log(`Loaded ${recipes.length} seed recipes.`);

  const existing = await db
    .collection('recipes')
    .where('familyId', '==', familyId)
    .get();
  const existingNames = new Set(
    existing.docs.map((d) => (d.data().name || '').toLowerCase().trim())
  );
  console.log(`Family ${familyId} already has ${existing.size} recipes.`);

  let written = 0;
  let skipped = 0;

  for (const recipe of recipes) {
    if (existingNames.has(recipe.name.toLowerCase().trim())) {
      console.log(`  – skipped (already there): ${recipe.name}`);
      skipped++;
      continue;
    }

    await db.collection('recipes').add({
      familyId,
      name: recipe.name,
      subtitle: recipe.subtitle,
      mealType: recipe.mealType,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      ...(recipe.parts ? { parts: recipe.parts } : {}),
      isKetoFriendly: false,
      createdBy: familyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✓ ${recipe.name} (${recipe.ingredients.length} ingredients)`);
    written++;
  }

  console.log(`\nDone. Added ${written}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

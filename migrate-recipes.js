// One-time migration script — copies recipes from mealplannerapp-65b06 to family-meal-planner-b1421
// Run with: node migrate-recipes.js
const admin = require('firebase-admin');

// Initialize old project
const oldApp = admin.initializeApp({
  credential: admin.credential.cert(require('./old-service-account.json')),
}, 'old');

// Initialize new project
const newApp = admin.initializeApp({
  credential: admin.credential.cert(require('./new-service-account.json')),
}, 'new');

const oldDb = admin.firestore(oldApp);
const newDb = admin.firestore(newApp);

// Your UID in the new project — this is the familyId and createdBy value
const FAMILY_ID = 'FSreYokJffNFUCFMyPGRKP8j65D2';

async function migrateRecipes() {
  console.log('Starting recipe migration...');

  const oldRecipes = await oldDb.collection('recipes').get();
  console.log(`Found ${oldRecipes.size} recipes in old project`);

  if (oldRecipes.size === 0) {
    console.log('No recipes found — nothing to migrate.');
    return;
  }

  let successCount = 0;
  let skipCount = 0;

  for (const document of oldRecipes.docs) {
    const data = document.data();

    console.log(`\nProcessing: ${data.name}`);
    console.log(`  Raw ingredients: ${data.ingredients}`);

    if (!data.name) {
      console.log('  Skipping — no name found');
      skipCount++;
      continue;
    }

    // Convert ingredients from semicolon-separated string to array
    let ingredients = [];
    if (typeof data.ingredients === 'string') {
      ingredients = data.ingredients
        .split(';')
        .map((i) => i.trim())
        .filter((i) => i.length > 0);
    } else if (Array.isArray(data.ingredients)) {
      ingredients = data.ingredients;
    }

    const newRecipe = {
      familyId: FAMILY_ID,
      name: data.name,
      ingredients,
      isKetoFriendly: false,
      createdBy: FAMILY_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await newDb.collection('recipes').add(newRecipe);
    console.log(`  ✓ Migrated: ${data.name} (${ingredients.length} ingredients)`);
    successCount++;
  }

  console.log(`\nMigration complete!`);
  console.log(`  ✓ Migrated: ${successCount} recipes`);
  console.log(`  Skipped: ${skipCount} recipes`);
}

migrateRecipes().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
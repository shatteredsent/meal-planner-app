/**
 * Removes duplicate recipes from a cookbook, keeping one of each name.
 *
 * Which copy survives, in order of preference:
 *   1. one a planned meal still points at, so no plan loses its recipe link
 *   2. the one carrying more ingredients, then more steps
 *   3. the lower document id, purely so the choice is deterministic
 *
 * Run: node dedupe.cjs <key.json> <cookbookId> [--commit]
 */
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const keyPath = process.argv[2];
const cookbookId = process.argv[3];
const commit = process.argv.includes('--commit');
if (!keyPath || !cookbookId) { console.error('Usage: node dedupe.cjs <key.json> <cookbookId> [--commit]'); process.exit(1); }

initializeApp({ credential: cert(require(path.resolve(keyPath))) });
const db = getFirestore();

(async () => {
  console.log(commit ? 'DEDUPING\n' : 'DRY RUN — nothing will be written\n');

  // Every recipeId any planned meal still refers to, across every family.
  const referenced = new Map();
  const fams = await db.collection('families').get();
  for (const f of fams.docs) {
    const weeks = await f.ref.collection('weeks').get();
    for (const w of weeks.docs) {
      for (const [slot, meal] of Object.entries(w.data().meals || {})) {
        if (meal && meal.recipeId) {
          const at = `${f.data().name || f.id} ${w.id} ${slot}`;
          referenced.set(meal.recipeId, (referenced.get(meal.recipeId) || []).concat(at));
        }
      }
    }
  }
  console.log(`planned meals referencing a recipe: ${referenced.size}\n`);

  const ref = db.collection('cookbooks').doc(cookbookId).collection('recipes');
  const all = await ref.get();
  const groups = new Map();
  all.docs.forEach((d) => {
    const key = String(d.data().name || '').toLowerCase().trim();
    groups.set(key, (groups.get(key) || []).concat(d));
  });

  const doomed = [];
  for (const [, docs] of groups) {
    if (docs.length < 2) continue;
    const scored = docs.slice().sort((a, b) => {
      const A = a.data(), B = b.data();
      const aRef = referenced.has(a.id) ? 1 : 0, bRef = referenced.has(b.id) ? 1 : 0;
      if (aRef !== bRef) return bRef - aRef;
      const ai = (A.ingredients || []).length, bi = (B.ingredients || []).length;
      if (ai !== bi) return bi - ai;
      const as = (A.steps || []).length, bs = (B.steps || []).length;
      if (as !== bs) return bs - as;
      return a.id.localeCompare(b.id);
    });
    const keep = scored[0];
    const drop = scored.slice(1);
    console.log(`"${keep.data().name}" — ${docs.length} copies`);
    console.log(`   keep   ${keep.id}  ing=${(keep.data().ingredients||[]).length}` +
      (referenced.has(keep.id) ? `  <- referenced by ${referenced.get(keep.id).length} planned meal(s)` : ''));
    drop.forEach((d) => {
      console.log(`   delete ${d.id}  ing=${(d.data().ingredients||[]).length}` +
        (referenced.has(d.id) ? `  !! referenced by ${referenced.get(d.id).join(', ')}` : ''));
      doomed.push(d);
    });
  }

  if (doomed.length === 0) { console.log('No duplicates.'); return; }
  console.log(`\n${doomed.length} document(s) to delete.`);
  if (!commit) { console.log('Re-run with --commit to write.'); return; }

  for (const d of doomed) await d.ref.delete();
  const after = await ref.get();
  console.log(`\ncookbook now holds ${after.size} recipes`);
})().catch((e) => { console.error(e.message); process.exit(1); });

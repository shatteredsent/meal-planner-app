/**
 * One-time: move each family's recipes into a cookbook of its own.
 *
 *   before: families/{familyId}/recipes/{id}
 *   after:  cookbooks/{cookbookId}/recipes/{id}   + families/{familyId}.cookbookId
 *
 * Recipes are COPIED, not moved. The originals stay put so the currently
 * deployed app keeps working until the new one ships, and so this is safe to
 * re-run. Delete them once the new app is live and verified.
 *
 * Run:  node migrate-cookbook.cjs <service-account.json> [--commit]
 */
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const keyPath = process.argv[2];
const commit = process.argv.includes('--commit');
if (!keyPath) { console.error('Usage: node migrate-cookbook.cjs <key.json> [--commit]'); process.exit(1); }

initializeApp({ credential: cert(require(path.resolve(keyPath))) });
const db = getFirestore();

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function freshCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    if (!(await db.collection('cookbooks').doc(code).get()).exists) return code;
  }
  throw new Error('Could not find an unused cookbook code.');
}

(async () => {
  console.log(commit ? 'MIGRATING\n' : 'DRY RUN — nothing will be written\n');
  const families = await db.collection('families').get();

  for (const fam of families.docs) {
    const data = fam.data();
    if (!Array.isArray(data.members)) { console.log(`- ${fam.id}: pre-cookbook shape, skipping`); continue; }
    if (data.cookbookId) { console.log(`- ${data.name} (${fam.id}): already has cookbook ${data.cookbookId}, skipping`); continue; }

    const recipes = await fam.ref.collection('recipes').get();
    const code = commit ? await freshCode() : 'DRYRUN';
    console.log(`- ${data.name} (${fam.id}) -> cookbooks/${code}   recipes: ${recipes.size}`);
    if (!commit) continue;

    const batch = db.batch();
    batch.set(db.collection('cookbooks').doc(code), {
      name: `${data.name || 'Family'} recipes`,
      families: [fam.id],
    });
    recipes.docs.forEach((r) => {
      batch.set(db.collection('cookbooks').doc(code).collection('recipes').doc(r.id), r.data());
    });
    batch.set(fam.ref, { cookbookId: code }, { merge: true });
    await batch.commit();

    const moved = await db.collection('cookbooks').doc(code).collection('recipes').get();
    console.log(`    written. ${moved.size} recipes now in cookbook ${code}`);
  }
  console.log(commit
    ? '\nDone. The originals under families/*/recipes were left in place.'
    : '\nDry run complete. Re-run with --commit to write.');
})().catch((e) => { console.error(e); process.exit(1); });

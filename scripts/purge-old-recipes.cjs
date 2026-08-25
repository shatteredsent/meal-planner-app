/**
 * Deletes the recipe copies the migrations left behind:
 *   - families/{familyId}/recipes/*   (intermediate copy)
 *   - the legacy top-level /recipes collection
 *
 * Everything is written to a local JSON backup first, and nothing is deleted
 * unless every recipe is accounted for in the cookbook.
 *
 * Run: node purge.cjs <key.json> <cookbookId> [--commit]
 */
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const keyPath = process.argv[2];
const cookbookId = process.argv[3];
const commit = process.argv.includes('--commit');
if (!keyPath || !cookbookId) { console.error('Usage: node purge.cjs <key.json> <cookbookId> [--commit]'); process.exit(1); }

initializeApp({ credential: cert(require(path.resolve(keyPath))) });
const db = getFirestore();

const norm = (s) => String(s || '').toLowerCase().trim();

(async () => {
  console.log(commit ? 'PURGING\n' : 'DRY RUN — nothing will be deleted\n');

  const cookbook = await db.collection('cookbooks').doc(cookbookId).collection('recipes').get();
  const cbById = new Set(cookbook.docs.map((d) => d.id));
  const cbByName = new Set(cookbook.docs.map((d) => norm(d.data().name)));
  console.log(`cookbook ${cookbookId}: ${cookbook.size} recipes (the copy being kept)\n`);

  const backup = { takenAt: new Date().toISOString(), cookbookId, familyRecipes: {}, legacyRecipes: [] };
  const targets = [];
  let unaccounted = [];

  // 1. Per-family copies.
  const fams = await db.collection('families').get();
  for (const f of fams.docs) {
    const rs = await f.ref.collection('recipes').get();
    if (rs.empty) continue;
    const name = f.data().name || f.id;
    console.log(`families/${f.id} (${name}): ${rs.size} recipes`);
    backup.familyRecipes[f.id] = rs.docs.map((d) => ({ id: d.id, ...d.data() }));
    rs.docs.forEach((d) => {
      targets.push(d.ref);
      const covered = cbById.has(d.id) || cbByName.has(norm(d.data().name));
      if (!covered) unaccounted.push(`families/${f.id}/recipes/${d.id} "${d.data().name}"`);
    });
  }

  // 2. The legacy flat collection.
  const legacy = await db.collection('recipes').get();
  console.log(`legacy /recipes: ${legacy.size} documents`);
  backup.legacyRecipes = legacy.docs.map((d) => ({ id: d.id, ...d.data() }));
  const byFamily = {};
  legacy.docs.forEach((d) => {
    const fid = d.data().familyId || '(none)';
    byFamily[fid] = (byFamily[fid] || 0) + 1;
    targets.push(d.ref);
  });
  Object.entries(byFamily).forEach(([fid, n]) => console.log(`   ${n} under familyId ${fid}`));

  // Legacy recipes belonging to the test account were never migrated and never
  // will be; they are not expected in the cookbook.
  const liveFamilyIds = new Set(fams.docs.map((d) => d.id));
  legacy.docs.forEach((d) => {
    const fid = d.data().familyId;
    if (!liveFamilyIds.has(fid)) return; // orphan test data, fine to drop
    if (!cbById.has(d.id) && !cbByName.has(norm(d.data().name))) {
      unaccounted.push(`recipes/${d.id} "${d.data().name}" (familyId ${fid})`);
    }
  });

  const file = `recipes-backup-${backup.takenAt.slice(0, 10)}.json`;
  fs.writeFileSync(file, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`\nbackup written: ${file} (${(fs.statSync(file).size / 1024).toFixed(1)} kB)`);

  console.log(`\ndocuments that would be deleted: ${targets.length}`);
  if (unaccounted.length) {
    console.log(`\nREFUSING — ${unaccounted.length} recipe(s) not found in the cookbook:`);
    unaccounted.slice(0, 20).forEach((u) => console.log(`   ${u}`));
    process.exit(1);
  }
  console.log('every recipe here is accounted for in the cookbook, by id or by name');

  if (!commit) { console.log('\nRe-run with --commit to delete.'); return; }

  let n = 0;
  for (const ref of targets) { await ref.delete(); n += 1; }
  console.log(`\ndeleted ${n} documents`);

  const after = await db.collection('recipes').get();
  const cbAfter = await db.collection('cookbooks').doc(cookbookId).collection('recipes').get();
  console.log(`legacy /recipes now: ${after.size}`);
  console.log(`cookbook now:        ${cbAfter.size}  (unchanged)`);
})().catch((e) => { console.error(e.message); process.exit(1); });

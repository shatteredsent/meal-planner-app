/**
 * End-to-end security-rules test against the deployed rules, using real ID
 * tokens over the Firestore REST API. Uses a throwaway family and throwaway
 * users, then deletes them. Production data is never touched.
 */
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

initializeApp({ credential: cert(require(path.resolve('new-service-account.json'))) });
const db = getFirestore();
const auth = getAuth();

const PROJECT = 'family-meal-planner-b1421';
const API_KEY = 'AIzaSyB8tWZrDuDkyJs-gxMSuoeLIcwKjpuCNe4';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FAM = 'ZZTEST';

let pass = 0, fail = 0;

async function idTokenFor(uid) {
  const custom = await auth.createCustomToken(uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    { method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ token: custom, returnSecureToken: true }) }
  );
  const body = await res.json();
  if (!body.idToken) throw new Error('token exchange failed: ' + JSON.stringify(body));
  return body.idToken;
}

async function req(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status;
}

function check(label, actual, expected) {
  const ok = expected === 'allow' ? actual < 300 : actual >= 400;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  (expected ${expected}, http ${actual})`);
  ok ? pass++ : fail++;
}

const strArr = (...v) => ({ arrayValue: { values: v.map(s => ({ stringValue: s })) } });

(async () => {
  const memberUid = 'zz-test-member';
  const outsiderUid = 'zz-test-outsider';
  const thirdUid = 'zz-test-third';

  for (const uid of [memberUid, outsiderUid, thirdUid]) {
    try { await auth.createUser({ uid }); } catch { /* already exists */ }
  }

  await db.collection('families').doc(FAM).set({ name: 'Test', members: [memberUid] });

  const member = await idTokenFor(memberUid);
  const outsider = await idTokenFor(outsiderUid);
  const third = await idTokenFor(thirdUid);

  console.log('\n=== Family document ===');
  check('member reads the family', await req('GET', `${BASE}/families/${FAM}`, member), 'allow');
  check('outsider reads the family', await req('GET', `${BASE}/families/${FAM}`, outsider), 'deny');

  console.log('\n=== Subcollections (recipes, weeks) ===');
  check('member writes a week',
    await req('PATCH', `${BASE}/families/${FAM}/weeks/2026-08-17`, member,
      { fields: { checked: strArr('x|lb') } }), 'allow');
  check('member reads a week', await req('GET', `${BASE}/families/${FAM}/weeks/2026-08-17`, member), 'allow');
  check('outsider reads a week', await req('GET', `${BASE}/families/${FAM}/weeks/2026-08-17`, outsider), 'deny');
  check('outsider writes a week',
    await req('PATCH', `${BASE}/families/${FAM}/weeks/2026-08-17`, outsider,
      { fields: { checked: strArr('hacked') } }), 'deny');
  check('member writes a recipe',
    await req('PATCH', `${BASE}/families/${FAM}/recipes/r1`, member,
      { fields: { name: { stringValue: 'Test' } } }), 'allow');
  check('outsider writes a recipe',
    await req('PATCH', `${BASE}/families/${FAM}/recipes/r1`, outsider,
      { fields: { name: { stringValue: 'Hacked' } } }), 'deny');

  console.log('\n=== Joining by family code ===');
  check('outsider appends only their own uid',
    await req('PATCH', `${BASE}/families/${FAM}?updateMask.fieldPaths=members`, outsider,
      { fields: { members: strArr(memberUid, outsiderUid) } }), 'allow');
  check('outsider can read the family once joined',
    await req('GET', `${BASE}/families/${FAM}`, outsider), 'allow');

  console.log('\n=== Join clause cannot be abused ===');
  check('non-member cannot rename the family',
    await req('PATCH', `${BASE}/families/${FAM}?updateMask.fieldPaths=name`, third,
      { fields: { name: { stringValue: 'Stolen' } } }), 'deny');
  check('non-member cannot add someone else',
    await req('PATCH', `${BASE}/families/${FAM}?updateMask.fieldPaths=members`, third,
      { fields: { members: strArr(memberUid, outsiderUid, 'somebody-else') } }), 'deny');
  check('non-member cannot remove existing members',
    await req('PATCH', `${BASE}/families/${FAM}?updateMask.fieldPaths=members`, third,
      { fields: { members: strArr(thirdUid) } }), 'deny');
  check('non-member cannot rename while adding self',
    await req('PATCH', `${BASE}/families/${FAM}?updateMask.fieldPaths=members,name`, third,
      { fields: { members: strArr(memberUid, outsiderUid, thirdUid), name: { stringValue: 'Stolen' } } }), 'deny');
  check('non-member cannot delete the family',
    await req('DELETE', `${BASE}/families/${FAM}`, third), 'deny');

  console.log('\n=== users/{uid} ===');
  check('user writes their own mapping',
    await req('PATCH', `${BASE}/users/${memberUid}`, member,
      { fields: { familyId: { stringValue: FAM } } }), 'allow');
  check('user reads their own mapping', await req('GET', `${BASE}/users/${memberUid}`, member), 'allow');
  check("user reads someone else's mapping",
    await req('GET', `${BASE}/users/${memberUid}`, outsider), 'deny');
  check("user writes someone else's mapping",
    await req('PATCH', `${BASE}/users/${memberUid}`, outsider,
      { fields: { familyId: { stringValue: 'HACKED' } } }), 'deny');

  console.log('\n=== Retired collections are unreachable ===');
  for (const c of ['recipes', 'mealPlans', 'shoppingItems', 'invites']) {
    check(`${c} (old top-level) is closed`, await req('GET', `${BASE}/${c}`, member), 'deny');
  }

  // ── Cleanup ──
  console.log('\n=== Cleanup ===');
  for (const sub of ['weeks', 'recipes']) {
    const docs = await db.collection('families').doc(FAM).collection(sub).get();
    for (const d of docs.docs) await d.ref.delete();
  }
  await db.collection('families').doc(FAM).delete();
  for (const uid of [memberUid, outsiderUid, thirdUid]) {
    await db.collection('users').doc(uid).delete().catch(() => {});
    await auth.deleteUser(uid).catch(() => {});
  }
  console.log('  throwaway family, user docs and auth accounts removed');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

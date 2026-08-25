/** Drives the deployed app in a real browser to reproduce the picker bug. */
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { chromium, webkit, devices } = require('playwright');

initializeApp({ credential: cert(require(path.resolve('new-service-account.json'))) });
const auth = getAuth();
const db = getFirestore();

const URL = process.env.URL || 'https://family-meal-planner-b1421.web.app';
const ENGINE = process.env.ENGINE || 'chromium';
const EMAIL = 'zz-e2e@example.com';
// When set, the test account joins an existing family so the real data is
// exercised. Read-only: opening the picker writes nothing.
const JOIN = process.env.FAMILY || '';
const PASS = 'TestPass123!';
const NL = String.fromCharCode(10);

(async () => {
  try { await auth.deleteUser((await auth.getUserByEmail(EMAIL)).uid); } catch {}
  const user = await auth.createUser({ email: EMAIL, password: PASS });
  console.log('engine: ' + ENGINE + '   url: ' + URL + (JOIN ? '   family: ' + JOIN : ''));

  if (JOIN) {
    const { FieldValue } = require('firebase-admin/firestore');
    await db.collection('families').doc(JOIN).update({ members: FieldValue.arrayUnion(user.uid) });
    await db.collection('users').doc(user.uid).set({ familyId: JOIN });
  }

  const browser = await (ENGINE === 'webkit' ? webkit : chromium).launch();
  const context = await browser.newContext(devices['iPhone 13']);
  const page = await context.newPage();

  const log = [];
  page.on('console', (m) => log.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', (e) => log.push('[pageerror] ' + e.message));
  page.on('requestfailed', (r) => log.push('[reqfail] ' + r.url() + ' ' + (r.failure() || {}).errorText));

  async function cleanup() {
    await browser.close();
    if (JOIN) {
      const { FieldValue } = require('firebase-admin/firestore');
      await db.collection('families').doc(JOIN).update({ members: FieldValue.arrayRemove(user.uid) });
      await db.collection('users').doc(user.uid).delete().catch(() => {});
      await auth.deleteUser(user.uid).catch(() => {});
      console.log(NL + 'test account removed from ' + JOIN);
      return;
    }
    const snap = await db.collection('users').doc(user.uid).get();
    const fid = snap.data() && snap.data().familyId;
    if (fid) {
      for (const sub of ['weeks', 'recipes']) {
        const docs = await db.collection('families').doc(fid).collection(sub).get();
        for (const d of docs.docs) await d.ref.delete();
      }
      await db.collection('families').doc(fid).delete();
    }
    await db.collection('users').doc(user.uid).delete().catch(() => {});
    await auth.deleteUser(user.uid).catch(() => {});
    console.log(NL + 'test user and family removed');
  }

  async function bail(where) {
    console.log(NL + 'STUCK AT: ' + where);
    console.log('url: ' + page.url());
    console.log('--- visible text ---');
    const txt = await page.locator('body').innerText().catch(() => '(unavailable)');
    console.log(txt.slice(0, 800));
    console.log('--- browser console ---');
    console.log(log.length ? log.map((l) => '  ' + l).join(NL) : '  (none)');
    await page.screenshot({ path: 'e2e-stuck-' + ENGINE + '.png' });
    await cleanup();
    process.exit(1);
  }

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  await page.getByLabel('Email').fill(EMAIL).catch(() => bail('login form'));
  await page.getByLabel('Password').fill(PASS);
  await page.getByRole('button', { name: /^sign in$/i }).click();

  if (!JOIN) {
    await page.getByText('Your family').waitFor({ timeout: 20000 }).catch(() => bail('FamilySetup'));
    console.log('reached FamilySetup');
    await page.getByRole('button', { name: /start the family/i }).click();
  }

  const t0 = Date.now();
  await page.getByRole('button', { name: /choose breakfast/i })
    .waitFor({ timeout: 60000 })
    .catch(() => bail('Plan screen'));
  console.log('reached Plan screen after ' + (Date.now() - t0) + 'ms' + NL);
  // Recipes resolve through users -> families -> cookbooks, so they land after
  // the first paint. Wait for the library before judging what a picker shows.
  await page.waitForFunction(
    () => {
      const t = document.querySelector('.tab:nth-child(4) .tab-meta');
      return t && t.textContent && t.textContent.trim() !== '0';
    },
    { timeout: 15000 }
  ).catch(() => console.log('(library still empty after 15s)'));
  const recipeCount = await page.evaluate(() => {
    const t = document.querySelector('.tab:nth-child(4) .tab-meta');
    return t ? t.textContent : '?';
  });
  console.log('recipes in library: ' + recipeCount);

  const scrims = () => page.locator('.sheet-scrim').count();
  console.log('scrim before tap : ' + (await scrims()));

  for (const slot of ['breakfast', 'lunch', 'dinner']) {
    const b = page.getByRole('button', { name: new RegExp('choose ' + slot, 'i') });
    if (await b.count() === 0) { console.log(slot + ': no Choose button (slot filled)'); continue; }
    await b.tap();
    await page.waitForTimeout(800);
    const open = await scrims();
    const rows = await page.locator('.picker-row').count();
    console.log(slot + ': scrim=' + open + '  recipe rows=' + rows);
    if (open) {
      await page.screenshot({ path: 'e2e-picker-' + slot + '.png' });
      await page.locator('.sheet-head button').click();
      await page.waitForTimeout(500);
    }
  }

  console.log('scrim after tap  : ' + (await scrims()));
  console.log('sheet visible    : ' + (await page.locator('.sheet').isVisible().catch(() => false)));
  console.log('history length   : ' + (await page.evaluate(() => history.length)));
  console.log('history state    : ' + JSON.stringify(await page.evaluate(() => history.state)));
  const body = await page.locator('body').innerText();
  console.log('has picker title : ' + body.includes('What are we having'));

  await page.screenshot({ path: 'e2e-' + ENGINE + '.png' });
  console.log(NL + 'browser console:');
  console.log(log.length ? log.map((l) => '  ' + l).join(NL) : '  (none)');

  await cleanup();
})().catch(async (e) => { console.error(e); process.exit(1); });

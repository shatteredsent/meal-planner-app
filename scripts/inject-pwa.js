/**
 * Injects the PWA head tags into Expo's generated web export.
 *
 * Run with:  node scripts/inject-pwa.js [distDir]
 *
 * Expo's `expo export --platform web` emits an index.html with no manifest link
 * and no apple-touch metadata, so "Add to Home Screen" would give a plain
 * browser bookmark rather than a standalone app shell. Files in `public/` are
 * copied to the output verbatim (that's where manifest.json and the icons come
 * from) but the <head> is generated, so it has to be patched afterwards.
 *
 * Idempotent: re-running on an already-patched file changes nothing.
 */
const fs = require('fs');
const path = require('path');

const distDir = process.argv[2] || 'dist';
const APP_TITLE = 'Family Meal Planner';
const SHORT_TITLE = 'Meal Planner';
const THEME_COLOR = '#6a6ea8';

const MARKER = '<!-- pwa:injected -->';

const HEAD_TAGS = `    ${MARKER}
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="${THEME_COLOR}" />
    <meta name="description" content="Plan the week, shop it, review it." />
    <!-- iOS has no manifest support: standalone launch and the home-screen
         icon come from these apple-specific tags instead. -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="${SHORT_TITLE}" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />`;

function patch(file) {
  if (!fs.existsSync(file)) {
    console.log(`  skip (missing): ${file}`);
    return false;
  }

  let html = fs.readFileSync(file, 'utf8');

  if (html.includes(MARKER)) {
    console.log(`  already patched: ${file}`);
    return true;
  }

  // A generated title of "family-meal-planner" is what shows under the
  // home-screen icon, so give it a real name.
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${APP_TITLE}</title>`);

  // viewport-fit=cover lets the layout reach under the notch, which matters once
  // the app launches standalone without browser chrome.
  html = html.replace(
    /(<meta name="viewport" content="[^"]*)"/,
    (_m, start) =>
      start.includes('viewport-fit') ? `${start}"` : `${start}, viewport-fit=cover"`
  );

  if (!html.includes('</head>')) {
    throw new Error(`no </head> found in ${file} — Expo's template may have changed`);
  }
  html = html.replace('</head>', `${HEAD_TAGS}\n  </head>`);

  fs.writeFileSync(file, html, 'utf8');
  console.log(`  patched: ${file}`);
  return true;
}

const indexFile = path.join(distDir, 'index.html');
if (!fs.existsSync(indexFile)) {
  console.error(
    `inject-pwa: ${indexFile} not found. Run "expo export --platform web --output-dir ${distDir}" first.`
  );
  process.exit(1);
}

console.log('inject-pwa:');
patch(indexFile);
// Expo also emits 404.html; patching it keeps a deep-link refresh consistent.
patch(path.join(distDir, '404.html'));

// Fail loudly if the assets the tags point at are missing, rather than shipping
// a manifest that 404s.
for (const required of ['manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png']) {
  const p = path.join(distDir, required);
  if (!fs.existsSync(p)) {
    console.error(
      `inject-pwa: missing ${p}. It should be copied from public/ by the export.`
    );
    process.exit(1);
  }
}
console.log('  all referenced PWA assets present');

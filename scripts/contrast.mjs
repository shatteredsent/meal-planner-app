/**
 * Checks every foreground/background pair in styles.css against WCAG AA.
 *
 * The palette is soft by design, which makes it easy to drift into unreadable.
 * Run `npm run contrast` after touching a colour: it exits non-zero if any pair
 * carrying normal-size text drops below 4.5:1.
 */
const hex = (h) => [1,3,5].map(i => parseInt(h.slice(i, i+2), 16) / 255);
const lin = (c) => (c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055) ** 2.4);
const lum = (h) => { const [r,g,b] = hex(h).map(lin); return 0.2126*r + 0.7152*g + 0.0722*b; };
const ratio = (a,b) => { const [x,y] = [lum(a), lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };

const pairs = [
  ['Produce label',  '#3d6b51', '#e3f0e8'],
  ['Meat label',     '#8a555f', '#f6e5e8'],
  ['Dairy label',    '#45648c', '#e2ecf8'],
  ['Pantry label',   '#5c5495', '#e8e5f6'],
  ['Bakery label',   '#7a6344', '#f2eade'],
  ['Frozen label',   '#3e6b7b', '#dfeef3'],
  ['Other label',    '#566577', '#e8edf4'],
  ['Added label',    '#5a5fa0', '#edeefb'],
  ['Body on card',   '#2b3646', '#ffffff'],
  ['Body on bg',     '#2b3646', '#f5f8fc'],
  ['Soft on card',   '#566475', '#ffffff'],
  ['Mute on card',   '#636e7c', '#ffffff'],
  ['Mute on bg',     '#636e7c', '#f5f8fc'],
  ['Mute on surface','#636e7c', '#eaf0f8'],
  ['Accent btn text','#ffffff', '#6b70af'],
  ['Tab active',     '#5a5fa0', '#edeefb'],
  ['Kicker on card', '#5a5fa0', '#ffffff'],
  ['Danger on card', '#ae5f67', '#ffffff'],
  ['Day selected',   '#ffffff', '#6b70af'],
];

let worst = null;
for (const [name, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  const aa = r >= 4.5, aaLarge = r >= 3;
  const flag = aa ? 'AA  ' : aaLarge ? 'AA-large only' : 'FAIL';
  console.log(`${r.toFixed(2).padStart(5)}:1  ${flag.padEnd(14)} ${name}`);
  if (!worst || r < worst[1]) worst = [name, r];
}
console.log(`\nlowest: ${worst[0]} at ${worst[1].toFixed(2)}:1`);

// Pairs that only ever carry large or decorative marks may sit at AA-large.
const LARGE_OK = new Set(['Day selected']);
const failures = pairs.filter(([name, fg, bg]) =>
  ratio(fg, bg) < (LARGE_OK.has(name) ? 3 : 4.5)
);
if (failures.length) {
  console.error(`
${failures.length} pair(s) below target: ` + failures.map(f => f[0]).join(', '));
  process.exit(1);
}
console.log('all pairs pass');

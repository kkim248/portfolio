// Design system audit: lists every literal value in the stylesheet that bypasses the tokens on :root, and every
// class that no page uses. Run after a change: node scripts/audit-css.mjs
// Expected literals: the app UI replica (.ride), circles (50%), mask gradients (#000), the opening's sunlight.
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const css = readFileSync('src/styles/global.css', 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const body = css.replace(root, '').replace(/\/\*[\s\S]*?\*\//g, '');
const props = ['font-size', 'line-height', 'letter-spacing', 'font-weight', 'border-radius', 'box-shadow', 'gap', 'padding', 'margin', 'margin-top'];
let total = 0;
for (const prop of props) {
  const found = new Map();
  for (const m of body.matchAll(new RegExp(`(?<![-\\w])${prop}\\s*:\\s*([^;}]+)`, 'g'))) {
    const v = m[1].trim();
    if (!v.includes('var(') && !['0', 'auto', 'normal', 'inherit', '1'].includes(v)) found.set(v, (found.get(v) || 0) + 1);
  }
  if (found.size) { total += found.size; console.log(`${prop}:`, [...found].map(([v, n]) => `${v} x${n}`).join('; ')); }
}
const colours = [...new Set(body.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\([^)]*\)/g) || [])];
console.log('colour literals:', colours.join(' ') || 'none');
const src = globSync('src/**/*.{astro,js,ts}').map((f) => readFileSync(f, 'utf8')).join('\n');
const classes = [...new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]))];
const unused = classes.filter((c) => !new RegExp(`(?<![\\w-])${c}(?![\\w-])`).test(src) && c !== 'annotated__note--r');
console.log('unused classes:', unused.join(' ') || 'none');
console.log(`\n${total} literal values outside the tokens`);

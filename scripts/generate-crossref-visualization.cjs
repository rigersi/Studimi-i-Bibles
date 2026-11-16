// Generate a compact illustrative sample from the bundled OpenBible.info (CC BY) cross-references.
// Run from the repository root: node scripts/generate-crossref-visualization.cjs
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('index.html', 'utf8');
const line = prefix => source.slice(source.indexOf(prefix), source.indexOf('\n', source.indexOf(prefix)));
const ctx = {};
vm.runInNewContext(line('const B=').replace('const B=', 'globalThis.B=') + '\n' + line('const VERSES=').replace('const VERSES=', 'globalThis.VERSES='), ctx);
const starts = {}; let total = 0;
for (const book of ctx.B) { starts[book.id] = total; total += (ctx.VERSES[book.id] || []).reduce((a, n) => a + n, 0); }
function position(book, chapter, verse) {
  const chapters = ctx.VERSES[book];
  if (!chapters || !chapter || chapter > chapters.length) return null;
  return (starts[book] + chapters.slice(0, chapter - 1).reduce((a, n) => a + n, 0) + Math.min(verse || 1, chapters[chapter - 1])) / total;
}
const arcs = [];
for (const book of ctx.B) {
  const data = JSON.parse(fs.readFileSync(`crossrefs/${book.id}.json`));
  const count = Math.min(65, data.length);
  for (let i = 0; i < count; i++) {
    const row = data[Math.floor(i * data.length / count)];
    const from = position(book.id, row[0], row[1]), to = position(row[4], row[5], row[6]);
    if (from !== null && to !== null && Math.abs(from - to) > .001) arcs.push([+from.toFixed(5), +to.toFixed(5)]);
  }
}
fs.writeFileSync('assets/crossref-visualization.json', JSON.stringify(arcs));
console.log(`Generated ${arcs.length} illustrative connections.`);

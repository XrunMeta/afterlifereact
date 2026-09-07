#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REF_DIR = path.join(__dirname, '..', 'reference');
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const idiomsRaw = fs.readFileSync(path.join(REF_DIR, 'idioms.txt'), 'utf8');
const idiomsLines = idiomsRaw.split(/\r?\n/);
const idioms = [];
for (const rawLine of idiomsLines) {
  const line = rawLine.split('#')[0].trim();
  if (!line) continue;
  const parts = line.split('===');
  if (parts.length !== 2) continue;
  idioms.push([parts[0].trim(), parts[1].trim()]);
}
fs.writeFileSync(
  path.join(DATA_DIR, 'idioms.json'),
  JSON.stringify(idioms, null, 2),
  'utf8',
);
console.log(`✓ idioms.json ${idioms.length} 개 규칙`);

const tableRaw = fs.readFileSync(path.join(REF_DIR, 'table.csv'), 'utf8');
const tableLines = tableRaw.split(/\r?\n/).filter(Boolean);
const onsets = tableLines[0].split(','); 
const rules = [];
for (let i = 1; i < tableLines.length; i++) {
  const cols = tableLines[i].split(',');
  const coda = cols[0]; 
  if (!coda) continue;
  for (let j = 1; j < onsets.length; j++) {
    const cell = cols[j];
    if (!cell) continue;
    const onset = onsets[j];

    const ruleIds = [];
    const cleanCell = cell.replace(/\(([^)]+)\)/g, (_, ids) => {
      ids.split('/').forEach((id) => ruleIds.push(id));
      return '';
    });
    const pattern = coda + onset; 

    rules.push([pattern, cleanCell, ruleIds]);
  }
}
fs.writeFileSync(
  path.join(DATA_DIR, 'table.json'),
  JSON.stringify(rules, null, 2),
  'utf8',
);
console.log(`✓ table.json ${rules.length} 개 규칙`);

console.log('\ndone.');

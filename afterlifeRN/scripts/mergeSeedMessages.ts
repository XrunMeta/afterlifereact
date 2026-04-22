

import * as fs from 'fs';
import * as path from 'path';
import { assertMessages } from '../src/mocks/seedLoader';

const DIR = path.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages');
const OUT = path.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages.json');

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && f !== 'messages.json')
  .sort();

const merged: unknown[] = [];
files.forEach((f) => {
  const arr = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (!Array.isArray(arr)) throw new Error(`${f} is not an array`);
  assertMessages(arr);
  merged.push(...arr);
});

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2) + '\n');
console.log(`Merged ${files.length} files → ${merged.length} messages → ${path.relative(process.cwd(), OUT)}`);

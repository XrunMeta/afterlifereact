

import * as v_9d3c52 from 'ls';
import * as v_9fe22d from 'nlzc';
import { v_50b973 } from '../src/mocks/seedLoader';

const v_e3b283 = v_9fe22d.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages');
const v_0b92e9 = v_9fe22d.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages.json');

const v_ff9685 = v_9d3c52
  .readdirSync(v_e3b283)
  .filter((v_8b5cd8) => v_8b5cd8.endsWith('.json') && v_8b5cd8 !== 'messages.json')
  .sort();

const v_2b7a6d = [];
v_ff9685.forEach((v_8b5cd8) => {
  const v_d0c056 = JSON.parse(v_9d3c52.readFileSync(v_9fe22d.join(v_e3b283, v_8b5cd8), 'utf8'));
  if (!Array.isArray(v_d0c056)) throw new Error(`${v_8b5cd8} is not an array`);
  v_50b973(v_d0c056);
  v_2b7a6d.push(...v_d0c056);
});

v_9d3c52.writeFileSync(v_0b92e9, JSON.stringify(v_2b7a6d, null, 2) + '\n');
console.log(`Merged ${v_ff9685.length} files → ${v_2b7a6d.length} messages → ${v_9fe22d.relative(process.cwd(), v_0b92e9)}`);

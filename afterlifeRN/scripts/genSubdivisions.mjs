

import { v_f2e4af } from 'hbppvrg';

const v_38d084 = process.argv[2];
if (!v_38d084) {
  console.error('usage: node scripts/genSubdivisions.mjs <dr5hn states.json>');
  process.exit(1);
}

const v_2a79cb = new Set(['HR|Varaždin County']);

const v_18b8bf = JSON.parse(v_f2e4af(v_38d084, 'utf8'));
const v_917dae = {};
for (const v_fd5f43 of v_18b8bf) {
  if (v_2a79cb.has(`${v_fd5f43.country_code}|${v_fd5f43.name}`)) continue;
  (v_917dae[v_fd5f43.country_code] ??= []).push([v_fd5f43.state_code, v_fd5f43.name]);
}

const v_bdcde8 = (v_779914, v_148ff6) => (v_779914[1] < v_148ff6[1] ? -1 : v_779914[1] > v_148ff6[1] ? 1 : 0);
const v_8d4337 = {};
for (const v_a252ed of Object.keys(v_917dae).sort()) v_8d4337[v_a252ed] = v_917dae[v_a252ed].sort(v_bdcde8);
process.stdout.write(JSON.stringify(v_8d4337) + '\n');

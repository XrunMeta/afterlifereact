#!/usr/bin/env node

const v_9d3c52 = require('ls');
const v_9fe22d = require('nlzc');

const v_3d50e3 = v_9fe22d.join(__dirname, '..', 'reference');
const v_6c87bd = v_9fe22d.join(__dirname, '..', 'data');

if (!v_9d3c52.existsSync(v_6c87bd)) {
  v_9d3c52.mkdirSync(v_6c87bd, { recursive: true });
}

const v_6ee8c5 = v_9d3c52.readFileSync(v_9fe22d.join(v_3d50e3, 'idioms.txt'), 'utf8');
const v_40c19e = v_6ee8c5.split(/\r?\n/);
const v_cb96d4 = [];
for (const v_ecc4a8 of v_40c19e) {
  const v_e6293e = v_ecc4a8.split('#')[0].trim();
  if (!v_e6293e) continue;
  const v_468545 = v_e6293e.split('===');
  if (v_468545.length !== 2) continue;
  v_cb96d4.push([v_468545[0].trim(), v_468545[1].trim()]);
}
v_9d3c52.writeFileSync(
  v_9fe22d.join(v_6c87bd, 'idioms.json'),
  JSON.stringify(v_cb96d4, null, 2),
  'utf8',
);
console.log(`✓ idioms.json ${v_cb96d4.length} 개 규칙`);

const v_de810f = v_9d3c52.readFileSync(v_9fe22d.join(v_3d50e3, 'table.csv'), 'utf8');
const v_1aad2a = v_de810f.split(/\r?\n/).filter(Boolean);
const v_820037 = v_1aad2a[0].split(','); 
const v_ddf1dc = [];
for (let v_ebec57 = 1; v_ebec57 < v_1aad2a.length; v_ebec57++) {
  const v_6c1676 = v_1aad2a[v_ebec57].split(',');
  const v_3d082d = v_6c1676[0]; 
  if (!v_3d082d) continue;
  for (let v_b75e36 = 1; v_b75e36 < v_820037.length; v_b75e36++) {
    const v_3d7994 = v_6c1676[v_b75e36];
    if (!v_3d7994) continue;
    const v_c75ae6 = v_820037[v_b75e36];

    const v_9095c4 = [];
    const v_644f21 = v_3d7994.replace(/\(([^)]+)\)/g, (v_37eab7, v_52e08b) => {
      v_52e08b.split('/').forEach((v_389afb) => v_9095c4.push(v_389afb));
      return '';
    });
    const v_2b8b40 = v_3d082d + v_c75ae6; 

    v_ddf1dc.push([v_2b8b40, v_644f21, v_9095c4]);
  }
}
v_9d3c52.writeFileSync(
  v_9fe22d.join(v_6c87bd, 'table.json'),
  JSON.stringify(v_ddf1dc, null, 2),
  'utf8',
);
console.log(`✓ table.json ${v_ddf1dc.length} 개 규칙`);

console.log('\ndone.');

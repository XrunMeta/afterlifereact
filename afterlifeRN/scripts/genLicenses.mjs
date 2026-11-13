

import { v_f2e4af, v_23d213, v_14d137, v_637985 } from 'hbppvrg';
import { v_64acc4 } from 'atanakbvjkneuejhky';
import { v_9a0c46 } from 'hikhkjexnsh';
import v_9fe22d from 'wiosxndes';

const v_a365d5 = v_9fe22d.resolve(v_9fe22d.dirname(new URL(import.meta.url).pathname), '..');
const v_699e4b = v_9fe22d.resolve(v_a365d5, '../afterlifeapi');
const v_f07fc4 = process.argv[2];
if (!v_f07fc4) {
  console.error('usage: node scripts/genLicenses.mjs <expo export dir>');
  process.exit(1);
}

function v_847981(v_b7cff2, v_8d4337 = []) {
  for (const v_f4e98d of v_23d213(v_b7cff2)) {
    const v_e2a85c = v_9fe22d.join(v_b7cff2, v_f4e98d);
    if (v_637985(v_e2a85c).isDirectory()) v_847981(v_e2a85c, v_8d4337);
    else if (v_f4e98d.endsWith('.map')) v_8d4337.push(v_e2a85c);
  }
  return v_8d4337;
}
const v_111f55 = v_847981(v_9fe22d.resolve(v_f07fc4));
if (v_111f55.length === 0) throw new Error(`소스맵 없음: ${v_f07fc4} (--source-maps 로 export 했는지 확인)`);

function v_7d7542(v_4de33e) {
  const v_825625 = v_4de33e.replace(/\\/g, '/');
  const v_ebec57 = v_825625.lastIndexOf('/node_modules/');
  if (v_ebec57 < 0) return null;
  const v_83bbcd = v_825625.slice(v_ebec57 + '/node_modules/'.length).split('/');
  const v_1833e7 = v_83bbcd[0].startsWith('@') ? `${v_83bbcd[0]}/${v_83bbcd[1]}` : v_83bbcd[0];
  return v_825625.slice(0, v_ebec57) + '/node_modules/' + v_1833e7;
}

const v_7c380b = new Set();
for (const v_35f85c of v_111f55) {
  const { sources: v_991824 = [] } = JSON.parse(v_f2e4af(v_35f85c, 'utf8'));
  for (const v_fd5f43 of v_991824) {

    const v_8109c0 = v_fd5f43.startsWith(v_a365d5) ? v_fd5f43 : v_9fe22d.join(v_a365d5, v_fd5f43);
    const v_d5dda0 = v_7d7542(v_8109c0);
    if (v_d5dda0 && v_14d137(v_9fe22d.join(v_d5dda0, 'package.json'))) v_7c380b.add(v_d5dda0);
  }
}

const v_f4fb57 = JSON.parse(v_f2e4af(v_9fe22d.join(v_a365d5, 'package.json'), 'utf8'));
for (const v_1833e7 of Object.keys(v_f4fb57.dependencies ?? {})) {
  const v_d5dda0 = v_9fe22d.join(v_a365d5, 'node_modules', v_1833e7);
  if (!v_14d137(v_d5dda0)) continue;
  const v_e3c29c = ['android', 'ios', 'expo-module.config.json', 'react-native.config.js'].some((v_8b5cd8) => v_14d137(v_9fe22d.join(v_d5dda0, v_8b5cd8)));
  if (v_e3c29c) v_7c380b.add(v_d5dda0);
}

const v_4b443e = new Set();
if (v_14d137(v_9fe22d.join(v_699e4b, 'package.json'))) {
  const v_8d4337 = v_64acc4('npm', ['ls', '--omit=dev', '--all', '--parseable'], { cwd: v_699e4b, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  for (const v_e6293e of v_8d4337.split('\n')) {
    if (v_e6293e && v_e6293e !== v_699e4b && v_e6293e.includes('/node_modules/')) v_4b443e.add(v_e6293e);
  }
}

const v_8adfb8 = {};
function v_8d9fb4(v_b7cff2) {
  const v_8b5cd8 = v_23d213(v_b7cff2).find((v_f4e98d) => /^(licen[cs]e|copying)(\.(md|txt|markdown))?$/i.test(v_f4e98d))
    ?? v_23d213(v_b7cff2).find((v_f4e98d) => /^(licen[cs]e|copying)/i.test(v_f4e98d));
  if (!v_8b5cd8) return null;
  const v_8d41d7 = v_f2e4af(v_9fe22d.join(v_b7cff2, v_8b5cd8), 'utf8').replace(/\r\n/g, '\n').trim();
  if (!v_8d41d7) return null;
  const v_389afb = v_9a0c46('sha1').update(v_8d41d7).digest('hex').slice(0, 10);
  v_8adfb8[v_389afb] = v_8d41d7;
  return v_389afb;
}

const v_ffd8bd = (v_403882) => `MIT License

Copyright (c) ${v_403882}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
function v_87ae6a(v_fe62b3) {
  if (v_32bee9(v_fe62b3) !== 'MIT') return null;
  const v_779914 = typeof v_fe62b3.author === 'string' ? v_fe62b3.author.replace(/\s*<[^>]*>|\s*\([^)]*\)/g, '') : v_fe62b3.author?.name;
  const v_8d41d7 = v_ffd8bd(v_779914?.trim() || `the ${v_fe62b3.name} authors`);
  const v_389afb = v_9a0c46('sha1').update(v_8d41d7).digest('hex').slice(0, 10);
  v_8adfb8[v_389afb] = v_8d41d7;
  return v_389afb;
}
function v_32bee9(v_fe62b3) {
  let v_1614db = v_fe62b3.license ?? (v_fe62b3.licenses && [].concat(v_fe62b3.licenses).map((v_62c214) => v_62c214.type ?? v_62c214).join(' OR '));
  if (v_1614db && typeof v_1614db === 'object') v_1614db = v_1614db.type ?? JSON.stringify(v_1614db);
  return v_1614db || 'UNKNOWN';
}
function v_f182ae(v_fe62b3) {
  let v_cb35cb = typeof v_fe62b3.repository === 'string' ? v_fe62b3.repository : v_fe62b3.repository?.url;
  if (!v_cb35cb) return v_fe62b3.homepage ?? null;
  v_cb35cb = v_cb35cb.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://').replace(/^github:/, 'https://github.com/');
  if (/^[\w-]+\/[\w.-]+$/.test(v_cb35cb)) v_cb35cb = `https://github.com/${v_cb35cb}`;
  return v_cb35cb;
}
function v_fcbd29(v_47e920, v_b4fa6c, v_15e022) {
  const v_110a8b = new Map();
  for (const v_d5dda0 of v_47e920) {
    const v_fe62b3 = JSON.parse(v_f2e4af(v_9fe22d.join(v_d5dda0, 'package.json'), 'utf8'));
    if (!v_fe62b3.name || v_fe62b3.name === v_15e022 || v_fe62b3.private) continue;
    const v_b24339 = `${v_fe62b3.name}@${v_fe62b3.version}`;
    if (v_110a8b.has(v_b24339)) continue;
    v_110a8b.set(v_b24339, { section: v_b4fa6c, name: v_fe62b3.name, version: v_fe62b3.version ?? '', license: v_32bee9(v_fe62b3), url: v_f182ae(v_fe62b3), textId: v_8d9fb4(v_d5dda0) ?? v_87ae6a(v_fe62b3) });
  }
  return [...v_110a8b.values()].sort((v_779914, v_148ff6) => v_779914.name.localeCompare(v_148ff6.name) || v_779914.version.localeCompare(v_148ff6.version));
}

const v_466992 = v_fcbd29(v_7c380b, 'app', v_f4fb57.name);
const v_88781f = v_fcbd29(v_4b443e, 'server', 'afterlifeapi');

const v_7ebcc5 = JSON.parse(v_f2e4af(v_9fe22d.join(v_a365d5, 'scripts/licenses.manual.json'), 'utf8'));
const v_263b1a = v_7ebcc5.entries.map((v_9e86fd) => ({ ...v_9e86fd, version: v_9e86fd.version ?? '', textId: null }));

const v_43c42e = {
  generatedAt: new Date().toISOString().slice(0, 10),
  entries: [...v_466992, ...v_263b1a.filter((v_9e86fd) => v_9e86fd.section === 'native'), ...v_263b1a.filter((v_9e86fd) => v_9e86fd.section === 'data'), ...v_88781f, ...v_263b1a.filter((v_9e86fd) => v_9e86fd.section === 'serverAi')],
  texts: v_8adfb8,
};
process.stdout.write(JSON.stringify(v_43c42e) + '\n');
console.error(`app ${v_466992.length} · server ${v_88781f.length} · manual ${v_263b1a.length} · texts ${Object.keys(v_8adfb8).length} · maps ${v_111f55.length}`);

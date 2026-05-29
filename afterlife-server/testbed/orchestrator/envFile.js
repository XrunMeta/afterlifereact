import fs from 'node:fs';

export function loadCfEnv(filePath) {
  if (!filePath) return {};
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch {
    return {};
  }
  const out = {};
  for (const line of text.split('\n')) {
    const m = /^\s*(CF_REALTIME_[A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

import { activePorts } from './db.js';

export function allocatePort(db, base, count) {
  const used = new Set(activePorts(db));
  for (let p = base; p < base + count; p++) {
    if (!used.has(p)) return p;
  }
  return null;
}

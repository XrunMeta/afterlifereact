import { v_907127 } from './db.js';

export function v_6f976d(v_a1651b, v_694b25, v_9e8c70) {
  const v_87cbd5 = new Set(v_907127(v_a1651b));
  for (let v_e2a85c = v_694b25; v_e2a85c < v_694b25 + v_9e8c70; v_e2a85c++) {
    if (!v_87cbd5.has(v_e2a85c)) return v_e2a85c;
  }
  return null;
}

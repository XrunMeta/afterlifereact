import type { v_924690 } from '../types/domain';
import { v_35d5ed } from '../mocks/seedIndex';

let generated: v_924690[] = [];

function v_890508(): number {
  const v_0e12af = v_35d5ed.shorts.reduce((v_35f85c, v_fd5f43) => (v_fd5f43.id > v_35f85c ? v_fd5f43.id : v_35f85c), 0);
  const v_116251 = v_02d8db.reduce((v_35f85c, v_fd5f43) => (v_fd5f43.id > v_35f85c ? v_fd5f43.id : v_35f85c), 0);
  return Math.max(v_0e12af, v_116251) + 1;
}

export function v_bdea6c(v_6e0fd3): v_924690 {
  const row: v_924690 = {
    id: v_890508(),
    cloneId: v_6e0fd3,
    status: 'queued',
    mediaUrl: null,
    createdAt: new Date().toISOString(),
  };
  v_02d8db = [...v_02d8db, v_3ac7e7];
  return v_3ac7e7;
}

export function v_2d9aa2(): v_924690[] {
  return [...v_35d5ed.shorts, ...v_02d8db];
}

export function v_d745f1(v_53aa09): v_924690 | undefined {
  return v_2d9aa2().find((v_fd5f43) => v_fd5f43.id === v_53aa09);
}

export function v_5fbf8f(): void {
  v_02d8db = [];
}

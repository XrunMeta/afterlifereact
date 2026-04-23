

import { v_b7c41b } from 'zmui';
import type { v_de0a25 } from '../lib/env';
import { v_3ebe58 } from '../lib/errors';
import { v_6690d9 } from '../middleware/auth';
import { v_7adf64, v_5d4a51 } from '../lib/cloneAccess';

export const v_f07b70 = new v_b7c41b<v_de0a25>();

function v_a78f53(v_81e2ef, v_2869c1): number {
  const v_f4e98d = Number(v_81e2ef);
  if (!Number.isInteger(v_f4e98d) || v_f4e98d <= 0) {
    throw new v_3ebe58('VALIDATION_FAILED', `Invalid ${v_2869c1}.`);
  }
  return v_f4e98d;
}

async function v_979b07(v_a1651b, v_6e0fd3, v_43e90c): Promise<void> {
  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58('NOT_FOUND', 'Clone not found.');
  if (v_eb25ce.owner_id === v_43e90c) return;
  const v_22da99 = await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c);
  if (v_22da99 === 'owner') return;
  throw new v_3ebe58('FORBIDDEN', 'Owner privilege required.');
}

v_f07b70.post('/:id/shorts/generate', v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_a78f53(v_3f4e2e.req.param('id'), 'clone id');
  const v_43e90c = v_3f4e2e.get('userId')!;
  await v_979b07(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
  const v_43af15 = await v_3f4e2e.env.DB
    .prepare("INSERT INTO clone_shorts (clone_id, status) VALUES (?, 'queued') RETURNING id")
    .bind(v_6e0fd3)
    .first<{ id: number }>();
  return v_3f4e2e.json({ shortId: v_43af15!.id, status: 'queued' }, 202);
});

v_f07b70.get('/:id/shorts/:shortId', v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_a78f53(v_3f4e2e.req.param('id'), 'clone id');
  const v_53aa09 = v_a78f53(v_3f4e2e.req.param('shortId'), 'short id');
  const v_43e90c = v_3f4e2e.get('userId')!;
  await v_979b07(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare("SELECT id, status, media_url FROM clone_shorts WHERE id = ? AND clone_id = ?")
    .bind(v_53aa09, v_6e0fd3)
    .first<{ id: number; status: string; media_url: string | null }>();
  if (!v_3ac7e7) throw new v_3ebe58('NOT_FOUND', 'Short not found.');
  return v_3f4e2e.json({ shortId: v_3ac7e7.id, status: v_3ac7e7.status, mediaUrl: v_3ac7e7.media_url ?? null });
});

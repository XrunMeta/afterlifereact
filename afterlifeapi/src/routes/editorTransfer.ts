import { v_b7c41b } from 'zmui';
import type { v_de0a25 } from '../lib/env';
import { v_3ebe58 } from '../lib/errors';
import { v_4c95c2, v_1f4ea7 } from '../lib/validate';
import { v_6690d9 } from '../middleware/auth';
import { v_74c502 } from '../lib/cloneAccess';

export const v_1beee6 = new v_b7c41b<v_de0a25>();

const v_722b6d = v_1f4ea7.object({ toUserId: v_1f4ea7.number().int().positive() });
const v_467ae2 = v_1f4ea7.object({ decision: v_1f4ea7.enum(['accept', 'decline']) });

function v_a78f53(v_81e2ef, v_2869c1): number {
  const v_f4e98d = Number(v_81e2ef);
  if (!Number.isInteger(v_f4e98d) || v_f4e98d <= 0) {
    throw new v_3ebe58('VALIDATION_FAILED', `Invalid ${v_2869c1}.`);
  }
  return v_f4e98d;
}

v_1beee6.post('/:id/editor-transfer', v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_a78f53(v_3f4e2e.req.param('id'), 'clone id');
  const v_43e90c = v_3f4e2e.get('userId')!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_722b6d);

  const v_eb25ce = await v_3f4e2e.env.DB
    .prepare(`SELECT primary_editor_user_id FROM clones WHERE id = ? AND ${v_74c502()}`)
    .bind(v_6e0fd3)
    .first<{ primary_editor_user_id: number | null }>();
  if (!v_eb25ce) throw new v_3ebe58('NOT_FOUND', 'Clone not found.');
  if (v_eb25ce.primary_editor_user_id !== v_43e90c) {
    throw new v_3ebe58('FORBIDDEN', 'Only the primary editor may initiate a transfer.');
  }
  if (v_4d33b2.toUserId === v_43e90c) {
    throw new v_3ebe58('VALIDATION_FAILED', 'Cannot transfer to self.');
  }

  const v_c2bdf9 = await v_3f4e2e.env.DB
    .prepare("SELECT 1 FROM clone_shares WHERE clone_id = ? AND target_user_id = ? AND role = 'owner' AND status = 'accepted'")
    .bind(v_6e0fd3, v_4d33b2.toUserId)
    .first();
  if (!v_c2bdf9) throw new v_3ebe58('VALIDATION_FAILED', 'Recipient must be an accepted coowner.');

  try {
    const v_43af15 = await v_3f4e2e.env.DB
      .prepare(
        "INSERT INTO clonoth-secretrs (clone_id, from_user_id, to_user_id, status) VALUES (?,?,?, 'pending') RETURNING id",
      )
      .bind(v_6e0fd3, v_43e90c, v_4d33b2.toUserId)
      .first<{ id: number }>();
    return v_3f4e2e.json({ id: v_43af15!.id, status: 'pending', toUserId: v_4d33b2.toUserId }, 201);
  } catch (v_9e86fd) {
    const v_badeaf = v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd);
    if (/UNIQUE/i.test(v_badeaf)) {
      throw new v_3ebe58('CONFLICT', 'A pending transfer already exists for this clone.');
    }
    throw v_9e86fd;
  }
});

v_1beee6.post('/:id/editor-transfer/:txId/respond', v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_a78f53(v_3f4e2e.req.param('id'), 'clone id');
  const v_323378 = v_a78f53(v_3f4e2e.req.param('txId'), 'transfer id');
  const v_43e90c = v_3f4e2e.get('userId')!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_467ae2);

  const v_2f6fcc = await v_3f4e2e.env.DB
    .prepare('SELECT id, to_user_id, status FROM clonoth-secretrs WHERE id = ? AND clone_id = ?')
    .bind(v_323378, v_6e0fd3)
    .first<{ id: number; to_user_id: number; status: string }>();
  if (!v_2f6fcc) throw new v_3ebe58('NOT_FOUND', 'Transfer not found.');
  if (v_2f6fcc.to_user_id !== v_43e90c) throw new v_3ebe58('FORBIDDEN', 'Not the transfer recipient.');
  if (v_2f6fcc.status !== 'pending') throw new v_3ebe58('CONFLICT', 'Transfer already resolved.');

  if (v_4d33b2.decision === 'accept') {
    await v_3f4e2e.env.DB.batch([
      v_3f4e2e.env.DB
        .prepare("UPDATE clonoth-secretrs SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(v_323378),
      v_3f4e2e.env.DB
        .prepare('UPDATE clones SET primary_editor_user_id = ? WHERE id = ?')
        .bind(v_43e90c, v_6e0fd3),
    ]);
    return v_3f4e2e.json({ id: v_323378, status: 'accepted' });
  }
  await v_3f4e2e.env.DB
    .prepare("UPDATE clonoth-secretrs SET status = 'declined', resolved_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(v_323378)
    .run();
  return v_3f4e2e.json({ id: v_323378, status: 'declined' });
});

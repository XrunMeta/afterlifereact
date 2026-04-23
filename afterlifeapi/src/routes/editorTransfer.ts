import { Hono } from 'hono';
import type { AppEnv } from '../lib/env';
import { APIError } from '../lib/errors';
import { parseJson, z } from '../lib/validate';
import { requireAuth } from '../middleware/auth';

export const cloneEditorTransfer = new Hono<AppEnv>();

const createSchema = z.object({ toUserId: z.number().int().positive() });
const respondSchema = z.object({ decision: z.enum(['accept', 'decline']) });

function parseId(v: string, label: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) {
    throw new APIError('VALIDATION_FAILED', `Invalid ${label}.`);
  }
  return n;
}

cloneEditorTransfer.post('/:id/editor-transfer', requireAuth, async (c) => {
  const cloneId = parseId(c.req.param('id'), 'clone id');
  const userId = c.get('userId')!;
  const body = await parseJson(c, createSchema);

  const clone = await c.env.DB
    .prepare('SELECT primary_editor_user_id FROM clones WHERE id = ? AND deleted_at IS NULL')
    .bind(cloneId)
    .first<{ primary_editor_user_id: number | null }>();
  if (!clone) throw new APIError('NOT_FOUND', 'Clone not found.');
  if (clone.primary_editor_user_id !== userId) {
    throw new APIError('FORBIDDEN', 'Only the primary editor may initiate a transfer.');
  }
  if (body.toUserId === userId) {
    throw new APIError('VALIDATION_FAILED', 'Cannot transfer to self.');
  }

  const share = await c.env.DB
    .prepare("SELECT 1 FROM clone_shares WHERE clone_id = ? AND target_user_id = ? AND role = 'owner' AND status = 'accepted'")
    .bind(cloneId, body.toUserId)
    .first();
  if (!share) throw new APIError('VALIDATION_FAILED', 'Recipient must be an accepted coowner.');

  try {
    const ins = await c.env.DB
      .prepare(
        "INSERT INTO clone_editor_transfers (clone_id, from_user_id, to_user_id, status) VALUES (?,?,?, 'pending') RETURNING id",
      )
      .bind(cloneId, userId, body.toUserId)
      .first<{ id: number }>();
    return c.json({ id: ins!.id, status: 'pending', toUserId: body.toUserId }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNIQUE/i.test(msg)) {
      throw new APIError('CONFLICT', 'A pending transfer already exists for this clone.');
    }
    throw e;
  }
});

cloneEditorTransfer.post('/:id/editor-transfer/:txId/respond', requireAuth, async (c) => {
  const cloneId = parseId(c.req.param('id'), 'clone id');
  const txId = parseId(c.req.param('txId'), 'transfer id');
  const userId = c.get('userId')!;
  const body = await parseJson(c, respondSchema);

  const tx = await c.env.DB
    .prepare('SELECT id, to_user_id, status FROM clone_editor_transfers WHERE id = ? AND clone_id = ?')
    .bind(txId, cloneId)
    .first<{ id: number; to_user_id: number; status: string }>();
  if (!tx) throw new APIError('NOT_FOUND', 'Transfer not found.');
  if (tx.to_user_id !== userId) throw new APIError('FORBIDDEN', 'Not the transfer recipient.');
  if (tx.status !== 'pending') throw new APIError('CONFLICT', 'Transfer already resolved.');

  if (body.decision === 'accept') {
    await c.env.DB.batch([
      c.env.DB
        .prepare("UPDATE clone_editor_transfers SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(txId),
      c.env.DB
        .prepare('UPDATE clones SET primary_editor_user_id = ? WHERE id = ?')
        .bind(userId, cloneId),
    ]);
    return c.json({ id: txId, status: 'accepted' });
  }
  await c.env.DB
    .prepare("UPDATE clone_editor_transfers SET status = 'declined', resolved_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(txId)
    .run();
  return c.json({ id: txId, status: 'declined' });
});

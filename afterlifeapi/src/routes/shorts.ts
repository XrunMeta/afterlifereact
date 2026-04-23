

import { Hono } from 'hono';
import type { AppEnv } from '../lib/env';
import { APIError } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { hasAcceptedShare, loadCloneById } from '../lib/cloneAccess';

export const cloneShorts = new Hono<AppEnv>();

function parseId(v: string, label: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) {
    throw new APIError('VALIDATION_FAILED', `Invalid ${label}.`);
  }
  return n;
}

async function assertOwner(db: D1Database, cloneId: number, userId: number): Promise<void> {
  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError('NOT_FOUND', 'Clone not found.');
  if (clone.owner_id === userId) return;
  const role = await hasAcceptedShare(db, cloneId, userId);
  if (role === 'owner') return;
  throw new APIError('FORBIDDEN', 'Owner privilege required.');
}

cloneShorts.post('/:id/shorts/generate', requireAuth, async (c) => {
  const cloneId = parseId(c.req.param('id'), 'clone id');
  const userId = c.get('userId')!;
  await assertOwner(c.env.DB, cloneId, userId);
  const ins = await c.env.DB
    .prepare("INSERT INTO clone_shorts (clone_id, status) VALUES (?, 'queued') RETURNING id")
    .bind(cloneId)
    .first<{ id: number }>();
  return c.json({ shortId: ins!.id, status: 'queued' }, 202);
});

cloneShorts.get('/:id/shorts/:shortId', requireAuth, async (c) => {
  const cloneId = parseId(c.req.param('id'), 'clone id');
  const shortId = parseId(c.req.param('shortId'), 'short id');
  const userId = c.get('userId')!;
  await assertOwner(c.env.DB, cloneId, userId);
  const row = await c.env.DB
    .prepare("SELECT id, status, media_url FROM clone_shorts WHERE id = ? AND clone_id = ?")
    .bind(shortId, cloneId)
    .first<{ id: number; status: string; media_url: string | null }>();
  if (!row) throw new APIError('NOT_FOUND', 'Short not found.');
  return c.json({ shortId: row.id, status: row.status, mediaUrl: row.media_url ?? null });
});

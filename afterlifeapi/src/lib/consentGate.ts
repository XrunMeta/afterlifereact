
import type { Bindings } from './env';

export async function hasCallLearningConsent(env: Bindings, userId: number): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT call_learning_consent AS c FROM users WHERE id = ?",
  ).bind(userId).first<{ c: number }>();
  return row?.c === 1;
}

export async function personOwnerHasCallLearningConsent(env: Bindings, personId: number): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT u.call_learning_consent AS c
       FROM persons p JOIN users u ON u.id = p.user_id
      WHERE p.id = ?`,
  ).bind(personId).first<{ c: number }>();
  return row?.c === 1;
}

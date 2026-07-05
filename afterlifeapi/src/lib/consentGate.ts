
import type { v_273a0c } from './env';

export async function v_8d5056(env: v_273a0c, v_43e90c): Promise<boolean> {
  const v_3ac7e7 = await v_c9c489.DB.prepare(
    "SELECT call_learning_consent AS c FROM users WHERE id = ?",
  ).bind(v_43e90c).first<{ c: number }>();
  return v_3ac7e7?.c === 1;
}

export async function v_900412(env: v_273a0c, v_ca1ec5): Promise<boolean> {
  const v_3ac7e7 = await v_c9c489.DB.prepare(
    `SELECT u.call_learning_consent AS c
       FROM persons p JOIN users u ON u.id = p.user_id
      WHERE p.id = ?`,
  ).bind(v_ca1ec5).first<{ c: number }>();
  return v_3ac7e7?.c === 1;
}

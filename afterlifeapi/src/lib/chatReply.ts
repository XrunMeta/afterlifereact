

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";
import { v_a8614b } from "./ale";
import {
  v_60df93,
  v_c56968,
  v_386d00,
  type v_324976,
} from "./conversationMemory";

export interface RecentChat {
  role: "user" | "clone";
  text: string;
  at: number;
}

export interface ChatContext {
  prior: v_324976[];
  recent: RecentChat[];
}

const v_f3260b = 400;
const v_bb0956 = 2000;

const v_7fe98a = 300;
export const v_2115c8 = 20;

function v_15ea73(v_3a5fef): number {
  const v_6fc191 = v_3a5fef.replace(" ", "T");
  const v_d799e2 = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(v_6fc191) ? v_6fc191 : `${v_6fc191}Z`);
  return Number.isFinite(v_d799e2) ? v_d799e2 : 0;
}

export async function v_663c07(
  env: v_273a0c,
  v_43e90c,
  v_6e0fd3,
  v_5b53bc = v_2115c8,
): Promise<ChatContext> {
  const { turns: v_3035d9, resetAt: v_b98b4f } = await v_60df93(v_c9c489, {
    userId: v_43e90c, cloneId: v_6e0fd3, maxTurns: v_f3260b, includeChat: true,
  });

  const v_18b8bf = (await v_c9c489.DB.prepare(
    `SELECT id, role, content, created_at FROM messages
      WHERE user_id = ? AND clone_id = ?
        AND status = 'active' AND deletion_state = 'active' AND content IS NOT NULL
        AND datetime(created_at) > datetime(?, 'unixepoch')
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?`,
  ).bind(v_43e90c, v_6e0fd3, Math.floor(v_b98b4f / 1000), v_5b53bc)
    .all<{ id: number; role: string; content: string; created_at: string }>()).results ?? [];

  const { key: v_b24339, provider: v_e38ca2 } = await v_386d00(v_c9c489, v_43e90c, v_6e0fd3);
  const v_66ed66 = v_a8614b(v_c9c489.ALE_KEK);
  const v_4cd692 = [];
  for (const v_cb35cb of v_18b8bf.reverse()) {
    const v_9b6134 = await v_c56968(v_c9c489, v_b24339, v_e38ca2, v_66ed66, v_6e0fd3, v_cb35cb.role, v_cb35cb.content);
    if (v_9b6134 === null) continue;
    v_4cd692.push({ role: v_cb35cb.role === "user" ? "user" : "clone", text: v_9b6134, at: v_15ea73(v_cb35cb.created_at) });
  }

  const v_139a1f = new Set(v_18b8bf.map((v_cb35cb) => v_cb35cb.id));
  const v_2662e0 = v_3035d9.filter((v_8d41d7) => v_8d41d7.source !== "chat" || !v_139a1f.has(v_8d41d7.msgId ?? -1));
  return { prior: v_2662e0, recent: v_4cd692 };
}

export async function v_4dc423(
  env: v_273a0c,
  args: { cloneId: number; userToken: string; text: string; prior: v_324976[]; recent: RecentChat[] },
): Promise<string> {
  const v_694b25 = v_c9c489.PRETHIRD_PUBLIC_BASE;
  const v_43fd42 = v_c9c489.CHAT_REPLY_SECRET;
  if (!v_694b25 || !v_43fd42) {
    console.error(`[CHAT_REPLY_NOT_CONFIGURED] base=${!!v_694b25} secret=${!!v_43fd42}`);
    throw new v_3ebe58("SERVICE_UNAVAILABLE", "채팅 서비스가 설정되지 않았어요.");
  }
  const v_3f4675 = { "Content-Type": "application/json", "X-Internal-Secret": v_43fd42 };

  let v_eb792a;
  try {
    v_eb792a = await fetch(`${v_694b25}/prethird/chat/reply`, {
      method: "POST",
      headers: v_3f4675,
      body: JSON.stringify({
        clone_id: v_4317d1.cloneId,
        user_token: v_4317d1.userToken,
        text: v_4317d1.text,
        prior: v_4317d1.prior.map(({ callId: v_be62d3, role: v_22da99, text: v_9b6134, at: v_83d291 }) => ({
          callId: v_be62d3, role: v_22da99, text: v_9b6134.slice(0, v_bb0956), at: v_83d291,
        })),
        recent: v_4317d1.recent.map(({ role: v_22da99, text: v_9b6134 }) => ({ role: v_22da99, text: v_9b6134.slice(0, v_bb0956) })),
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (v_49263d) {
    console.warn(`[CHAT_REPLY_FETCH_FAIL] clone=${v_4317d1.cloneId} ${(v_49263d as Error).message}`);
    throw new v_3ebe58("UPSTREAM_FAILURE", "채팅 답장을 만들지 못했어요.");
  }
  if (!v_eb792a.ok) {
    console.warn(`[CHAT_REPLY_HTTP] clone=${v_4317d1.cloneId} status=${v_eb792a.status}`);
    throw new v_3ebe58("UPSTREAM_FAILURE", "채팅 답장을 만들지 못했어요.");
  }
  const v_4d33b2 = (await v_eb792a.json().catch(() => ({}))) as { reply?: unknown };
  if (typeof v_4d33b2.reply !== "string" || !v_4d33b2.reply.trim()) {
    throw new v_3ebe58("UPSTREAM_FAILURE", "채팅 답장이 비어 있어요.");
  }
  return v_4d33b2.reply;
}

export async function v_70ddfa(env: v_273a0c, v_43e90c): Promise<void> {
  const v_479f05 = Number(v_c9c489.CHAT_DAILY_LIMIT ?? v_7fe98a);
  const v_02be30 = Number.isInteger(v_479f05) && v_479f05 > 0 ? v_479f05 : v_7fe98a;
  const v_f606f1 =
    Math.floor((Date.now() + 9 * 3600_000) / 86_400_000) * 86_400 - 9 * 3600;
  const v_3ac7e7 = await v_c9c489.DB.prepare(
    `SELECT COUNT(*) AS n FROM messages
      WHERE user_id = ? AND role = 'user'
        AND datetime(created_at) >= datetime(?, 'unixepoch')`,
  ).bind(v_43e90c, v_f606f1).first<{ n: number }>();
  if ((v_3ac7e7?.n ?? 0) >= v_02be30) {
    console.warn(`[CHAT_DAILY_LIMIT] user=${v_43e90c} n=${v_3ac7e7?.n} limit=${v_02be30}`);
    throw new v_3ebe58("RATE_LIMITED", "오늘 보낼 수 있는 채팅을 다 썼어요. 내일 다시 이야기해요.");
  }
}

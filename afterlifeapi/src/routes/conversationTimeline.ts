

import { v_b7c41b, type v_437670 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_a8614b } from "../lib/ale";
import { v_74c502, v_5d4a51, v_09d461 } from "../lib/cloneAccess";
import {
  v_a50613,
  v_cca3b3,
  v_c56968,
  v_386d00,
  v_bee6d6,
} from "../lib/conversationMemory";
import { v_b09c2e } from "../lib/conversationEvents";
import { v_19b1f0, v_3205df, v_8be472, type v_1b5c7a } from "../lib/conversationLeave";
import { v_74defc } from "../lib/logger";

export const v_1172ea = new v_b7c41b<v_de0a25>();

type ChatItem = { type: "chat"; id: number; role: string; content: string; at: number; sessionId: string };

type CallItem = { type: "call"; callId: string; startedAt: number; durationSec: number | null; turnCount: number };

type SortKey = { at: number; kind: 0 | 1 | 2; id: string };

type SystemItem = { type: "system"; id: number; kind: string; text: string; at: number; data: Record<string, unknown> };

function v_2c3bd9(v_8c0b26): SortKey {
  if (v_8c0b26.type === "system") return { at: v_8c0b26.at, kind: 2, id: String(v_8c0b26.id).padStart(12, "0") };
  return v_8c0b26.type === "chat"
    ? { at: v_8c0b26.at, kind: 1, id: String(v_8c0b26.id).padStart(12, "0") }
    : { at: v_8c0b26.startedAt, kind: 0, id: v_8c0b26.callId };
}

const v_2a15a0 = ["k", "c", "s"] as const;

function v_d1d076(v_479f05): Record<string, unknown> {
  if (!v_479f05) return {};
  try {
    const v_81e2ef = JSON.parse(v_479f05) as unknown;
    return v_81e2ef && typeof v_81e2ef === "object" ? (v_81e2ef as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function v_2d012c(v_779914, v_148ff6): number {
  if (v_779914.at !== v_148ff6.at) return v_148ff6.at - v_779914.at;
  if (v_779914.kind !== v_148ff6.kind) return v_148ff6.kind - v_779914.kind;
  return v_779914.id < v_148ff6.id ? 1 : v_779914.id > v_148ff6.id ? -1 : 0;
}

function v_c9de8c(v_0eb677): string {
  return `${v_0eb677.at}_${v_2a15a0[v_0eb677.kind]}_${v_0eb677.id}`;
}

function v_e9da89(v_479f05): SortKey {
  const v_35f85c = /^(\d{1,15})_([cks])_(.{1,128})$/.exec(v_479f05);
  if (!v_35f85c) throw new v_3ebe58("VALIDATION_FAILED", "Invalid cursor.");
  return { at: Number(v_35f85c[1]), kind: v_35f85c[2] === "s" ? 2 : v_35f85c[2] === "c" ? 1 : 0, id: v_35f85c[3]! };
}

function v_15ea73(v_3a5fef): number {
  const v_6fc191 = v_3a5fef.replace(" ", "T");
  const v_d799e2 = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(v_6fc191) ? v_6fc191 : `${v_6fc191}Z`);
  return Number.isFinite(v_d799e2) ? v_d799e2 : 0;
}

function v_31113b(v_479f05): number {
  const v_389afb = Number(v_479f05);
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  return v_389afb;
}

async function v_916232(c: v_437670<v_de0a25, any>, v_6e0fd3) {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (!(await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c))) {
    throw new v_3ebe58("FORBIDDEN", "No access to this clone.");
  }
  return { userId: v_43e90c, clone: v_eb25ce };
}

function v_7d767c(v_eb25ce) {
  return { id: v_eb25ce.id, name: v_eb25ce.name, avatarUrl: v_eb25ce.avatar_url };
}

const v_de3072 = 50;

v_1172ea.get("/:id/timeline", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e.req.param("id"));
  const { userId: v_43e90c, clone: v_eb25ce } = await v_916232(v_3f4e2e, v_6e0fd3);

  const v_cf2260 = Number(v_3f4e2e.req.query("limit") ?? 30);
  if (!Number.isInteger(v_cf2260) || v_cf2260 < 1 || v_cf2260 > 100) {
    throw new v_3ebe58("VALIDATION_FAILED", "limit must be 1..100.");
  }
  const v_02be30 = v_cf2260;
  const v_15c8c5 = v_3f4e2e.req.query("cursor");
  const v_75cbf4 = v_15c8c5 ? v_e9da89(v_15c8c5) : null;
  const v_7a9a34 = v_75cbf4 ? v_75cbf4.at : Number.MAX_SAFE_INTEGER;
  const v_5b31c3 = v_75cbf4 ? Math.floor(v_75cbf4.at / 1000) : 253402300799; 

  const { key: v_b24339, provider: v_e38ca2 } = await v_386d00(v_3f4e2e.env, v_43e90c, v_6e0fd3);

  const v_a07d34 = await v_3f4e2e.env.DB
    .prepare(`SELECT intimacy_score FROM user_clone_interactions WHERE user_id = ? AND clone_id = ?`)
    .bind(v_43e90c, v_6e0fd3)
    .first<{ intimacy_score: number }>();
  const v_b74b9c = Math.min(100, v_a07d34?.intimacy_score ?? 0);

  if (v_b24339.kind === "shredded") return v_3f4e2e.json({ clone: v_7d767c(v_eb25ce), intimacy: v_b74b9c, items: [], nextCursor: null });

  const v_76520b = await v_19b1f0(v_3f4e2e.env.DB, v_43e90c, v_6e0fd3);
  const v_17e322 = Math.floor(v_76520b / 1000);

  const [v_7e4351, v_20e160, v_bf9904] = await Promise.all([
    v_3f4e2e.env.DB.prepare(
      `SELECT id, session_id, role, content, created_at FROM messages
        WHERE user_id = ? AND clone_id = ?
          AND status = 'active' AND deletion_state = 'active' AND content IS NOT NULL
          AND datetime(created_at) <= datetime(?, 'unixepoch')
          AND datetime(created_at) > datetime(?, 'unixepoch')
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?`,
    ).bind(v_43e90c, v_6e0fd3, v_5b31c3, v_17e322, v_02be30 + v_de3072)
      .all<{ id: number; session_id: string; role: string; content: string; created_at: string }>(),
    v_3f4e2e.env.DB.prepare(
      `SELECT s.call_id, s.started_at, s.duration_sec,
              (SELECT COUNT(*) FROM call_turns t WHERE t.call_id = s.call_id) AS turn_count
         FROM call_sessions s
        WHERE s.user_id = ? AND s.clone_id = ? AND s.started_at <= ? AND s.started_at > ?
        ORDER BY s.started_at DESC, s.call_id DESC
        LIMIT ?`,
    ).bind(v_43e90c, v_6e0fd3, v_7a9a34, v_76520b, v_02be30 + v_de3072)
      .all<{ call_id: string; started_at: number; duration_sec: number | null; turn_count: number }>(),
    v_3f4e2e.env.DB.prepare(
      `SELECT id, kind, payload, created_at FROM conversation_events
        WHERE user_id = ? AND clone_id = ? AND created_at <= ? AND created_at > ?
        ORDER BY created_at DESC, id DESC
        LIMIT ?`,
    ).bind(v_43e90c, v_6e0fd3, v_7a9a34, v_76520b, v_02be30 + v_de3072)
      .all<{ id: number; kind: string; payload: string | null; created_at: number }>(),
  ]);

  type Pending =
    | { k: SortKey; chat: { id: number; session_id: string; role: string; content: string; at: number } }
    | { k: SortKey; call: CallItem }
    | { k: SortKey; system: SystemItem };
  const v_483de2 = [];
  for (const v_cb35cb of v_bf9904.results ?? []) {
    const v_9390e8 = v_d1d076(v_cb35cb.payload);
    const v_9b6134 = v_b09c2e(v_cb35cb.kind, v_9390e8, v_eb25ce.name);
    if (v_9b6134 === null) continue;
    const v_15c2da = { type: "system", id: v_cb35cb.id, kind: v_cb35cb.kind, text: v_9b6134, at: v_cb35cb.created_at, data: v_9390e8 };
    v_483de2.push({ k: v_2c3bd9(v_15c2da), system: v_15c2da });
  }
  for (const v_cb35cb of v_7e4351.results ?? []) {
    const v_83d291 = v_15ea73(v_cb35cb.created_at);
    v_483de2.push({ k: { at: v_83d291, kind: 1, id: String(v_cb35cb.id).padStart(12, "0") }, chat: { ...v_cb35cb, at: v_83d291 } });
  }
  for (const v_cb35cb of v_20e160.results ?? []) {
    const v_51c3d2 = {
      type: "call", callId: v_cb35cb.call_id, startedAt: v_cb35cb.started_at,
      durationSec: v_cb35cb.duration_sec ?? null, turnCount: v_cb35cb.turn_count,
    };
    v_483de2.push({ k: v_2c3bd9(v_51c3d2), call: v_51c3d2 });
  }
  v_483de2.sort((v_779914, v_148ff6) => v_2d012c(v_779914.k, v_148ff6.k));
  const v_33efc5 = v_75cbf4 ? v_483de2.filter((v_e2a85c) => v_2d012c(v_75cbf4, v_e2a85c.k) < 0) : v_483de2;
  const v_2365e9 = v_33efc5.slice(0, v_02be30);
  const v_6bbe19 = v_33efc5.length > v_02be30;

  const v_66ed66 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  const v_4622b9 = [];
  for (const v_e2a85c of v_2365e9) {
    if ("system" in v_e2a85c) {
      v_4622b9.push(v_e2a85c.system);
      continue;
    }
    if ("call" in v_e2a85c) {
      v_4622b9.push(v_e2a85c.call);
      continue;
    }
    const v_9b6134 = await v_c56968(v_3f4e2e.env, v_b24339, v_e38ca2, v_66ed66, v_6e0fd3, v_e2a85c.chat.role, v_e2a85c.chat.content);
    if (v_9b6134 === null) continue;
    v_4622b9.push({
      type: "chat", id: v_e2a85c.chat.id, role: v_e2a85c.chat.role, content: v_9b6134, at: v_e2a85c.chat.at,
      sessionId: v_e2a85c.chat.session_id,
    });
  }

  return v_3f4e2e.json({
    clone: v_7d767c(v_eb25ce),
    intimacy: v_b74b9c,
    items: v_4622b9,
    nextCursor: v_6bbe19 && v_2365e9.length ? v_c9de8c(v_2365e9[v_2365e9.length - 1]!.k) : null,
  });
});

v_1172ea.get("/:id/calls/:callId/turns", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e.req.param("id"));
  const { userId: v_43e90c } = await v_916232(v_3f4e2e, v_6e0fd3);
  const v_be62d3 = v_3f4e2e.req.param("callId");
  if (!v_be62d3 || v_be62d3.length > 128) throw new v_3ebe58("VALIDATION_FAILED", "Invalid call id.");

  const v_d7296e = await v_3f4e2e.env.DB.prepare(
    "SELECT started_at FROM call_sessions WHERE call_id = ? AND user_id = ? AND clone_id = ?",
  ).bind(v_be62d3, v_43e90c, v_6e0fd3).first<{ started_at: number }>();
  if (!v_d7296e) throw new v_3ebe58("NOT_FOUND", "Call not found.");

  const v_cf2260 = Number(v_3f4e2e.req.query("limit") ?? 50);
  if (!Number.isInteger(v_cf2260) || v_cf2260 < 1 || v_cf2260 > 200) {
    throw new v_3ebe58("VALIDATION_FAILED", "limit must be 1..200.");
  }
  const v_15c8c5 = v_3f4e2e.req.query("cursor");
  if (v_15c8c5 !== undefined && !/^\d{1,9}$/.test(v_15c8c5)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid cursor.");
  }
  const v_84d7f0 = v_15c8c5 !== undefined ? Number(v_15c8c5) : Number.MAX_SAFE_INTEGER;

  const { key: v_b24339 } = await v_386d00(v_3f4e2e.env, v_43e90c, v_6e0fd3);
  if (v_b24339.kind === "shredded") throw new v_3ebe58("NOT_FOUND", "Call not found.");

  const v_18b8bf = (await v_3f4e2e.env.DB.prepare(
    `SELECT seq, role, text, created_at FROM call_turns
      WHERE call_id = ? AND seq < ?
      ORDER BY seq DESC
      LIMIT ?`,
  ).bind(v_be62d3, v_84d7f0, v_cf2260 + 1)
    .all<{ seq: number; role: string; text: string; created_at: number }>()).results ?? [];
  const v_6bbe19 = v_18b8bf.length > v_cf2260;
  const v_2365e9 = v_18b8bf.slice(0, v_cf2260).reverse();

  const v_3035d9 = [];
  for (const v_cb35cb of v_2365e9) {
    const v_9b6134 = v_cca3b3(v_b24339, v_cb35cb.text, v_bee6d6(v_be62d3, v_cb35cb.role));
    if (v_9b6134 === null || v_9b6134 === "") continue;
    v_3035d9.push({ seq: v_cb35cb.seq, role: v_cb35cb.role, text: v_9b6134, at: v_cb35cb.created_at });
  }
  return v_3f4e2e.json({
    callId: v_be62d3,
    startedAt: v_d7296e.started_at,
    turns: v_3035d9,
    nextCursor: v_6bbe19 && v_2365e9.length ? String(v_2365e9[0]!.seq) : null,
  });
});

v_1172ea.post("/:id/mark-read", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e.req.param("id"));
  const { userId: v_43e90c } = await v_916232(v_3f4e2e, v_6e0fd3);

  const v_148ff6 = (await v_3f4e2e.req.json().catch(() => ({}))) as { at?: unknown };
  const v_5c2f9f = Date.now();
  const v_963980 = typeof v_148ff6.at === "number" && v_148ff6.at <= v_5c2f9f && v_148ff6.at >= v_5c2f9f - 120_000 ? v_148ff6.at : v_5c2f9f;
  await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO conversation_read_markers (user_id, clone_id, last_read_at)
         VALUES (?, ?, datetime(?, 'unixepoch'))
         ON CONFLICT(user_id, clone_id) DO UPDATE SET
           last_read_at = MAX(conversation_read_markers.last_read_at, excluded.last_read_at)`,
    )
    .bind(v_43e90c, v_6e0fd3, Math.floor(v_963980 / 1000))
    .run();
  return v_3f4e2e.json({ ok: true });
});

export const v_72aaee = new v_b7c41b<v_de0a25>();

const v_41e5f1 = 120;

function v_e54222(v_9b6134): string | null {
  if (v_9b6134 === null) return null;
  const v_8d41d7 = v_9b6134.replace(/\s+/g, " ").trim();
  return v_8d41d7.length > v_41e5f1 ? `${v_8d41d7.slice(0, v_41e5f1)}…` : v_8d41d7;
}

v_72aaee.get("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const [v_2461e1, v_7e4351, v_20e160, v_7fe886, v_bf9904] = await Promise.all([
    v_a1651b.prepare(
      `SELECT id, created_at FROM clones WHERE owner_id = ? AND deleted_at IS NULL AND deletion_state = 'active'`,
    ).bind(v_43e90c).all<{ id: number; created_at: string }>(),
    v_a1651b.prepare(
      `SELECT clone_id, role, content, created_at FROM (
         SELECT clone_id, role, content, created_at,
                ROW_NUMBER() OVER (PARTITION BY clone_id ORDER BY datetime(created_at) DESC, id DESC) AS rn
           FROM messages
          WHERE user_id = ? AND status = 'active' AND deletion_state = 'active' AND content IS NOT NULL
            AND clone_id IN (SELECT id FROM clones WHERE ${v_74c502()})
       ) WHERE rn = 1`,
    ).bind(v_43e90c).all<{ clone_id: number; role: string; content: string; created_at: string }>(),
    v_a1651b.prepare(
      `SELECT x.clone_id, x.call_id, x.started_at,
              (SELECT t.role FROM call_turns t WHERE t.call_id = x.call_id ORDER BY t.seq DESC LIMIT 1) AS role,
              (SELECT t.text FROM call_turns t WHERE t.call_id = x.call_id ORDER BY t.seq DESC LIMIT 1) AS text
         FROM (
           SELECT clone_id, call_id, started_at,
                  ROW_NUMBER() OVER (PARTITION BY clone_id ORDER BY started_at DESC, call_id DESC) AS rn
             FROM call_sessions
            WHERE user_id = ? AND clone_id IN (SELECT id FROM clones WHERE ${v_74c502()})
         ) x
        WHERE x.rn = 1`,
    ).bind(v_43e90c).all<{ clone_id: number; call_id: string; started_at: number; role: string | null; text: string | null }>(),

    v_a1651b.prepare(
      `SELECT clone_id, last_read_at FROM conversation_read_markers WHERE user_id = ?`,
    ).bind(v_43e90c).all<{ clone_id: number; last_read_at: string }>(),

    v_a1651b.prepare(
      `SELECT clone_id, kind, payload, created_at FROM (
         SELECT clone_id, kind, payload, created_at,
                ROW_NUMBER() OVER (PARTITION BY clone_id ORDER BY created_at DESC, id DESC) AS rn
           FROM conversation_events WHERE user_id = ?
       ) WHERE rn = 1`,
    ).bind(v_43e90c).all<{ clone_id: number; kind: string; payload: string | null; created_at: number }>(),
  ]);
  const v_2a4227 = new Map<number, number>();
  for (const v_cb35cb of v_7fe886.results ?? []) {
    v_2a4227.set(v_cb35cb.clone_id, v_15ea73(v_cb35cb.last_read_at));
  }

  type Last = {
    type: "chat" | "call" | "system";
    role: string | null;
    blob: string | null;
    at: number;
    callId?: string;
    event?: { kind: string; payload: Record<string, unknown> };
  };
  const v_02fbf1 = new Map<number, Last>();
  for (const v_cb35cb of v_7e4351.results ?? []) {
    v_02fbf1.set(v_cb35cb.clone_id, { type: "chat", role: v_cb35cb.role, blob: v_cb35cb.content, at: v_15ea73(v_cb35cb.created_at) });
  }
  for (const v_cb35cb of v_20e160.results ?? []) {
    const v_ba2215 = v_02fbf1.get(v_cb35cb.clone_id);
    if (!v_ba2215 || v_cb35cb.started_at > v_ba2215.at) {
      v_02fbf1.set(v_cb35cb.clone_id, { type: "call", role: v_cb35cb.role, blob: v_cb35cb.text, at: v_cb35cb.started_at, callId: v_cb35cb.call_id });
    }
  }
  for (const v_cb35cb of v_bf9904.results ?? []) {
    const v_ba2215 = v_02fbf1.get(v_cb35cb.clone_id);
    if (!v_ba2215 || v_cb35cb.created_at > v_ba2215.at) {
      v_02fbf1.set(v_cb35cb.clone_id, {
        type: "system", role: null, blob: null, at: v_cb35cb.created_at,
        event: { kind: v_cb35cb.kind, payload: v_d1d076(v_cb35cb.payload) },
      });
    }
  }

  const v_705cde = await v_3205df(v_a1651b, v_43e90c);
  for (const [v_062ae9, v_506e86] of [...v_02fbf1.entries()]) {
    const v_dbaa7f = v_705cde.get(v_062ae9);
    if (v_dbaa7f !== undefined && v_506e86.at <= v_dbaa7f) v_02fbf1.delete(v_062ae9);
  }
  const v_45c785 = new Map(
    (v_2461e1.results ?? [])

      .filter((v_cb35cb) => !v_705cde.has(v_cb35cb.id) || v_02fbf1.has(v_cb35cb.id))
      .map((v_cb35cb) => [v_cb35cb.id, v_15ea73(v_cb35cb.created_at)]),
  );

  const v_10387a = await v_a1651b
    .prepare(`SELECT clone_id, created_at FROM clone_follows WHERE user_id = ?`)
    .bind(v_43e90c)
    .all<{ clone_id: number; created_at: string }>();
  const v_559298 = new Set<number>(
    (v_10387a.results ?? [])

      .filter((v_cb35cb) => !v_705cde.has(v_cb35cb.clone_id) || v_15ea73(v_cb35cb.created_at) > v_705cde.get(v_cb35cb.clone_id)!)
      .map((v_cb35cb) => v_cb35cb.clone_id),
  );
  const v_b482e3 = new Map<number, number>(
    (v_10387a.results ?? []).map((v_cb35cb) => [v_cb35cb.clone_id, v_15ea73(v_cb35cb.created_at)]),
  );

  const v_52e08b = new Set<number>([
    ...v_02fbf1.keys(),
    ...v_45c785.keys(),
    ...v_559298, 
  ]);

  const v_66ed66 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  const v_e38ca2 = await v_a50613(v_3f4e2e.env);
  const v_4d6839 = await Promise.all([...v_52e08b].map(async (v_389afb) => {
    const v_eb25ce = await v_5d4a51(v_a1651b, v_389afb);
    if (!v_eb25ce) return null;
    if (!(await v_09d461(v_3f4e2e, v_eb25ce, v_43e90c))) return null;
    const v_506e86 = v_02fbf1.get(v_389afb);
    let v_2f7952 = null;
    if (v_506e86) {
      const { key: v_b24339 } = await v_386d00(v_3f4e2e.env, v_43e90c, v_389afb, v_e38ca2);
      if (v_b24339.kind === "shredded") return null;
      let v_9b6134 = null;
      if (v_506e86.event) {
        v_9b6134 = v_b09c2e(v_506e86.event.kind, v_506e86.event.payload, v_eb25ce.name);
      } else if (v_506e86.blob) {
        v_9b6134 = v_506e86.type === "chat"
          ? await v_c56968(v_3f4e2e.env, v_b24339, v_e38ca2, v_66ed66, v_389afb, v_506e86.role ?? "", v_506e86.blob)
          : v_cca3b3(v_b24339, v_506e86.blob, v_bee6d6(v_506e86.callId!, v_506e86.role ?? ""));
      }
      v_2f7952 = {
        type: v_506e86.type,
        role: v_506e86.blob ? v_506e86.role : null,
        text: v_e54222(v_9b6134 || null),
        at: v_506e86.at,

        ...(v_506e86.event
          ? { kind: v_506e86.event.kind, data: v_506e86.event.payload }
          : {}),
      };
    }

    let v_8a6db3 = 0;
    const v_f1909a = v_2a4227.get(v_389afb);
    if (v_f1909a !== undefined) {
      const v_5fc92f = Math.floor(v_f1909a / 1000);
      const [v_9630aa, v_628c75, v_f1150e] = await Promise.all([
        v_a1651b.prepare(
          `SELECT COUNT(*) AS n FROM messages
             WHERE user_id = ? AND clone_id = ? AND role = 'clone'
               AND status = 'active' AND deletion_state = 'active'
               AND datetime(created_at) > datetime(?, 'unixepoch')`,
        ).bind(v_43e90c, v_389afb, v_5fc92f).first<{ n: number }>(),
        v_a1651b.prepare(
          `SELECT COUNT(*) AS n FROM call_sessions
             WHERE user_id = ? AND clone_id = ? AND started_at > ?`,
        ).bind(v_43e90c, v_389afb, v_f1909a).first<{ n: number }>(),
        v_a1651b.prepare(
          `SELECT COUNT(*) AS n FROM conversation_events
             WHERE user_id = ? AND clone_id = ? AND created_at > ?`,
        ).bind(v_43e90c, v_389afb, v_f1909a).first<{ n: number }>(),
      ]);
      v_8a6db3 = Number(v_9630aa?.n ?? 0) + Number(v_628c75?.n ?? 0) + Number(v_f1150e?.n ?? 0);
    }
    return {
      clone: v_7d767c(v_eb25ce),
      isMine: v_eb25ce.owner_id === v_43e90c,
      last: v_2f7952,
      unreadCount: v_8a6db3,
      sortAt: v_2f7952?.at ?? null,

      createdAt: v_45c785.get(v_389afb) ?? v_b482e3.get(v_389afb) ?? 0,
    };
  }));
  const v_4622b9 = v_4d6839.filter((v_62c214): v_62c214 is NonNullable<typeof v_62c214> => v_62c214 !== null);

  v_4622b9.sort((v_779914, v_148ff6) =>
    v_779914.sortAt !== null && v_148ff6.sortAt !== null ? v_148ff6.sortAt - v_779914.sortAt
      : v_779914.sortAt !== null ? -1 : v_148ff6.sortAt !== null ? 1 : v_148ff6.createdAt - v_779914.createdAt);
  return v_3f4e2e.json({ items: v_4622b9.map(({ sortAt: v_21a792, createdAt: v_837cf5, ...v_83bbcd }) => v_83bbcd) });
});

v_72aaee.post("/:cloneId/leave", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_6e0fd3 = v_31113b(v_3f4e2e.req.param("cloneId"));
  const v_a1651b = v_3f4e2e.env.DB;
  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  const v_ba3f04 = await v_a1651b
    .prepare(`SELECT 1 AS hit FROM clone_follows WHERE user_id = ? AND clone_id = ? LIMIT 1`)
    .bind(v_43e90c, v_6e0fd3)
    .first<{ hit: number }>();
  const kind: v_1b5c7a = v_eb25ce.owner_id === v_43e90c ? "owned" : v_ba3f04 ? "subscribed" : "called";

  const v_cb35cb = await v_8be472(v_a1651b, { userId: v_43e90c, cloneId: v_6e0fd3, kind: v_94302c });
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "conversation.leave",
    details: { cloneId: v_6e0fd3, kind: v_94302c, leaveId: v_cb35cb.leaveId, unsubscribed: v_cb35cb.unsubscribed },
  });
  return v_3f4e2e.json({ ok: true, kind: v_94302c, unsubscribed: v_cb35cb.unsubscribed, leftAt: v_cb35cb.leftAt });
});

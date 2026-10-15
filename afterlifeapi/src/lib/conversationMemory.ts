

import { v_5f30e2 } from "qcyoxusdylhcdivjkjnuowj";
import type { v_273a0c } from "./env";
import type { v_a7c42c } from "./ale";
import {
  v_a8614b,
  v_034656,
  v_137694,
  v_f7e14c,
  v_80aaa1,
  v_2c21b1,
  v_535aac,
} from "./ale";
import { v_190a24 } from "./kekProvider";

export const v_8a2554 = "conversation";

export function v_2c3572(v_43e90c, v_6e0fd3): string {
  return `${v_43e90c}:${v_6e0fd3}`;
}

type ConvEnv = Pick<v_273a0c, "DB" | "MASTER_ROOT" | "ALE_KEK" | "AUDIT_SECRET">;

type ConversationKey =
  | { kind: "ok"; kekId: string; dekId: string; dek: Uint8Array }
  | { kind: "shredded" }
  | { kind: "none" };

async function v_a50613(v_c9c489): Promise<v_a7c42c | null> {
  try {
    return await v_190a24(v_c9c489.DB, v_c9c489.MASTER_ROOT);
  } catch (v_49263d) {
    console.error(`[CONV_KEK_UNAVAILABLE] err=${(v_49263d as Error).message}`);
    return null;
  }
}

function v_a8990a(): string {
  let v_993b31 = "";
  for (const v_148ff6 of v_5f30e2(16)) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return `dek_${v_993b31}`;
}

async function v_4c8dce(
  v_a1651b,
  provider: v_a7c42c,
  v_43e90c,
  v_6e0fd3,
  v_a7c0d4,
): Promise<ConversationKey> {
  const v_d5e9c2 = v_2c3572(v_43e90c, v_6e0fd3);
  const v_1712c9 = () =>
    v_a1651b
      .prepare(
        `SELECT dek_id, kek_id, encrypted_dek, shredded_at FROM dek_registry
          WHERE resource_type = ? AND resource_id = ?`,
      )
      .bind(v_8a2554, v_d5e9c2)
      .first<{ dek_id: string; kek_id: string; encrypted_dek: string; shredded_at: string | null }>();

  let v_3ac7e7 = await v_1712c9();
  if (!v_3ac7e7 && v_a7c0d4) {

    const v_f22f3e = v_e38ca2.current();
    const v_426a9a = v_5f30e2(32);
    await v_a1651b
      .prepare(
        `INSERT OR IGNORE INTO dek_registry (dek_id, resource_type, resource_id, kek_id, encrypted_dek)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(v_a8990a(), v_8a2554, v_d5e9c2, v_f22f3e, v_535aac(v_e38ca2.resolve(v_f22f3e), v_426a9a))
      .run();
    v_3ac7e7 = await v_1712c9();
  }
  if (!v_3ac7e7) return { kind: "none" };
  if (v_3ac7e7.shredded_at) return { kind: "shredded" };
  return {
    kind: "ok",
    kekId: v_3ac7e7.kek_id,
    dekId: v_3ac7e7.dek_id,
    dek: v_2c21b1(v_e38ca2.resolve(v_3ac7e7.kek_id), v_3ac7e7.encrypted_dek),
  };
}

export function v_bee6d6(v_be62d3, v_22da99): string {
  return `call_turn:${v_be62d3}:${v_22da99}`;
}

async function v_723a5d(v_a1651b, v_43e90c, v_6e0fd3): Promise<boolean> {
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT shredded_at FROM dek_registry WHERE resource_type = ? AND resource_id = ?`,
    )
    .bind(v_8a2554, v_2c3572(v_43e90c, v_6e0fd3))
    .first<{ shredded_at: string | null }>();
  return !!v_3ac7e7?.shredded_at;
}

export interface TurnRef {
  userId: number;
  cloneId: number;
  callId: string;
  role: string;
}

export async function v_2fa0c9(v_c9c489, v_6d4ed3, v_9b6134): Promise<string | null> {
  const { userId: v_43e90c, cloneId: v_6e0fd3 } = v_6d4ed3;
  const v_e38ca2 = await v_a50613(v_c9c489);
  if (v_e38ca2) {
    try {
      const v_b24339 = await v_4c8dce(v_c9c489.DB, v_e38ca2, v_43e90c, v_6e0fd3, true);
      if (v_b24339.kind === "shredded") {
        console.warn(`[CALL_TURN_SHREDDED_SKIP] user=${v_43e90c} clone=${v_6e0fd3}`);
        return null;
      }
      if (v_b24339.kind === "none") throw new Error("conversation key missing after create");
      return v_80aaa1(v_b24339.kekId, v_b24339.dekId, v_b24339.dek, v_9b6134, v_bee6d6(v_6d4ed3.callId, v_6d4ed3.role));
    } catch (v_49263d) {
      console.error(
        `[CALL_TURN_SEAL_FAIL] user=${v_43e90c} clone=${v_6e0fd3} reason=${(v_49263d as Error).message}`,
      );
    }
  }

  if (await v_723a5d(v_c9c489.DB, v_43e90c, v_6e0fd3)) {
    console.warn(`[CALL_TURN_SHREDDED_SKIP] user=${v_43e90c} clone=${v_6e0fd3}`);
    return null;
  }
  console.error(`[CALL_TURN_PLAINTEXT] user=${v_43e90c} clone=${v_6e0fd3} reason=${v_e38ca2 ? "seal_fail" : "no_kek"}`);
  return v_9b6134;
}

export interface ConversationTurn {
  callId: string;
  role: string;
  text: string;
  at: number;
  source: "call" | "chat";
}

export interface AssembleOptions {
  userId: number;
  cloneId: number;
  maxTurns: number;
  excludeCallId?: string;
  includeChat: boolean;
}

function v_15ea73(v_3a5fef): number {
  const v_6fc191 = v_3a5fef.replace(" ", "T");
  const v_d799e2 = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(v_6fc191) ? v_6fc191 : `${v_6fc191}Z`);
  return Number.isFinite(v_d799e2) ? v_d799e2 : 0;
}

function v_08aba8(v_d799e2): string {
  return `chat-${new Date(v_d799e2 + 9 * 3600_000).toISOString().slice(0, 10)}`;
}

type Raw = {
  key: number;   
  sub: number;   
  source: "call" | "chat";
  callId: string;
  role: string;
  blob: string;
  at: number;
};

export async function v_60df93(
  v_c9c489,
  v_328259,
): Promise<{ turns: ConversationTurn[]; resetAt: number }> {
  const { userId: v_43e90c, cloneId: v_6e0fd3, maxTurns: v_1cae38 } = v_328259;
  const v_487a25 = await v_c9c489.DB.prepare(
    "SELECT reset_at FROM conversation_resets WHERE user_id = ? AND clone_id = ?",
  ).bind(v_43e90c, v_6e0fd3).first<{ reset_at: number }>();
  const v_b98b4f = v_487a25?.reset_at ?? 0;

  const v_20e160 = await v_c9c489.DB.prepare(
    `SELECT t.call_id, t.seq, t.role, t.text, t.created_at, s.started_at
       FROM call_turns t
       JOIN call_sessions s ON s.call_id = t.call_id
      WHERE s.user_id = ? AND s.clone_id = ?
        AND s.started_at > ?
        AND t.call_id != ?
      ORDER BY s.started_at DESC, t.seq DESC
      LIMIT ?`,
  ).bind(v_43e90c, v_6e0fd3, v_b98b4f, v_328259.excludeCallId ?? "", v_1cae38)
    .all<{ call_id: string; seq: number; role: string; text: string; created_at: number; started_at: number }>();

  const v_9f97c4 = (v_20e160.results ?? []).map((v_cb35cb) => ({
    key: v_cb35cb.started_at, sub: v_cb35cb.seq, source: "call", callId: v_cb35cb.call_id,
    role: v_cb35cb.role, blob: v_cb35cb.text, at: v_cb35cb.created_at,
  }));

  if (v_328259.includeChat) {
    const v_7e4351 = await v_c9c489.DB.prepare(
      `SELECT id, role, content, created_at FROM messages
        WHERE user_id = ? AND clone_id = ?
          AND status = 'active' AND deletion_state = 'active' AND content IS NOT NULL
          AND datetime(created_at) > datetime(?, 'unixepoch')
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?`,
    ).bind(v_43e90c, v_6e0fd3, Math.floor(v_b98b4f / 1000), v_1cae38)
      .all<{ id: number; role: string; content: string; created_at: string }>();
    for (const v_cb35cb of v_7e4351.results ?? []) {
      const v_d799e2 = v_15ea73(v_cb35cb.created_at);
      v_9f97c4.push({
        key: v_d799e2, sub: v_cb35cb.id, source: "chat", callId: v_08aba8(v_d799e2),
        role: v_cb35cb.role, blob: v_cb35cb.content, at: v_d799e2,
      });
    }
  }

  v_9f97c4.sort((v_779914, v_148ff6) => v_148ff6.key - v_779914.key || v_148ff6.sub - v_779914.sub);
  const v_07fb2e = v_9f97c4.slice(0, v_1cae38).reverse();

  const v_e38ca2 = await v_a50613(v_c9c489);
  const v_b24339 = v_e38ca2
    ? await v_4c8dce(v_c9c489.DB, v_e38ca2, v_43e90c, v_6e0fd3, false).catch((v_49263d) => {
        console.error(`[CONV_KEY_LOAD_FAIL] user=${v_43e90c} clone=${v_6e0fd3} err=${(v_49263d as Error).message}`);
        return { kind: "none" } as ConversationKey;
      })
    : ((await v_723a5d(v_c9c489.DB, v_43e90c, v_6e0fd3).catch(() => false))
        ? ({ kind: "shredded" } as ConversationKey)
        : ({ kind: "none" } as ConversationKey));
  const v_66ed66 = v_a8614b(v_c9c489.ALE_KEK);

  const v_3035d9 = [];
  for (const v_cb35cb of v_07fb2e) {
    const v_9b6134 = v_cb35cb.source === "call"
      ? v_cca3b3(v_b24339, v_cb35cb.blob, v_bee6d6(v_cb35cb.callId, v_cb35cb.role))
      : await v_c56968(v_c9c489, v_e38ca2, v_66ed66, v_6e0fd3, v_cb35cb.blob);
    if (v_9b6134 === null) continue;
    v_3035d9.push({ callId: v_cb35cb.callId, role: v_cb35cb.role, text: v_9b6134, at: v_cb35cb.at, source: v_cb35cb.source });
  }
  return { turns: v_3035d9, resetAt: v_b98b4f };
}

function v_cca3b3(v_b24339, v_5885b8, v_14ac31): string | null {
  if (v_b24339.kind === "shredded") return null;
  if (!v_034656(v_5885b8)) return v_5885b8;    
  if (v_b24339.kind !== "ok") return null;
  try {
    return v_f7e14c(v_5885b8, v_b24339.dekId, v_b24339.dek, v_14ac31);
  } catch (v_49263d) {
    console.error(`[CALL_TURN_OPEN_FAIL] err=${(v_49263d as Error).message}`);
    return null;
  }
}

async function v_c56968(
  v_c9c489,
  provider: v_a7c42c | null,
  legacy: v_a7c42c,
  v_6e0fd3,
  v_3263c7,
): Promise<string | null> {
  try {
    return await v_137694(v_3263c7, {
      db: v_c9c489.DB,
      hkdfContext: `msg:${v_6e0fd3}`,
      legacyProvider: v_66ed66,
      v3Provider: v_e38ca2 ?? undefined,
      actor: { type: "system", id: "conversation-memory" },
      auditSecret: v_c9c489.AUDIT_SECRET,
      lazyMigrateEnabled: false,
    });
  } catch (v_49263d) {
    console.error(`[CHAT_OPEN_FAIL] clone=${v_6e0fd3} err=${(v_49263d as Error).message}`);
    return null;
  }
}

export async function v_0625b2(
  v_c9c489,
  v_02be30,
  v_7bc053,
): Promise<{ processed: number; erasedShredded: number; lastId: number; remaining: number }> {
  const v_e38ca2 = await v_190a24(v_c9c489.DB, v_c9c489.MASTER_ROOT);
  const { results: v_a7f568 } = await v_c9c489.DB.prepare(
    `SELECT t.id, t.call_id, t.role, t.text, s.user_id, s.clone_id
       FROM call_turns t
       JOIN call_sessions s ON s.call_id = t.call_id
      WHERE t.id > ? AND t.text != '' AND t.text NOT GLOB 'v3.*'
      ORDER BY t.id
      LIMIT ?`,
  ).bind(v_7bc053, v_02be30)
    .all<{ id: number; call_id: string; role: string; text: string; user_id: number; clone_id: number }>();

  const v_fa53ec = new Map<string, ConversationKey>();
  const v_97eacf = [];
  let v_d02e5e = 0;
  let v_279c89 = v_7bc053;
  for (const v_cb35cb of v_a7f568 ?? []) {
    v_279c89 = v_cb35cb.id;
    if (v_034656(v_cb35cb.text)) continue;
    const v_d5e9c2 = v_2c3572(v_cb35cb.user_id, v_cb35cb.clone_id);
    let v_b24339 = v_fa53ec.get(v_d5e9c2);
    if (!v_b24339) {
      v_b24339 = await v_4c8dce(v_c9c489.DB, v_e38ca2, v_cb35cb.user_id, v_cb35cb.clone_id, true);
      v_fa53ec.set(v_d5e9c2, v_b24339);
    }
    let v_a448ad;
    if (v_b24339.kind === "shredded") {
      v_a448ad = "";
      v_d02e5e += 1;
    } else if (v_b24339.kind === "ok") {
      v_a448ad = v_80aaa1(v_b24339.kekId, v_b24339.dekId, v_b24339.dek, v_cb35cb.text, v_bee6d6(v_cb35cb.call_id, v_cb35cb.role));
    } else {
      continue;
    }
    v_97eacf.push(
      v_c9c489.DB.prepare("UPDATE call_turns SET text = ? WHERE id = ? AND text = ?").bind(v_a448ad, v_cb35cb.id, v_cb35cb.text),
    );
  }
  let v_720567 = 0;
  if (v_97eacf.length) {
    for (const v_8f00b9 of await v_c9c489.DB.batch(v_97eacf)) v_720567 += v_8f00b9.meta.changes ?? 0;
  }
  const v_dbaa7f = await v_c9c489.DB.prepare(
    `SELECT COUNT(*) AS n FROM call_turns t
       JOIN call_sessions s ON s.call_id = t.call_id
      WHERE t.id > ? AND t.text != '' AND t.text NOT GLOB 'v3.*'`,
  ).bind(v_279c89).first<{ n: number }>();
  return { processed: v_720567, erasedShredded: v_d02e5e, lastId: v_279c89, remaining: v_dbaa7f?.n ?? 0 };
}



import type { R2Bucket } from "@cloudflare/workers-types";
import { b64, unb64 } from "./ale";

export const COLD_PREFIX = "cold";
export const SCHEMA_VERSION = "2026-04-16";

export type ColdType = "user" | "clone" | "message";

const COLD_TABLE: Record<ColdType, string> = { user: "users", clone: "clones", message: "messages" };

export const COLD_TARGET_COLUMNS: Record<ColdType, string[]> = {
  user: ["phone", "age_enc"],
  clone: [],
  message: ["content"],
};

export interface Snapshot {
  schema_version: string;
  type: ColdType;
  id: string;
  archived_at: string;
  data: Record<string, unknown>;
  dekRegistry: Array<{
    dek_id: string;
    kek_id: string;
    encrypted_dek: string;
    resource_type: string;
  }>;
}

function coldKey(type: string, id: string | number): string {
  return `${COLD_PREFIX}/${type}/${id}/snapshot.json.gz`;
}

export async function gzipEncode(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Response(bytes).body!.pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function gzipDecode(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Response(bytes).body!.pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Uint8Array) {
      out[k] = { __b64: b64(v) };
    } else {
      out[k] = v;
    }
  }
  return out;
}

function deserializeValue(v: unknown): unknown {
  if (v !== null && typeof v === "object" && "__b64" in (v as object)) {
    return unb64((v as { __b64: string }).__b64);
  }
  return v;
}

export async function buildSnapshot(
  type: ColdType,
  id: string | number,
  row: Record<string, unknown>,
): Promise<{ key: string; body: Uint8Array }> {
  const snapshot: Snapshot = {
    schema_version: SCHEMA_VERSION,
    type,
    id: String(id),
    archived_at: new Date().toISOString(),
    data: serializeRow(row),
    dekRegistry: [],
  };
  const key = coldKey(type, id);
  const body = await gzipEncode(new TextEncoder().encode(JSON.stringify(snapshot)));
  return { key, body };
}

export async function putSnapshot(
  bucket: R2Bucket,
  key: string,
  body: Uint8Array,
): Promise<void> {
  await bucket.put(key, body, {
    httpMetadata: { contentType: "application/gzip" },
    customMetadata: { schemaVersion: SCHEMA_VERSION },
  });
}

export async function getSnapshot(
  bucket: R2Bucket,
  key: string,
): Promise<object | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  const bytes = new Uint8Array(await obj.arrayBuffer());
  const json = new TextDecoder().decode(await gzipDecode(bytes));
  return JSON.parse(json) as object;
}

export async function buildSnapshotFromDb(
  db: D1Database,
  type: ColdType,
  id: string | number,
): Promise<{ key: string; body: Uint8Array }> {
  const cols = COLD_TARGET_COLUMNS[type];
  const data: Record<string, unknown> = {};

  if (cols.length > 0) {
    const table = COLD_TABLE[type];
    const row = await db
      .prepare(`SELECT ${cols.join(",")} FROM ${table} WHERE id=?`)
      .bind(id)
      .first<Record<string, unknown>>();
    if (row) {
      for (const c of cols) data[c] = row[c] ?? null;
    }
  }

  const regs = (
    await db
      .prepare(
        `SELECT dek_id, kek_id, encrypted_dek, resource_type
           FROM dek_registry
          WHERE resource_type LIKE ? AND resource_id = ?`,
      )
      .bind(`${type}.%`, String(id))
      .all<{ dek_id: string; kek_id: string; encrypted_dek: string; resource_type: string }>()
  ).results;

  const snapshot: Snapshot = {
    schema_version: SCHEMA_VERSION,
    type,
    id: String(id),
    archived_at: new Date().toISOString(),
    data: serializeRow(data),
    dekRegistry: regs,
  };

  const key = coldKey(type, id);
  const body = await gzipEncode(new TextEncoder().encode(JSON.stringify(snapshot)));
  return { key, body };
}

export async function restoreFromSnapshot(
  db: D1Database,
  snapshot: Snapshot,
): Promise<{ columnsRestored: number; dekRowsReinserted: number }> {
  const cols = COLD_TARGET_COLUMNS[snapshot.type] ?? [];
  let columnsRestored = 0;

  if (cols.length > 0) {
    const table = COLD_TABLE[snapshot.type];
    const setFrag = cols.map((c) => `${c}=?`).join(",");
    const values = cols.map((c) => deserializeValue(snapshot.data[c] ?? null));
    const upd = await db
      .prepare(`UPDATE ${table} SET ${setFrag} WHERE id=?`)
      .bind(...values, snapshot.id)
      .run();
    columnsRestored = upd.meta.changes ?? 0;
  }

  let dekRowsReinserted = 0;
  for (const r of snapshot.dekRegistry) {
    const res = await db
      .prepare(
        `INSERT OR IGNORE INTO dek_registry (dek_id, kek_id, encrypted_dek, resource_type, resource_id)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(r.dek_id, r.kek_id, r.encrypted_dek, r.resource_type, snapshot.id)
      .run();
    dekRowsReinserted += res.meta.changes ?? 0;
  }

  return { columnsRestored, dekRowsReinserted };
}

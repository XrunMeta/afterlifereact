

import type { v_0c7978 } from "audevgreebvpcootosqqkonhs";
import { v_8a9589, v_394453 } from "./ale";

export const v_5fd134 = "cold";
export const v_823cb7 = "2026-04-16";

export type ColdType = "user" | "clone" | "message";

export const v_11bf9b = { user: "users", clone: "clones", message: "messages" };

export const v_a02f1c = {
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

export function v_8afb61(v_3b27d9, v_389afb): string {
  return `${v_5fd134}/${v_3b27d9}/${v_389afb}/snapshot.json.gz`;
}

export async function v_cfe090(v_fbb6da): Promise<Uint8Array> {
  const v_cab51f = new Response(v_fbb6da).body!.pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(v_cab51f).arrayBuffer());
}

export async function v_301697(v_fbb6da): Promise<Uint8Array> {
  const v_cab51f = new Response(v_fbb6da).body!.pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(v_cab51f).arrayBuffer());
}

function v_f85cdf(v_3ac7e7): Record<string, unknown> {
  const v_8d4337 = {};
  for (const [v_0eb677, v_81e2ef] of Object.entries(v_3ac7e7)) {
    if (v_81e2ef instanceof Uint8Array) {
      v_8d4337[v_0eb677] = { __b64: v_8a9589(v_81e2ef) };
    } else {
      v_8d4337[v_0eb677] = v_81e2ef;
    }
  }
  return v_8d4337;
}

function v_e5e25c(v_81e2ef): unknown {
  if (v_81e2ef !== null && typeof v_81e2ef === "object" && "__b64" in (v_81e2ef as object)) {
    return v_394453((v_81e2ef as { __b64: string }).__b64);
  }
  return v_81e2ef;
}

export async function v_8f5cb6(
  v_3b27d9,
  v_389afb,
  v_3ac7e7,
): Promise<{ key: string; body: Uint8Array }> {
  const v_5392c4 = {
    schema_version: v_823cb7,
    type: v_3b27d9,
    id: String(v_389afb),
    archived_at: new Date().toISOString(),
    data: v_f85cdf(v_3ac7e7),
    dekRegistry: [],
  };
  const v_b24339 = v_8afb61(v_3b27d9, v_389afb);
  const v_4d33b2 = await v_cfe090(new TextEncoder().encode(JSON.stringify(v_5392c4)));
  return { key: v_b24339, body: v_4d33b2 };
}

export async function v_5e4807(
  bucket: v_0c7978,
  v_b24339,
  v_4d33b2,
): Promise<void> {
  await v_dc53ea.put(v_b24339, v_4d33b2, {
    httpMetadata: { contentType: "application/gzip" },
    customMetadata: { schemaVersion: v_823cb7 },
  });
}

export async function v_172c9f(
  bucket: v_0c7978,
  v_b24339,
): Promise<object | null> {
  const v_8839e3 = await v_dc53ea.get(v_b24339);
  if (!v_8839e3) return null;
  const v_fbb6da = new Uint8Array(await v_8839e3.arrayBuffer());
  const v_7ecfd1 = new TextDecoder().decode(await v_301697(v_fbb6da));
  return JSON.parse(v_7ecfd1) as object;
}

export async function v_c7071c(
  v_a1651b,
  v_3b27d9,
  v_389afb,
): Promise<{ key: string; body: Uint8Array }> {
  const v_6c1676 = v_a02f1c[v_3b27d9];
  const v_9390e8 = {};

  if (v_6c1676.length > 0) {
    const v_cb9428 = v_11bf9b[v_3b27d9];
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT ${v_6c1676.join(",")} FROM ${v_cb9428} WHERE id=?`)
      .bind(v_389afb)
      .first<Record<string, unknown>>();
    if (v_3ac7e7) {
      for (const v_3f4e2e of v_6c1676) v_9390e8[v_3f4e2e] = v_3ac7e7[v_3f4e2e] ?? null;
    }
  }

  const v_2c1bee = (
    await v_a1651b
      .prepare(
        `SELECT dek_id, kek_id, encrypted_dek, resource_type
           FROM dek_registry
          WHERE resource_type LIKE ? AND resource_id = ?`,
      )
      .bind(`${v_3b27d9}.%`, String(v_389afb))
      .all<{ dek_id: string; kek_id: string; encrypted_dek: string; resource_type: string }>()
  ).results;

  const v_5392c4 = {
    schema_version: v_823cb7,
    type: v_3b27d9,
    id: String(v_389afb),
    archived_at: new Date().toISOString(),
    data: v_f85cdf(v_9390e8),
    dekRegistry: v_2c1bee,
  };

  const v_b24339 = v_8afb61(v_3b27d9, v_389afb);
  const v_4d33b2 = await v_cfe090(new TextEncoder().encode(JSON.stringify(v_5392c4)));
  return { key: v_b24339, body: v_4d33b2 };
}

export async function v_ff8d3b(
  v_a1651b,
  v_5392c4,
): Promise<{ columnsRestored: number; dekRowsReinserted: number }> {
  const v_6c1676 = v_a02f1c[v_5392c4.type] ?? [];
  let v_d09d00 = 0;

  if (v_6c1676.length > 0) {
    const v_cb9428 = v_11bf9b[v_5392c4.type];
    const v_fc255a = v_6c1676.map((v_3f4e2e) => `${v_3f4e2e}=?`).join(",");
    const v_6fea0b = v_6c1676.map((v_3f4e2e) => v_e5e25c(v_5392c4.data[v_3f4e2e] ?? null));
    const v_b1eff4 = await v_a1651b
      .prepare(`UPDATE ${v_cb9428} SET ${v_fc255a} WHERE id=?`)
      .bind(...v_6fea0b, v_5392c4.id)
      .run();
    v_d09d00 = v_b1eff4.meta.changes ?? 0;
  }

  let v_0d36ed = 0;
  for (const v_cb35cb of v_5392c4.dekRegistry) {
    const v_8f00b9 = await v_a1651b
      .prepare(
        `INSERT OR IGNORE INTO dek_registry (dek_id, kek_id, encrypted_dek, resource_type, resource_id)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(v_cb35cb.dek_id, v_cb35cb.kek_id, v_cb35cb.encrypted_dek, v_cb35cb.resource_type, v_5392c4.id)
      .run();
    v_0d36ed += v_8f00b9.meta.changes ?? 0;
  }

  return { columnsRestored: v_d09d00, dekRowsReinserted: v_0d36ed };
}

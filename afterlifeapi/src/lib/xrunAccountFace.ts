

import type { v_273a0c } from "./env";

export type XrunFaceMatch = { status: "match"; embedding?: number[] } | { status: "mismatch" } | { status: "none" };

const v_c523cc = 512;
const v_8eab2f = 3_000;

export async function v_769690(v_a1651b, v_43e90c): Promise<number | null> {
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_43e90c)
    .first<{ xrun_member_id: number | null }>();
  return v_3ac7e7?.xrun_member_id ? Number(v_3ac7e7.xrun_member_id) : null;
}

function v_4c4400(v_81e2ef): string {
  const v_8d1421 = new Uint8Array(new Float32Array(v_81e2ef).buffer);
  let v_fd5f43 = "";
  for (const v_148ff6 of v_8d1421) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43);
}

function v_889aa1(v_fd5f43): number[] | null {
  try {
    const v_8d1421 = Uint8Array.from(atob(v_fd5f43), (v_10a17d) => v_10a17d.charCodeAt(0));
    if (v_8d1421.byteLength !== v_c523cc * 4) return null;
    return Array.from(new Float32Array(v_8d1421.buffer));
  } catch {
    return null;
  }
}

async function v_72d87d(env: v_273a0c, v_9fe22d, v_4d33b2, v_11bcf9): Promise<any | null> {
  if (!v_c9c489.XRUN_INTERNAL_SECRET || !v_c9c489.XRUN_API_URL) return null;
  const v_57bcd5 = new AbortController();
  const v_cb36b1 = setTimeout(() => v_57bcd5.abort(), v_11bcf9);
  try {
    const v_8f00b9 = await fetch(`${v_c9c489.XRUN_API_URL}${v_9fe22d}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": v_c9c489.XRUN_INTERNAL_SECRET },
      body: JSON.stringify(v_4d33b2),
      signal: v_57bcd5.signal,
    });
    if (!v_8f00b9.ok) return null;
    const v_7ecfd1 = (await v_8f00b9.json().catch(() => null)) as { status?: string; data?: unknown } | null;
    return v_7ecfd1?.status === "success" ? v_7ecfd1.data ?? null : null;
  } catch {
    return null;
  } finally {
    clearTimeout(v_cb36b1);
  }
}

export async function v_a298e2(
  env: v_273a0c,
  v_43e90c,
  v_f94e64,
  v_328259 = {},
): Promise<XrunFaceMatch> {
  const v_660822 = await v_769690(v_c9c489.DB, v_43e90c);
  if (!v_660822) return { status: "none" };
  const v_9390e8 = await v_72d87d(
    v_c9c489,
    "/oth-path",
    { member: v_660822, vectors: v_f94e64.map(v_4c4400), withEmbedding: v_328259.withEmbedding === true },
    v_328259.timeoutMs ?? v_8eab2f,
  );
  if (!v_9390e8 || typeof v_9390e8.enrolled !== "boolean" || typeof v_9390e8.match !== "boolean") return { status: "none" };
  if (!v_9390e8.enrolled) return { status: "none" };
  if (!v_9390e8.match) return { status: "mismatch" };
  if (!v_328259.withEmbedding) return { status: "match" };
  const v_6315f3 = typeof v_9390e8.embedding === "string" ? v_889aa1(v_9390e8.embedding) : null;
  return v_6315f3 ? { status: "match", embedding: v_6315f3 } : { status: "none" };
}

export async function v_a43ce1(env: v_273a0c, v_43e90c, v_11bcf9 = v_8eab2f): Promise<boolean> {
  const v_660822 = await v_769690(v_c9c489.DB, v_43e90c);
  if (!v_660822) return false;
  const v_9390e8 = await v_72d87d(v_c9c489, "/oth-path", { member: v_660822 }, v_11bcf9);
  return v_9390e8?.faceStatus === "active";
}


import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_278a53, v_7a6ff6, v_2fb81a, v_4b949c } from "../lib/assetJobs";

export const v_dcd415 = new v_b7c41b<v_de0a25>();

function v_a155c4(v_779914, v_148ff6): boolean {
  if (v_779914.length !== v_148ff6.length) return false;
  let v_cb35cb = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) v_cb35cb |= v_779914.charCodeAt(v_ebec57) ^ v_148ff6.charCodeAt(v_ebec57);
  return v_cb35cb === 0;
}

v_dcd415.post("/oth-path", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.ORCH_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.ORCH_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }

  const v_be62d3 = v_3f4e2e.req.param("callId");
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ role?: string; text?: string }>()
    .catch(() => ({}) as { role?: string; text?: string });
  const v_9b6134 = (v_4d33b2.text ?? "").trim();
  const v_22da99 = v_4d33b2.role === "clone" ? "clone" : null;
  if (!v_22da99 || !v_9b6134) return v_3f4e2e.json({ error: "bad_turn" }, 400);

  const v_d7296e = await v_3f4e2e.env.DB.prepare(
    "SELECT 1 FROM call_sessions WHERE call_id = ?"
  ).bind(v_be62d3).first();
  if (!v_d7296e) return v_3f4e2e.json({ error: "call_not_found" }, 404);

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO call_turns (call_id, seq, role, text, created_at)
     SELECT ?, COALESCE(MAX(seq),0)+1, ?, ?, ?
     FROM call_turns WHERE call_id = ?`
  ).bind(v_be62d3, v_22da99, v_9b6134, Date.now(), v_be62d3).run();
  return v_3f4e2e.json({ ok: true });
});

const v_0c84a2 = {
  idle_video: 300 * 1024 * 1024,  
  voice_clone: 50 * 1024 * 1024,  
};

const v_643509 = {
  idle_video: "video/mp4",
  voice_clone: "application/octet-stream",
};

v_dcd415.post("/asset-job-done", async (v_3f4e2e) => {

  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_ea333d = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_ea333d || !v_3f4e2e.env.ORCH_SECRET || !v_a155c4(v_ea333d, v_3f4e2e.env.ORCH_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }

  const v_ebd523 = await v_3f4e2e.req.formData();
  const v_04211c = String(v_ebd523.get("job_id") ?? "");
  const v_d308b5 = String(v_ebd523.get("status") ?? "");
  if (!v_04211c) return v_3f4e2e.json({ error: "job_id required" }, 400);

  const v_d5ec97 = await v_4b949c(v_3f4e2e.env.DB, v_04211c);
  if (!v_d5ec97) return v_3f4e2e.json({ error: "job not found" }, 404);

  const v_59b4e0 = String(v_ebd523.get("callback_token") ?? "");
  if (!v_d5ec97.callback_token || !v_59b4e0 || !v_a155c4(v_59b4e0, v_d5ec97.callback_token)) {
    return v_3f4e2e.json({ error: "invalid callback_token" }, 403);
  }

  if (v_d308b5 === "failed") {
    await v_7a6ff6(v_3f4e2e.env.DB, v_04211c, String(v_ebd523.get("error") ?? "generation failed"));
    return v_3f4e2e.json({ ok: true });
  }

  const v_21c42f = v_ebd523.get("file");
  if (!v_21c42f || typeof v_21c42f === "string") return v_3f4e2e.json({ error: "file required" }, 400);
  const v_4de33e = v_21c42f as File;
  const v_83ee53 = await v_4de33e.arrayBuffer();

  const v_9fffc2 = v_0c84a2[v_d5ec97.kind];
  if (v_9fffc2 !== undefined && v_83ee53.byteLength > v_9fffc2) {
    return v_3f4e2e.json(
      { error: `file too large: ${v_83ee53.byteLength} > ${v_9fffc2} bytes` },
      400,
    );
  }

  const v_0a2cd1 = await v_278a53(v_3f4e2e.env.DB, v_04211c);
  if (!v_0a2cd1) {

    return v_3f4e2e.json({ ok: true, idempotent: true });
  }

  const v_c0c2d5 = v_643509[v_0a2cd1.kind] ?? "application/octet-stream";

  const v_40a923 = v_0a2cd1.kind === "idle_video" ? "mp4" : "pth";
  const v_0037e3 = `assets/${v_0a2cd1.kind}/${v_04211c}.${v_40a923}`;
  await v_3f4e2e.env.R2_ARCHIVE.put(v_0037e3, v_83ee53, {
    httpMetadata: { contentType: v_c0c2d5 },
  });

  const v_43af15 = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
    )
    .bind(v_0037e3, v_c0c2d5, v_83ee53.byteLength, v_d5ec97.user_id, `asset_${v_0a2cd1.kind}`)
    .first<{ id: number }>();

  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  const v_7ce8a7 = `${v_f17108}/oth-path${v_43af15!.id}`;

  await v_2fb81a(v_3f4e2e.env.DB, v_04211c, v_43af15!.id, v_7ce8a7, v_0a2cd1.clone_id, v_0a2cd1.kind);

  return v_3f4e2e.json({ ok: true, out_url: v_7ce8a7 });
});

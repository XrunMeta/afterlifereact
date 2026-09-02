
import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_278a53, v_80401b, v_7a6ff6, v_c12e45, v_12ade7, v_2fb81a, v_4b949c } from "../lib/assetJobs";
import { v_1f4ea7 } from "../lib/validate";
import { v_74c502, v_5d4a51 } from "../lib/cloneAccess";
import { v_842ce7 } from "../lib/guideJob";
import {
  v_3821c0, v_0ac5b7, type v_d91e78,
  v_0761b1, v_600422,
} from "../lib/memoryStore";
import { v_db508f, v_20b0e8 } from "../lib/personaBundle";
import { v_74defc } from "../lib/logger";
import { v_8d5056, v_900412 } from "../lib/consentGate";

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
    .json<{ role?: string; text?: string; speakerPersonId?: unknown }>()
    .catch(() => ({}) as { role?: string; text?: string; speakerPersonId?: unknown });
  const v_9b6134 = (v_4d33b2.text ?? "").trim();

  const v_22da99 = v_4d33b2.role === "clone" || v_4d33b2.role === "user" ? v_4d33b2.role : null;
  if (!v_22da99 || !v_9b6134) return v_3f4e2e.json({ error: "bad_turn" }, 400);

  if (v_9b6134.length > 2000) return v_3f4e2e.json({ error: "text_too_long" }, 400);

  const v_d7296e = await v_3f4e2e.env.DB.prepare(
    "SELECT 1 FROM call_sessions WHERE call_id = ?"
  ).bind(v_be62d3).first();
  if (!v_d7296e) return v_3f4e2e.json({ error: "call_not_found" }, 404);

  const v_01ad49 = v_4d33b2.speakerPersonId;
  const v_b73ff1 =
    v_22da99 === "user" && typeof v_01ad49 === "number" && Number.isInteger(v_01ad49)
      ? v_01ad49
      : null;

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO call_turns (call_id, seq, role, text, created_at, speaker_person_id)
     SELECT ?, COALESCE(MAX(seq),0)+1, ?, ?, ?,
            (SELECT p.id FROM persons p
              WHERE p.id = ?
                AND p.clone_id = (SELECT clone_id FROM call_sessions WHERE call_id = ?))
     FROM call_turns WHERE call_id = ?`
  ).bind(v_be62d3, v_22da99, v_9b6134, Date.now(), v_b73ff1, v_be62d3, v_be62d3).run();
  return v_3f4e2e.json({ ok: true });
});

v_dcd415.post("/oth-path", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.LEARN_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.LEARN_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_be62d3 = v_3f4e2e.req.param("callId");

  if (!/^[0-9a-f]{12}$/.test(v_be62d3)) return v_3f4e2e.json({ ok: true });
  const v_3a0669 = Date.now();

  const v_d7296e = await v_3f4e2e.env.DB
    .prepare(
      `SELECT user_id, greeted_at FROM call_sessions WHERE call_id = ? AND ended_at IS NULL`,
    )
    .bind(v_be62d3)
    .first<{ user_id: number; greeted_at: number | null }>();
  await v_3f4e2e.env.DB.prepare(
    `UPDATE call_sessions SET ended_at = ?, duration_sec = MAX(0, (? - started_at) / 1000)
     WHERE call_id = ? AND ended_at IS NULL`,
  ).bind(v_3a0669, v_3a0669, v_be62d3).run();

  if (v_d7296e?.greeted_at && v_d7296e?.user_id) {
    const v_c81699 = Math.max(0, v_3a0669 - v_d7296e.greeted_at);
    const v_b62d44 = Math.floor(v_c81699 / 1000);
    const v_d7bc64 = Math.floor(v_b62d44 / 10) * 10;
    if (v_d7bc64 > 0) {
      try {
        const { spendCallTime: v_a025af } = await import("../lib/credits");
        const v_cb35cb = await v_a025af(v_3f4e2e, {
          userId: v_d7296e.user_id,
          amountSec: v_d7bc64,
          callId: v_be62d3,
        });
        await v_3f4e2e.env.DB
          .prepare(
            `UPDATE call_sessions SET billed_sec = ?, unbilled_sec = ?, billed_at = ? WHERE call_id = ?`,
          )
          .bind(v_cb35cb.billedSec, v_cb35cb.unbilledSec, v_3a0669, v_be62d3)
          .run();
      } catch (v_49263d) {
        console.error(`[t167] internal call bill fail callId=${v_be62d3} err=${(v_49263d as Error).message}`);
      }
    }
  }
  return v_3f4e2e.json({ ok: true });
});

v_dcd415.post("/oth-path", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.LEARN_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.LEARN_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_be62d3 = v_3f4e2e.req.param("callId");
  if (!/^[0-9a-f]{12}$/.test(v_be62d3)) {
    return v_3f4e2e.json({ ok: true, allowedSec: 0, maxEndAt: 0 });
  }
  const v_d7296e = await v_3f4e2e.env.DB
    .prepare(
      `SELECT user_id, greeted_at FROM call_sessions
        WHERE call_id = ? AND ended_at IS NULL`,
    )
    .bind(v_be62d3)
    .first<{ user_id: number; greeted_at: number | null }>();
  if (!v_d7296e) {

    return v_3f4e2e.json({ ok: true, allowedSec: 0, maxEndAt: 0 });
  }

  const v_7063ed = v_d7296e.greeted_at ?? Date.now();
  if (v_d7296e.greeted_at === null) {
    await v_3f4e2e.env.DB
      .prepare(`UPDATE call_sessions SET greeted_at = ? WHERE call_id = ? AND greeted_at IS NULL`)
      .bind(v_7063ed, v_be62d3)
      .run();
  }

  const v_8dd686 = await v_3f4e2e.env.DB
    .prepare(`SELECT credits FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_d7296e.user_id)
    .first<{ credits: number }>();
  const v_4cfdf6 = Math.max(0, v_8dd686?.credits ?? 0);
  const v_618da1 = v_7063ed + v_4cfdf6 * 1000;

  return v_3f4e2e.json({ ok: true, allowedSec: v_4cfdf6, maxEndAt: v_618da1, greetedAt: v_7063ed });
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

  if (v_0a2cd1.kind === "idle_video" && v_0a2cd1.clone_id && v_3f4e2e.env.EMOTE_RENDER_SECRET) {
    const v_d0c2ab = v_3f4e2e.env.CALL_PRETHIRD_BASE?.replace(/\/prethird\/?$/, "") ?? "https://rtc.example.invalid";
    const v_555aed = `${v_d0c2ab}/emote/render`;

    const v_7d769d = await v_3f4e2e.env.DB
      .prepare(`SELECT src_file_id FROM clone_asset_jobs WHERE id=?`)
      .bind(v_04211c)
      .first<{ src_file_id: number | null }>();
    if (v_7d769d?.src_file_id) {
      const v_2d0601 = `${v_f17108}/oth-path${v_7d769d.src_file_id}`;
      v_3f4e2e.executionCtx.waitUntil(
        fetch(v_555aed, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${v_3f4e2e.env.EMOTE_RENDER_SECRET}`,
          },
          body: JSON.stringify({
            cloneId: v_0a2cd1.clone_id,
            action: "smile",
            faceUrl: v_2d0601,
          }),
        }).catch(() => {}),
      );
    }
  }

  return v_3f4e2e.json({ ok: true, out_url: v_7ce8a7 });
});

const v_fb792a = "video/mp4";

const v_347233 = 50 * 1024 * 1024;

const v_5360f6 = 3;
const v_e7afe3 = 8;

v_dcd415.post("/filler-job-done", async (v_3f4e2e) => {

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

  if (v_ebd523.get(`file${v_e7afe3}`) !== null) {
    return v_3f4e2e.json(
      { error: `too many files: max ${v_e7afe3} (file0..file${v_e7afe3 - 1})` },
      400,
    );
  }
  const v_58b838 = [];
  for (let v_ebec57 = 0; v_ebec57 < v_e7afe3; v_ebec57++) {
    const v_2b8338 = v_ebd523.get(`file${v_ebec57}`);
    if (v_2b8338 === null) break;
    if (typeof v_2b8338 === "string") {
      return v_3f4e2e.json({ error: `file${v_ebec57} must be a file` }, 400);
    }
    v_58b838.push(v_2b8338 as File);
  }
  if (v_58b838.length < v_5360f6) {
    return v_3f4e2e.json(
      { error: `file0..file${v_5360f6 - 1} required (need ${v_5360f6}~${v_e7afe3} files)` },
      400,
    );
  }

  for (let v_ebec57 = v_58b838.length + 1; v_ebec57 < v_e7afe3; v_ebec57++) {
    if (v_ebd523.get(`file${v_ebec57}`) !== null) {
      return v_3f4e2e.json({ error: `file index gap: file${v_58b838.length} missing but file${v_ebec57} present` }, 400);
    }
  }
  const v_cd9d29 = v_58b838.length;

  for (let v_ebec57 = 0; v_ebec57 < v_cd9d29; v_ebec57++) {
    const v_8b5cd8 = v_58b838[v_ebec57];
    if (!v_8b5cd8) {
      return v_3f4e2e.json({ error: `file${v_ebec57} missing` }, 400);
    }
    if (v_8b5cd8.size === 0) {
      return v_3f4e2e.json({ error: `file${v_ebec57} is empty (0 bytes)` }, 400);
    }
    if (v_8b5cd8.size > v_347233) {
      return v_3f4e2e.json(
        { error: `file${v_ebec57} too large: ${v_8b5cd8.size} > ${v_347233} bytes` },
        400,
      );
    }
  }

  const v_329662 = [];
  for (let v_ebec57 = 0; v_ebec57 < v_cd9d29; v_ebec57++) {
    const v_83ee53 = await v_58b838[v_ebec57]?.arrayBuffer();
    if (!v_83ee53) {
      return v_3f4e2e.json({ error: `file${v_ebec57} read failed` }, 400);
    }
    v_329662.push(v_83ee53);
  }

  if (v_d5ec97.kind !== "filler") {
    return v_3f4e2e.json({ error: "kind_mismatch" }, 409);
  }

  const v_0a2cd1 = await v_80401b(v_3f4e2e.env.DB, v_04211c);
  if (!v_0a2cd1) {
    return v_3f4e2e.json({ ok: true, idempotent: true });
  }

  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  const v_9cd995 = [];
  try {
    for (let v_ebec57 = 0; v_ebec57 < v_cd9d29; v_ebec57++) {
      const v_83ee53 = v_329662[v_ebec57];
      if (!v_83ee53) {
        throw new Error(`buf${v_ebec57} missing`);
      }
      const v_07ba85 = crypto.randomUUID();
      const v_0037e3 = `assets/filler/${v_07ba85}.mp4`;
      await v_3f4e2e.env.R2_ARCHIVE.put(v_0037e3, v_83ee53, {
        httpMetadata: { contentType: v_fb792a },
      });
      v_9cd995.push({ r2Key: v_0037e3, sizeBytes: v_83ee53.byteLength });
    }
  } catch (v_49263d) {

    for (const { r2Key: v_0037e3 } of v_9cd995) {
      await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3).catch(() => {});
    }
    await v_7a6ff6(v_3f4e2e.env.DB, v_04211c, `r2_upload_failed: ${String(v_49263d).slice(0, 400)}`);
    return v_3f4e2e.json({ error: "r2_upload_failed" }, 500);
  }

  let v_942aa2;
  try {
    v_942aa2 = await v_c12e45(
      v_3f4e2e.env.DB,
      v_04211c,
      v_9cd995,
      v_d5ec97.user_id,
      v_0a2cd1.clone_id,
      v_f17108,
    );
  } catch (v_49263d) {

    for (const { r2Key: v_0037e3 } of v_9cd995) {
      await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3).catch(() => {});
    }
    await v_7a6ff6(v_3f4e2e.env.DB, v_04211c, `db_commit_failed: ${String(v_49263d).slice(0, 400)}`);
    return v_3f4e2e.json({ error: "db_commit_failed" }, 500);
  }

  if (v_942aa2 === null) {

    for (const { r2Key: v_0037e3 } of v_9cd995) {
      await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3).catch(() => {});
    }
    return v_3f4e2e.json({ ok: true, idempotent: true });
  }

  return v_3f4e2e.json({ ok: true, filler_video_urls: v_942aa2 });
});

const v_dcae87 = "video/mp4";

const v_de0300 = 50 * 1024 * 1024;

const v_71c416 = 1;
const v_2131d9 = 3;

v_dcd415.post("/guide-job-done", async (v_3f4e2e) => {

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

  if (v_ebd523.get(`file${v_2131d9}`) !== null) {
    return v_3f4e2e.json(
      { error: `too many files: max ${v_2131d9} (file0..file${v_2131d9 - 1})` },
      400,
    );
  }
  const v_58b838 = [];
  for (let v_ebec57 = 0; v_ebec57 < v_2131d9; v_ebec57++) {
    const v_2b8338 = v_ebd523.get(`file${v_ebec57}`);
    if (v_2b8338 === null) break;
    if (typeof v_2b8338 === "string") {
      return v_3f4e2e.json({ error: `file${v_ebec57} must be a file` }, 400);
    }
    v_58b838.push(v_2b8338 as File);
  }
  if (v_58b838.length < v_71c416) {
    return v_3f4e2e.json(
      { error: `file0..file${v_71c416 - 1} required (need ${v_71c416}~${v_2131d9} files)` },
      400,
    );
  }

  for (let v_ebec57 = v_58b838.length + 1; v_ebec57 < v_2131d9; v_ebec57++) {
    if (v_ebd523.get(`file${v_ebec57}`) !== null) {
      return v_3f4e2e.json({ error: `file index gap: file${v_58b838.length} missing but file${v_ebec57} present` }, 400);
    }
  }
  const v_cd9d29 = v_58b838.length;

  for (let v_ebec57 = 0; v_ebec57 < v_cd9d29; v_ebec57++) {
    const v_8b5cd8 = v_58b838[v_ebec57];
    if (!v_8b5cd8) {
      return v_3f4e2e.json({ error: `file${v_ebec57} missing` }, 400);
    }
    if (v_8b5cd8.size === 0) {
      return v_3f4e2e.json({ error: `file${v_ebec57} is empty (0 bytes)` }, 400);
    }
    if (v_8b5cd8.size > v_de0300) {
      return v_3f4e2e.json(
        { error: `file${v_ebec57} too large: ${v_8b5cd8.size} > ${v_de0300} bytes` },
        400,
      );
    }
  }

  const v_329662 = [];
  for (let v_ebec57 = 0; v_ebec57 < v_cd9d29; v_ebec57++) {
    const v_83ee53 = await v_58b838[v_ebec57]?.arrayBuffer();
    if (!v_83ee53) {
      return v_3f4e2e.json({ error: `file${v_ebec57} read failed` }, 400);
    }
    v_329662.push(v_83ee53);
  }

  if (v_d5ec97.kind !== "guide") {
    return v_3f4e2e.json({ error: "kind_mismatch" }, 409);
  }

  const v_0a2cd1 = await v_80401b(v_3f4e2e.env.DB, v_04211c);
  if (!v_0a2cd1) {
    return v_3f4e2e.json({ ok: true, idempotent: true });
  }

  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  const v_9cd995 = [];
  try {
    for (let v_ebec57 = 0; v_ebec57 < v_cd9d29; v_ebec57++) {
      const v_83ee53 = v_329662[v_ebec57];
      if (!v_83ee53) {
        throw new Error(`buf${v_ebec57} missing`);
      }
      const v_07ba85 = crypto.randomUUID();
      const v_0037e3 = `assets/guide/${v_07ba85}.mp4`;
      await v_3f4e2e.env.R2_ARCHIVE.put(v_0037e3, v_83ee53, {
        httpMetadata: { contentType: v_dcae87 },
      });
      v_9cd995.push({ r2Key: v_0037e3, sizeBytes: v_83ee53.byteLength });
    }
  } catch (v_49263d) {

    for (const { r2Key: v_0037e3 } of v_9cd995) {
      await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3).catch(() => {});
    }
    await v_7a6ff6(v_3f4e2e.env.DB, v_04211c, `r2_upload_failed: ${String(v_49263d).slice(0, 400)}`);
    return v_3f4e2e.json({ error: "r2_upload_failed" }, 500);
  }

  let v_942aa2;
  try {
    v_942aa2 = await v_12ade7(
      v_3f4e2e.env.DB,
      v_04211c,
      v_9cd995,
      v_d5ec97.user_id,
      v_0a2cd1.clone_id,
      v_f17108,
      "guide",
    );
  } catch (v_49263d) {

    for (const { r2Key: v_0037e3 } of v_9cd995) {
      await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3).catch(() => {});
    }
    await v_7a6ff6(v_3f4e2e.env.DB, v_04211c, `db_commit_failed: ${String(v_49263d).slice(0, 400)}`);
    return v_3f4e2e.json({ error: "db_commit_failed" }, 500);
  }

  if (v_942aa2 === null) {

    for (const { r2Key: v_0037e3 } of v_9cd995) {
      await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3).catch(() => {});
    }
    return v_3f4e2e.json({ ok: true, idempotent: true });
  }

  return v_3f4e2e.json({ ok: true, guide_video_urls: v_942aa2 });
});

const v_918eb6 = v_1f4ea7.object({
  userId: v_1f4ea7.number().int().positive(),
  extracted: v_1f4ea7.object({

    preference_personal: v_1f4ea7
      .record(v_1f4ea7.string().max(100), v_1f4ea7.union([v_1f4ea7.string().max(200), v_1f4ea7.number(), v_1f4ea7.boolean()]))
      .optional(),
    relation: v_1f4ea7.string().max(200).nullable().optional(),
    memories_personal: v_1f4ea7.array(v_1f4ea7.string().max(500)).max(20).optional(),
  }),
  source: v_1f4ea7.enum(["call", "chat"]),
  session_id: v_1f4ea7.string().max(64).optional(),
});

v_dcd415.post("/oth-path", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.LEARN_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.LEARN_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    return v_3f4e2e.json({ error: "bad_clone_id" }, 400);
  }
  const v_8decf8 = v_918eb6.safeParse(await v_3f4e2e.req.json().catch(() => ({})));
  if (!v_8decf8.success) {
    return v_3f4e2e.json({ error: "bad_body", issues: v_8decf8.error.issues }, 400);
  }
  const { userId: v_43e90c, extracted: v_631e71, source: v_04e790 } = v_8decf8.data;

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone_not_found" }, 404);

  const v_eaefcf = await v_3f4e2e.env.DB.prepare(
    v_04e790 === "call"
      ? `SELECT 1 FROM call_sessions WHERE clone_id = ? AND user_id = ? LIMIT 1`
      : `SELECT 1 FROM messages WHERE clone_id = ? AND user_id = ? LIMIT 1`,
  ).bind(v_6e0fd3, v_43e90c).first();
  if (!v_eaefcf) return v_3f4e2e.json({ error: "no_interaction" }, 403);

  if (!(await v_8d5056(v_3f4e2e.env, v_43e90c))) {
    return v_3f4e2e.json({ ok: true, skipped: true, reason: "no_consent" });
  }

  let v_43c42e;
  try {
    v_43c42e = await v_0ac5b7(
      v_3f4e2e.env, v_6e0fd3, v_43e90c, v_631e71 as v_d91e78, v_04e790,
    );
  } catch (v_49263d) {
    return v_3f4e2e.json({ error: "merge_failed", message: (v_49263d as Error).message }, 400);
  }

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "memory.l2.learn",
    details: v_43c42e.skipped
      ? { cloneId: v_6e0fd3, source: v_04e790, skipped: true }
      : {
          cloneId: v_6e0fd3, source: v_04e790, skipped: false, rev: v_43c42e.rev,
          keys: Object.keys(v_631e71.preference_personal ?? {}),
          memCount: v_631e71.memories_personal?.length ?? 0,
        },
  });
  return v_3f4e2e.json(
    v_43c42e.skipped
      ? { ok: true, skipped: true }
      : { ok: true, skipped: false, rev: v_43c42e.rev },
  );
});

v_dcd415.get("/dev/clones/:id/ont-raw", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.DEV_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.DEV_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  const v_43e90c = Number(v_3f4e2e.req.query("userId"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0 || !Number.isInteger(v_43e90c) || v_43e90c <= 0) {
    return v_3f4e2e.json({ error: "invalid clone_id or userId" }, 400);
  }
  const v_479f05 = await v_3821c0(v_3f4e2e.env, v_6e0fd3, v_43e90c);
  let v_9390e8 = null;
  if (v_479f05) { try { v_9390e8 = JSON.parse(v_479f05); } catch { v_9390e8 = null; } }
  const { l1: v_020b4b } = await v_db508f(v_3f4e2e.env.DB, v_6e0fd3);
  const v_ef4edb = await v_20b0e8(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "dev.ont_raw.read",
    details: { cloneId: v_6e0fd3 },
  });

  return v_3f4e2e.json({ data: v_9390e8, l1_profile: v_020b4b, l2_consumed: v_ef4edb });
});

const v_8f1444 = v_1f4ea7.object({
  userId: v_1f4ea7.number().int().positive(),
  extracted: v_1f4ea7.object({
    preference_personal: v_1f4ea7
      .record(v_1f4ea7.string().max(100), v_1f4ea7.union([v_1f4ea7.string().max(200), v_1f4ea7.number(), v_1f4ea7.boolean()]))
      .optional(),
    relation: v_1f4ea7.string().max(200).nullable().optional(),
    memories_personal: v_1f4ea7.array(v_1f4ea7.string().max(500)).max(20).optional(),
  }),
  source: v_1f4ea7.enum(["call", "chat"]),
});

v_dcd415.post("/dev/clones/:id/ont-merge", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.DEV_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.DEV_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    return v_3f4e2e.json({ error: "bad_clone_id" }, 400);
  }
  const v_8decf8 = v_8f1444.safeParse(await v_3f4e2e.req.json().catch(() => ({})));
  if (!v_8decf8.success) {
    return v_3f4e2e.json({ error: "bad_body", issues: v_8decf8.error.issues }, 400);
  }
  const { userId: v_43e90c, extracted: v_631e71, source: v_04e790 } = v_8decf8.data;

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone_not_found" }, 404);

  const v_f407d5 = await v_3f4e2e.env.DB.prepare("SELECT 1 FROM users WHERE id = ?")
    .bind(v_43e90c).first();
  if (!v_f407d5) return v_3f4e2e.json({ error: "user_not_found" }, 404);

  let v_43c42e;
  try {
    v_43c42e = await v_0ac5b7(
      v_3f4e2e.env, v_6e0fd3, v_43e90c, v_631e71 as v_d91e78, v_04e790,
    );
  } catch (v_49263d) {
    return v_3f4e2e.json({ error: "merge_failed", message: (v_49263d as Error).message }, 400);
  }

  const v_479f05 = await v_3821c0(v_3f4e2e.env, v_6e0fd3, v_43e90c);
  let v_9390e8 = null;
  if (v_479f05) { try { v_9390e8 = JSON.parse(v_479f05); } catch { v_9390e8 = null; } }

  try {
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "dev.ont_merge.write",
      details: { cloneId: v_6e0fd3, rev: v_43c42e.rev },
    });
  } catch {  }

  return v_3f4e2e.json({ rev: v_43c42e.rev, skipped: v_43c42e.skipped, data: v_9390e8 });
});

v_dcd415.get("/dev/clones/:id/l2p-raw", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.DEV_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.DEV_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  const v_ca1ec5 = Number(v_3f4e2e.req.query("personId"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0 || !Number.isInteger(v_ca1ec5) || v_ca1ec5 <= 0) {
    return v_3f4e2e.json({ error: "invalid clone_id or personId" }, 400);
  }

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone_not_found" }, 404);

  const v_306a28 = await v_3f4e2e.env.DB.prepare(
    "SELECT user_id, display_name FROM persons WHERE id = ? AND (clone_id = ? OR clone_id IS NULL)"
  ).bind(v_ca1ec5, v_6e0fd3).first<{ user_id: number; display_name: string | null }>();
  if (!v_306a28) return v_3f4e2e.json({ error: "person_not_found" }, 404);
  const v_479f05 = await v_0761b1(v_3f4e2e.env, v_6e0fd3, v_ca1ec5);
  let v_9390e8 = null;
  if (v_479f05) { try { v_9390e8 = JSON.parse(v_479f05); } catch { v_9390e8 = null; } }
  try {
    await v_74defc(v_3f4e2e, { userId: v_306a28.user_id, action: "dev.l2p_raw.read", details: { cloneId: v_6e0fd3, personId: v_ca1ec5 } });
  } catch {  }
  return v_3f4e2e.json({ data: v_9390e8, displayName: v_306a28.display_name ?? null });
});

const v_72ab95 = v_1f4ea7.object({
  personId: v_1f4ea7.number().int().positive(),
  extracted: v_1f4ea7.object({
    preference_personal: v_1f4ea7
      .record(v_1f4ea7.string().max(100), v_1f4ea7.union([v_1f4ea7.string().max(200), v_1f4ea7.number(), v_1f4ea7.boolean()]))
      .optional(),
    relation: v_1f4ea7.string().max(200).nullable().optional(),
    memories_personal: v_1f4ea7.array(v_1f4ea7.string().max(500)).max(20).optional(),
  }),
  source: v_1f4ea7.enum(["call", "chat"]),
});

v_dcd415.post("/dev/clones/:id/ont-merge-person", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.DEV_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.DEV_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    return v_3f4e2e.json({ error: "bad_clone_id" }, 400);
  }
  const v_8decf8 = v_72ab95.safeParse(await v_3f4e2e.req.json().catch(() => ({})));
  if (!v_8decf8.success) {
    return v_3f4e2e.json({ error: "bad_body", issues: v_8decf8.error.issues }, 400);
  }
  const { personId: v_ca1ec5, extracted: v_631e71, source: v_04e790 } = v_8decf8.data;

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone_not_found" }, 404);

  const v_306a28 = await v_3f4e2e.env.DB.prepare(
    "SELECT user_id FROM persons WHERE id = ? AND (clone_id = ? OR clone_id IS NULL)"
  ).bind(v_ca1ec5, v_6e0fd3).first<{ user_id: number }>();
  if (!v_306a28) return v_3f4e2e.json({ error: "person_not_found" }, 404);

  let v_43c42e;
  try {
    v_43c42e = await v_600422(v_3f4e2e.env, v_6e0fd3, v_ca1ec5, v_631e71 as v_d91e78, v_04e790);
  } catch (v_49263d) {
    return v_3f4e2e.json({ error: "merge_failed", message: (v_49263d as Error).message }, 400);
  }

  const v_479f05 = await v_0761b1(v_3f4e2e.env, v_6e0fd3, v_ca1ec5);
  let v_9390e8 = null;
  if (v_479f05) { try { v_9390e8 = JSON.parse(v_479f05); } catch { v_9390e8 = null; } }
  try {
    await v_74defc(v_3f4e2e, { userId: v_306a28.user_id, action: "dev.l2p_merge.write", details: { cloneId: v_6e0fd3, personId: v_ca1ec5, rev: v_43c42e.rev } });
  } catch {  }
  return v_3f4e2e.json({ rev: v_43c42e.rev, skipped: v_43c42e.skipped, data: v_9390e8 });
});

v_dcd415.get("/dev/guide-backfill-targets", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.DEV_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.DEV_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_18b8bf = await v_3f4e2e.env.DB.prepare(
    `SELECT c.id AS id, c.owner_id AS user_id,
            (SELECT src_file_id FROM clone_asset_jobs
              WHERE clone_id = c.id AND kind = 'idle_video' AND status = 'done'
              ORDER BY created_at DESC, rowid DESC LIMIT 1) AS face_src_file_id,
            (SELECT src_file_id FROM clone_asset_jobs
              WHERE clone_id = c.id AND kind = 'voice_clone' AND status = 'done'
              ORDER BY created_at DESC, rowid DESC LIMIT 1) AS voice_src_file_id
       FROM clones c
      WHERE c.guide_video_urls IS NULL AND ${v_74c502("c")}`,
  ).all<{ id: number; user_id: number; face_src_file_id: number | null; voice_src_file_id: number | null }>();

  const v_9390e8 = (v_18b8bf.results ?? []).filter(
    (v_cb35cb) => v_cb35cb.face_src_file_id != null && v_cb35cb.voice_src_file_id != null,
  );
  return v_3f4e2e.json({ data: v_9390e8 });
});

v_dcd415.post("/dev/clones/:id/guide-job", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.DEV_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.DEV_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    return v_3f4e2e.json({ error: "bad_clone_id" }, 400);
  }
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone_not_found" }, 404);

  if (v_eb25ce.guide_video_urls) {
    return v_3f4e2e.json({ skipped: true, guide_video_urls: v_eb25ce.guide_video_urls }, 200);
  }

  const v_7f3fda = await v_3f4e2e.env.DB.prepare(
    `SELECT src_file_id FROM clone_asset_jobs
      WHERE clone_id = ? AND kind = 'idle_video' AND status = 'done'
      ORDER BY created_at DESC, rowid DESC LIMIT 1`,
  ).bind(v_6e0fd3).first<{ src_file_id: number }>();
  const v_710de1 = await v_3f4e2e.env.DB.prepare(
    `SELECT src_file_id FROM clone_asset_jobs
      WHERE clone_id = ? AND kind = 'voice_clone' AND status = 'done'
      ORDER BY created_at DESC, rowid DESC LIMIT 1`,
  ).bind(v_6e0fd3).first<{ src_file_id: number }>();
  if (!v_7f3fda || !v_710de1) {
    return v_3f4e2e.json({ error: "asset_jobs_missing" }, 400);
  }

  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  const v_35d74b = `${v_f17108}/oth-path${v_710de1.src_file_id}`;

  const v_43c42e = await v_842ce7(v_3f4e2e.env.DB, {
    cloneId: v_6e0fd3,
    userId: v_eb25ce.owner_id,
    faceSrcFileId: v_7f3fda.src_file_id,
    voiceRawUrl: v_35d74b,
    origin: v_f17108,
    orchestratorUrl: v_3f4e2e.env.ORCHESTRATOR_URL,
    orchSecret: v_3f4e2e.env.ORCH_SECRET,
    waitUntil: (v_e2a85c) => v_3f4e2e.executionCtx.waitUntil(v_e2a85c),
  });

  return v_3f4e2e.json({ guideJobId: v_43c42e.guideJobId }, 201);
});

async function v_a30df4(v_a1651b, v_ca1ec5, v_6e0fd3): Promise<boolean> {
  const v_3ac7e7 = await v_a1651b.prepare(
    `SELECT 1 FROM persons p
     JOIN call_sessions cs ON cs.user_id = p.user_id
     WHERE p.id = ? AND cs.clone_id = ? LIMIT 1`,
  ).bind(v_ca1ec5, v_6e0fd3).first();
  return !!v_3ac7e7;
}

v_dcd415.get("/oth-path", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.LEARN_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.LEARN_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    return v_3f4e2e.json({ error: "bad_clone_id" }, 400);
  }
  const v_ca1ec5 = Number(v_3f4e2e.req.query("personId"));
  if (!Number.isInteger(v_ca1ec5) || v_ca1ec5 <= 0) {
    return v_3f4e2e.json({ error: "bad_person_id" }, 400);
  }

  const v_bcc292 = await v_a30df4(v_3f4e2e.env.DB, v_ca1ec5, v_6e0fd3);
  if (!v_bcc292) return v_3f4e2e.json({ error: "not_found" }, 404);

  const v_479f05 = await v_0761b1(v_3f4e2e.env, v_6e0fd3, v_ca1ec5);
  let v_9390e8 = null;
  if (v_479f05) {
    try {
      v_9390e8 = JSON.parse(v_479f05) as Record<string, unknown>;
    } catch {

      console.error(`[D1_CORRUPT] l2p:${v_6e0fd3}:pid:${String(v_ca1ec5).slice(-3)} not JSON`);
      v_9390e8 = null;
    }
  }

  const v_306a28 = await v_3f4e2e.env.DB.prepare(
    "SELECT display_name FROM persons WHERE id = ?"
  ).bind(v_ca1ec5).first<{ display_name: string | null }>();

  return v_3f4e2e.json({ data: v_9390e8, displayName: v_306a28?.display_name ?? null });
});

const v_3147b5 = v_1f4ea7.object({
  personId: v_1f4ea7.number().int().positive(),
  extracted: v_1f4ea7.object({
    preference_personal: v_1f4ea7
      .record(v_1f4ea7.string().max(100), v_1f4ea7.union([v_1f4ea7.string().max(200), v_1f4ea7.number(), v_1f4ea7.boolean()]))
      .optional(),
    relation: v_1f4ea7.string().max(200).nullable().optional(),
    memories_personal: v_1f4ea7.array(v_1f4ea7.string().max(500)).max(20).optional(),
  }),
  source: v_1f4ea7.enum(["call", "chat"]),
  session_id: v_1f4ea7.string().max(64).optional(),
});

v_dcd415.post("/oth-path", async (v_3f4e2e) => {
  const v_68f0aa = v_3f4e2e.req.header("Authorization") ?? "";
  const v_21cc31 = v_68f0aa.startsWith("Bearer ") ? v_68f0aa.slice(7) : "";
  if (!v_21cc31 || !v_3f4e2e.env.LEARN_SECRET || !v_a155c4(v_21cc31, v_3f4e2e.env.LEARN_SECRET)) {
    return v_3f4e2e.json({ error: "unauthorized" }, 401);
  }
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    return v_3f4e2e.json({ error: "bad_clone_id" }, 400);
  }
  const v_8decf8 = v_3147b5.safeParse(await v_3f4e2e.req.json().catch(() => ({})));
  if (!v_8decf8.success) {
    return v_3f4e2e.json({ error: "bad_body", issues: v_8decf8.error.issues }, 400);
  }
  const { personId: v_ca1ec5, extracted: v_631e71, source: v_04e790 } = v_8decf8.data;

  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) return v_3f4e2e.json({ error: "clone_not_found" }, 404);

  const v_eaefcf = await v_a30df4(v_3f4e2e.env.DB, v_ca1ec5, v_6e0fd3);
  if (!v_eaefcf) return v_3f4e2e.json({ error: "no_interaction" }, 403);

  if (!(await v_900412(v_3f4e2e.env, v_ca1ec5))) {
    return v_3f4e2e.json({ ok: true, skipped: true, reason: "no_consent" });
  }

  let v_43c42e;
  try {
    v_43c42e = await v_600422(
      v_3f4e2e.env, v_6e0fd3, v_ca1ec5, v_631e71 as v_d91e78, v_04e790,
    );
  } catch (v_49263d) {
    return v_3f4e2e.json({ error: "merge_failed", message: (v_49263d as Error).message }, 400);
  }

  await v_74defc(v_3f4e2e, {
    userId: null,
    action: "memory.l2p.learn",
    details: v_43c42e.skipped
      ? { cloneId: v_6e0fd3, personId: v_ca1ec5, source: v_04e790, skipped: true }
      : {
          cloneId: v_6e0fd3, personId: v_ca1ec5, source: v_04e790, skipped: false, rev: v_43c42e.rev,
          keys: Object.keys(v_631e71.preference_personal ?? {}),
          memCount: v_631e71.memories_personal?.length ?? 0,
        },
  });
  return v_3f4e2e.json(
    v_43c42e.skipped
      ? { ok: true, skipped: true }
      : { ok: true, skipped: false, rev: v_43c42e.rev },
  );
});



import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(v_e0c7e8)
    .first<{ id: number }>();
  return v_ceb55a!.id;
}

const v_1c6d39 = 9500;

let v_0060ed;
let v_b15b1e;

v_ba7107(async () => {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;

  await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO files (id, r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'voice/sample/yeongji.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog')`,
    )
    .bind(v_1c6d39)
    .run();

  await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO voice_presets
         (id, name, gender, age_range, description, sort_order, is_active, r2_key, se_key, src_file_id)
       VALUES (9510, '영지', NULL, NULL, NULL, 1, 1, 'voice/sample/yeongji.mp3', NULL, 9500)`,
    )
    .run();

  const v_7a3219 = await v_bfb240("catalog-other@test.com");
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES ('uploadedfiles/other-catalog-test.jpg', 'image/jpeg', 1, ?, 'clone_avatar')
       RETURNING id`,
    )
    .bind(v_7a3219)
    .first<{ id: number }>();
  v_0060ed = v_cb35cb!.id;

  v_b15b1e = await v_bfb240("catalog-user@test.com");
});

v_469bf2("GET /oth-path — srcFileId 포함", () => {
  v_23805a("활성 카탈로그 항목에 srcFileId 를 포함한다", async () => {
    const v_21cc31 = await v_86c39f(v_b15b1e);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{
      voices: Array<{ id: number; srcFileId: number | null; sampleUrl: string }>;
    }>();
    v_4d37e3(v_4d33b2.voices.length).toBeGreaterThan(0);

    for (const v_81e2ef of v_4d33b2.voices) {
      v_4d37e3(v_81e2ef).toHaveProperty("srcFileId");
      v_4d37e3(typeof v_81e2ef.srcFileId === "number" || v_81e2ef.srcFileId === null).toBe(true);
    }
  });

  v_23805a("카탈로그 시드 항목(영지 id=9510)의 srcFileId 가 9500 이다", async () => {
    const v_21cc31 = await v_86c39f(v_b15b1e);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    const v_4d33b2 = await v_8f00b9.json<{
      voices: Array<{ id: number; name: string; srcFileId: number | null }>;
    }>();
    const v_cec819 = v_4d33b2.voices.find((v_81e2ef) => v_81e2ef.id === 9510);
    v_4d37e3(v_cec819).toBeDefined();
    v_4d37e3(v_cec819!.srcFileId).toBe(9500);
  });
});

v_469bf2("POST /oth-path — 카탈로그 공용 파일 허용", () => {
  v_23805a("voice_catalog 파일은 본인 소유가 아니어도 voice_clone job 생성을 허용한다 (201)", async () => {
    const v_21cc31 = await v_86c39f(v_b15b1e);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: v_1c6d39 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = await v_8f00b9.json<{ job_id: string; status: string }>();
    v_4d37e3(v_4d33b2.job_id).toBeTruthy();
    v_4d37e3(v_4d33b2.status).toBe("pending");
  });

  v_23805a("일반 타인 소유 파일은 여전히 404 로 거부한다", async () => {
    const v_21cc31 = await v_86c39f(v_b15b1e);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: v_0060ed }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });
});

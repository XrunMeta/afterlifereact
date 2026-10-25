import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_06ba1d = () => (v_c9c489 as unknown as { R2_ARCHIVE: R2Bucket }).R2_ARCHIVE;

async function v_38cec9(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_c808bd(v_1badb6, v_b24339): Promise<number> {
  await v_06ba1d().put(v_b24339, "data");
  const v_3ac7e7 = await v_a1651b()
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?, 'image/jpeg', 4, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_1badb6)
    .first<{ id: number }>();
  return v_3ac7e7!.id;
}

const v_4a1fb4 = (v_389afb) => `https://afterlife-api-preview.example.dev/oth-path${v_389afb}`;

async function v_4d24a9(v_1badb6, v_556427, v_84c1d5): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, avatar_url, created_at)
       VALUES (?, ?, 'CT', ?, 'friend', 'public', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_556427, v_4a1fb4(v_84c1d5))
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_3abc49(v_389afb, v_b24339): Promise<{ row: boolean; object: boolean }> {
  const v_3ac7e7 = await v_a1651b().prepare("SELECT id FROM files WHERE id = ?").bind(v_389afb).first();
  const v_8839e3 = await v_06ba1d().head(v_b24339);
  return { row: v_3ac7e7 !== null, object: v_8839e3 !== null };
}

function v_55fc7c(v_21cc31): Promise<Response> {
  return v_1df298.fetch("http://localhost/oth-path", { method: "DELETE", headers: { Authorization: `Bearer ${v_21cc31}` } });
}

v_469bf2("계정 탈퇴 — AI 파일 Hard Delete 점검", () => {
  v_23805a("생성 작업 기록이 붙잡은 파일도 R2·files 행 모두 지워진다", async () => {
    const v_257b90 = await v_bfb240("acctpurge-a@test.local");
    const v_2a5a61 = await v_c808bd(v_257b90, "uploadedfiles/acctpurge-a-photo.jpg");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "acctpurge_a", v_2a5a61);
    await v_a1651b()
      .prepare(`INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id) VALUES (?,?,'idle_video',?,'done',?)`)
      .bind("acctpurge-a-job", v_257b90, v_2a5a61, v_6e0fd3)
      .run();

    v_4d37e3((await v_55fc7c(await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_3abc49(v_2a5a61, "uploadedfiles/acctpurge-a-photo.jpg")).toEqual({ row: false, object: false });
  });

  v_23805a("공동관리자에게 넘어간 클론의 파일은 남는다", async () => {
    const v_257b90 = await v_bfb240("acctpurge-b@test.local");
    const v_583293 = await v_bfb240("acctpurge-b-co@test.local");
    const v_2a5a61 = await v_c808bd(v_257b90, "uploadedfiles/acctpurge-b-photo.jpg");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "acctpurge_b", v_2a5a61);
    await v_a1651b()
      .prepare(`INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')`)
      .bind(v_6e0fd3, v_257b90, v_583293)
      .run();

    v_4d37e3((await v_55fc7c(await v_38cec9(v_257b90))).status).toBe(200);
    const v_eb25ce = await v_a1651b().prepare("SELECT owner_id FROM clones WHERE id = ?").bind(v_6e0fd3).first<{ owner_id: number }>();
    v_4d37e3(v_eb25ce?.owner_id).toBe(v_583293);
    v_4d37e3(await v_3abc49(v_2a5a61, "uploadedfiles/acctpurge-b-photo.jpg")).toEqual({ row: true, object: true });
  });

  v_23805a("클론에 연결 전 멈춘 작업 기록이 붙잡은 파일도 행까지 지워지고, 다른 파일 삭제를 막지 않는다", async () => {
    const v_257b90 = await v_bfb240("acctpurge-c@test.local");
    const v_4592ba = await v_c808bd(v_257b90, "uploadedfiles/acctpurge-c-orphan.jpg");
    const v_a9cbf1 = await v_c808bd(v_257b90, "uploadedfiles/acctpurge-c-other.jpg");
    await v_a1651b()
      .prepare(`INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id) VALUES (?,?,'idle_video',?,'failed',NULL)`)
      .bind("acctpurge-c-job", v_257b90, v_4592ba)
      .run();

    v_4d37e3((await v_55fc7c(await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_3abc49(v_4592ba, "uploadedfiles/acctpurge-c-orphan.jpg")).toEqual({ row: false, object: false });
    v_4d37e3(await v_3abc49(v_a9cbf1, "uploadedfiles/acctpurge-c-other.jpg")).toEqual({ row: false, object: false });
  });

  v_23805a("다른 사람 프로필 사진이 같은 파일이면 남긴다", async () => {
    const v_257b90 = await v_bfb240("acctpurge-d@test.local");
    const v_cfd22c = await v_bfb240("acctpurge-d-friend@test.local");
    const v_2a5a61 = await v_c808bd(v_257b90, "uploadedfiles/acctpurge-d-photo.jpg");
    await v_a1651b().prepare("UPDATE users SET avatar_url = ? WHERE id = ?").bind(v_4a1fb4(v_2a5a61), v_cfd22c).run();

    v_4d37e3((await v_55fc7c(await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_3abc49(v_2a5a61, "uploadedfiles/acctpurge-d-photo.jpg")).toEqual({ row: true, object: true });
  });

  v_23805a("탈퇴자 본인 프로필 사진은 지운다", async () => {
    const v_257b90 = await v_bfb240("acctpurge-e@test.local");
    const v_2a5a61 = await v_c808bd(v_257b90, "uploadedfiles/acctpurge-e-profile.jpg");
    await v_a1651b().prepare("UPDATE users SET avatar_url = ? WHERE id = ?").bind(v_4a1fb4(v_2a5a61), v_257b90).run();

    v_4d37e3((await v_55fc7c(await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_3abc49(v_2a5a61, "uploadedfiles/acctpurge-e-profile.jpg")).toEqual({ row: false, object: false });
  });
});

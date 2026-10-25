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

async function v_4d24a9(
  v_1badb6,
  v_556427,
  v_6c1676 = {},
): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, avatar_url, filler_video_urls, created_at)
       VALUES (?, ?, 'CT', ?, 'friend', 'public', ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_556427, v_6c1676.avatar ?? null, v_6c1676.filler ? JSON.stringify(v_6c1676.filler) : null)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_097362(v_389afb, v_b24339): Promise<boolean> {
  const v_3ac7e7 = await v_a1651b().prepare("SELECT id FROM files WHERE id = ?").bind(v_389afb).first();
  const v_8839e3 = await v_06ba1d().head(v_b24339);
  return v_3ac7e7 === null && v_8839e3 === null;
}

async function v_df2a0c(v_389afb, v_b24339): Promise<boolean> {
  const v_3ac7e7 = await v_a1651b().prepare("SELECT id FROM files WHERE id = ?").bind(v_389afb).first();
  const v_8839e3 = await v_06ba1d().head(v_b24339);
  return v_3ac7e7 !== null && v_8839e3 !== null;
}

function v_d0ca5b(v_6e0fd3, v_21cc31): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${v_21cc31}` },
  });
}

v_469bf2("클론 삭제 — /oth-path 원본 실제 삭제", () => {
  v_23805a("아바타(단일 컬럼)와 필러 영상(JSON 배열)의 파일이 R2_ARCHIVE·files 에서 사라진다", async () => {
    const v_257b90 = await v_bfb240("purge-a@test.local");
    const v_0a6316 = await v_c808bd(v_257b90, "uploadedfiles/purge-a-avatar.jpg");
    const v_a007bf = await v_c808bd(v_257b90, "uploadedfiles/purge-a-filler.mp4");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "purge_a", { avatar: v_4a1fb4(v_0a6316), filler: [v_4a1fb4(v_a007bf)] });

    v_4d37e3((await v_d0ca5b(v_6e0fd3, await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_097362(v_0a6316, "uploadedfiles/purge-a-avatar.jpg")).toBe(true);
    v_4d37e3(await v_097362(v_a007bf, "uploadedfiles/purge-a-filler.mp4")).toBe(true);
  });

  v_23805a("다른 살아있는 클론이 같은 파일을 쓰면 지우지 않는다", async () => {
    const v_257b90 = await v_bfb240("purge-b@test.local");
    const v_b1c995 = await v_c808bd(v_257b90, "uploadedfiles/purge-b-shared.jpg");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "purge_b1", { avatar: v_4a1fb4(v_b1c995) });
    await v_4d24a9(v_257b90, "purge_b2", { filler: [v_4a1fb4(v_b1c995)] });

    v_4d37e3((await v_d0ca5b(v_6e0fd3, await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_df2a0c(v_b1c995, "uploadedfiles/purge-b-shared.jpg")).toBe(true);
  });

  v_23805a("프로필 사진(users.avatar_url)이 같은 파일이면 지우지 않는다", async () => {
    const v_257b90 = await v_bfb240("purge-c@test.local");
    const v_b1c995 = await v_c808bd(v_257b90, "uploadedfiles/purge-c-profile.jpg");
    await v_a1651b().prepare("UPDATE users SET avatar_url = ? WHERE id = ?").bind(v_4a1fb4(v_b1c995), v_257b90).run();
    const v_6e0fd3 = await v_4d24a9(v_257b90, "purge_c", { avatar: v_4a1fb4(v_b1c995) });

    v_4d37e3((await v_d0ca5b(v_6e0fd3, await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_df2a0c(v_b1c995, "uploadedfiles/purge-c-profile.jpg")).toBe(true);
  });

  v_23805a("번호 앞자리가 같은 다른 파일(/oth-path 과 /oth-path)을 혼동하지 않는다", async () => {
    const v_257b90 = await v_bfb240("purge-d@test.local");
    const v_1c1268 = await v_c808bd(v_257b90, "uploadedfiles/purge-d-mine.jpg");

    const v_6e0fd3 = await v_4d24a9(v_257b90, "purge_d1", { avatar: v_4a1fb4(v_1c1268) });
    await v_4d24a9(v_257b90, "purge_d2", { avatar: `${v_4a1fb4(v_1c1268)}0` });

    v_4d37e3((await v_d0ca5b(v_6e0fd3, await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_097362(v_1c1268, "uploadedfiles/purge-d-mine.jpg")).toBe(true);
  });

  v_23805a("생성 작업 기록(clone_asset_jobs)이 붙잡은 원본·중간 결과물도 지우고, 이 클론의 작업 기록을 정리한다", async () => {
    const v_257b90 = await v_bfb240("purge-e@test.local");
    const v_2a5a61 = await v_c808bd(v_257b90, "uploadedfiles/purge-e-photo.jpg");
    const v_89ebdc = await v_c808bd(v_257b90, "assets/idle_video/purge-e-mid.mp4");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "purge_e", { avatar: v_4a1fb4(v_2a5a61) });
    await v_a1651b()
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, out_file_id, status, clone_id) VALUES (?,?,'idle_video',?,?,'done',?)`,
      )
      .bind("purge-e-job", v_257b90, v_2a5a61, v_89ebdc, v_6e0fd3)
      .run();

    v_4d37e3((await v_d0ca5b(v_6e0fd3, await v_38cec9(v_257b90))).status).toBe(200);

    v_4d37e3(await v_097362(v_2a5a61, "uploadedfiles/purge-e-photo.jpg")).toBe(true);

    v_4d37e3(await v_097362(v_89ebdc, "assets/idle_video/purge-e-mid.mp4")).toBe(true);
    const v_e3d2a2 = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id = ?").bind(v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_e3d2a2?.n).toBe(0);
  });

  v_23805a("다른 클론(또는 아직 연결 전) 작업 기록이 같은 원본을 쓰면 지우지 않는다", async () => {
    const v_257b90 = await v_bfb240("purge-f@test.local");
    const v_2a5a61 = await v_c808bd(v_257b90, "uploadedfiles/purge-f-photo.jpg");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "purge_f", { avatar: v_4a1fb4(v_2a5a61) });
    await v_a1651b()
      .prepare(`INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id) VALUES (?,?,'idle_video',?,'running',NULL)`)
      .bind("purge-f-pending", v_257b90, v_2a5a61)
      .run();

    v_4d37e3((await v_d0ca5b(v_6e0fd3, await v_38cec9(v_257b90))).status).toBe(200);
    v_4d37e3(await v_df2a0c(v_2a5a61, "uploadedfiles/purge-f-photo.jpg")).toBe(true);
  });
});

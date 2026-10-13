
import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_7169b4 = () => (v_c9c489 as { ORCH_SECRET?: string }).ORCH_SECRET ?? "test-orch-secret";

async function v_bdb39e(v_94302c, v_a2935a, v_bd1444) {
  const v_ceb55a = await v_a1651b()
    .prepare(`INSERT INTO users (email,password_hash,name,created_at) VALUES (?,'x','U',CURRENT_TIMESTAMP) RETURNING id`)
    .bind(`pb_${v_bd1444}@test.com`)
    .first<{ id: number }>();
  const v_8b5cd8 = await v_a1651b()
    .prepare(`INSERT INTO files (r2_key,content_type,size_bytes,owner_user_id,purpose) VALUES (?,'audio/wav',1,?,'x') RETURNING id`)
    .bind(`uploadedfiles/pb-${v_bd1444}.wav`, v_ceb55a!.id)
    .first<{ id: number }>();
  let v_6e0fd3 = null;
  if (v_a2935a) {
    const v_3f4e2e = await v_a1651b()
      .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'C', ?, 'friend', 'public', CURRENT_TIMESTAMP) RETURNING id`)
      .bind(v_ceb55a!.id, `pb_${v_bd1444}`)
      .first<{ id: number }>();
    v_6e0fd3 = v_3f4e2e!.id;
  }
  const v_04211c = `pbjob-${v_bd1444}`;
  await v_a1651b()
    .prepare(`INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, clone_id, status, callback_token) VALUES (?,?,?,?,?,'pending','tok')`)
    .bind(v_04211c, v_ceb55a!.id, v_94302c, v_8b5cd8!.id, v_6e0fd3)
    .run();
  return { jobId: v_04211c, srcFileId: v_8b5cd8!.id, cloneId: v_6e0fd3 };
}

async function v_79f36b(v_04211c) {
  const v_23563e = new FormData();
  v_23563e.append("job_id", v_04211c);
  v_23563e.append("status", "done");
  v_23563e.append("callback_token", "tok");
  v_23563e.append("file", new Blob([new Uint8Array([1, 2, 3])]), "x.bin");
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_7169b4()}` },
    body: v_23563e,
  });
}

let v_20e160 = [];
v_ba7107(() => {
  v_8fd90d
    .get("http://prethird.test")
    .intercept({ path: "/prethird/prebuild", method: "POST" })
    .reply(200, (v_328259) => {
      v_20e160.push(String(v_328259.body));
      return "{}";
    })
    .persist();
});

v_469bf2("asset-job-done -> prebuild 트리거 (AFL-1017)", () => {
  v_23805a("voice_clone + clone_id -> /prethird/prebuild POST (cloneId, 원본 voiceRawUrl)", async () => {
    v_20e160 = [];
    const { jobId: v_04211c, srcFileId: v_2fa661, cloneId: v_6e0fd3 } = await v_bdb39e("voice_clone", true, "a");
    const v_8f00b9 = await v_79f36b(v_04211c);
    v_4d37e3(v_8f00b9.status).toBe(200);
    for (let v_ebec57 = 0; v_ebec57 < 40 && v_20e160.length === 0; v_ebec57++) await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 50));
    v_4d37e3(v_20e160).toHaveLength(1);
    const v_4d33b2 = JSON.parse(v_20e160[0]);
    v_4d37e3(v_4d33b2.cloneId).toBe(String(v_6e0fd3));
    v_4d37e3(v_4d33b2.voiceRawUrl).toBe(`http://localhost/oth-path${v_2fa661}`);
  });

  v_23805a("clone_id 없음 -> 트리거 안 함", async () => {
    v_20e160 = [];
    const { jobId: v_04211c } = await v_bdb39e("voice_clone", false, "b");
    const v_8f00b9 = await v_79f36b(v_04211c);
    v_4d37e3(v_8f00b9.status).toBe(200);
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 300));
    v_4d37e3(v_20e160).toHaveLength(0);
  });

  v_23805a("idle_video -> prebuild 트리거 안 함", async () => {
    v_20e160 = [];
    const { jobId: v_04211c } = await v_bdb39e("idle_video", true, "c");
    const v_8f00b9 = await v_79f36b(v_04211c);
    v_4d37e3(v_8f00b9.status).toBe(200);
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 300));
    v_4d37e3(v_20e160).toHaveLength(0);
  });
});

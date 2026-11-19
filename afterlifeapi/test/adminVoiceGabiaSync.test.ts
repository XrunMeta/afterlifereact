import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_3889c0, v_719203 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

function v_1c37f9(v_d308b5, v_4d33b2): Response {
  const v_9b6134 = typeof v_4d33b2 === "string" ? v_4d33b2 : JSON.stringify(v_4d33b2);
  return {
    ok: v_d308b5 >= 200 && v_d308b5 < 300,
    status: v_d308b5,
    text: async () => v_9b6134,
    json: async () => (typeof v_4d33b2 === "string" ? JSON.parse(v_4d33b2) : v_4d33b2),
  } as unknown as Response;
}
function v_f09518() {
  return v_3889c0.spyOn(globalThis, "fetch").mockResolvedValue(
    v_1c37f9(200, { ok: true, path: "/root/ref_voices/preset-x/voice.wav", bytes: 1234 }),
  );
}
function v_7231e8(v_d308b5 = 500, v_5e9bfe = "ffmpeg failed: boom") {
  return v_3889c0.spyOn(globalThis, "fetch").mockResolvedValue(v_1c37f9(v_d308b5, { error: v_5e9bfe }));
}

const v_d72b33 = 9050;

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}
async function v_dca3c3(): Promise<string> {
  return v_b2eae5({ sub: v_d72b33, kind: "access", admin: true });
}

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

function v_5f27eb(): { VOICE_PRESET_SYNC_REQUIRED?: string; LEARN_SECRET?: string; CALL_PRETHIRD_BASE?: string } {
  return v_c9c489 as unknown as { VOICE_PRESET_SYNC_REQUIRED?: string; LEARN_SECRET?: string; CALL_PRETHIRD_BASE?: string };
}

v_ba7107(async () => {
  await v_a1651b()
    .prepare(
      `INSERT OR REPLACE INTO admin_users (id, email, password_hash, role, is_active)
       VALUES (?, ?, 'x', 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-vg@afterlife.test")
    .run();

  v_5f27eb().CALL_PRETHIRD_BASE = "https://rtc.example.invalid/prethird";
  v_5f27eb().LEARN_SECRET = "test-learn-secret";
});

const v_22aec7 = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 1, 2, 3]); 

async function v_e76697(v_b24339 = "voice/sample/task3.wav"): Promise<string> {
  const v_dc53ea = (v_c9c489 as unknown as { R2_ARCHIVE: R2Bucket }).R2_ARCHIVE;
  await v_dc53ea.put(v_b24339, v_22aec7, { httpMetadata: { contentType: "audio/wav" } });
  return v_b24339;
}

v_719203(() => {
  v_3889c0.restoreAllMocks();
});

async function v_3c1e1d(v_4d33b2): Promise<Response> {
  const v_21cc31 = await v_dca3c3();
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

v_469bf2("POST /oth-path — 가비아 동기화", () => {
  v_23805a("r2_key 없으면 422", async () => {
    const v_8f00b9 = await v_3c1e1d({ name: "발랄한" });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("r2_key 가 voice/ prefix 아니면 422", async () => {
    const v_8f00b9 = await v_3c1e1d({ name: "발랄한", r2_key: "wrong/path.wav" });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("R2 에 파일 없으면 404", async () => {
    v_f09518();
    const v_8f00b9 = await v_3c1e1d({ name: "발랄한", r2_key: "voice/sample/does-not-exist.wav" });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("가비아 200 성공 시 D1 insert + seKey 자동 발급 + syncedToGabia:true", async () => {
    const v_0037e3 = await v_e76697("voice/sample/ok1.wav");
    const v_980ff2 = v_f09518();
    const v_8f00b9 = await v_3c1e1d({ name: "발랄한 (ok)", r2_key: v_0037e3 });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = await v_8f00b9.json<{ id: number; seKey: string; syncedToGabia: boolean }>();
    v_4d37e3(v_4d33b2.seKey).toMatch(/^preset-/);
    v_4d37e3(v_4d33b2.syncedToGabia).toBe(true);
    v_4d37e3(v_980ff2).toHaveBeenCalledTimes(1);
    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT se_key, r2_key, name FROM voice_presets WHERE id = ?")
      .bind(v_4d33b2.id)
      .first<{ se_key: string; r2_key: string; name: string }>();
    v_4d37e3(v_3ac7e7!.se_key).toBe(v_4d33b2.seKey);
    v_4d37e3(v_3ac7e7!.r2_key).toBe(v_0037e3);
    v_4d37e3(v_3ac7e7!.name).toBe("발랄한 (ok)");
  });

  v_23805a("입력 body 의 se_key 는 무시되고 서버가 생성", async () => {
    const v_0037e3 = await v_e76697("voice/sample/ok2.wav");
    v_f09518();
    const v_8f00b9 = await v_3c1e1d({
      name: "발랄한 (ignore)",
      r2_key: v_0037e3,
      se_key: "hacker-supplied",
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = await v_8f00b9.json<{ seKey: string }>();
    v_4d37e3(v_4d33b2.seKey).not.toBe("hacker-supplied");
    v_4d37e3(v_4d33b2.seKey).toMatch(/^preset-/);
  });

  v_23805a("SYNC_REQUIRED 미설정(기본 off) + 가비아 실패 → 201 + syncedToGabia:false + syncWarning", async () => {
    const v_0037e3 = await v_e76697("voice/sample/fail2.wav");
    v_7231e8(500, "ffmpeg failed: fallback test");
    const v_8f00b9 = await v_3c1e1d({ name: "발랄한 (fail2)", r2_key: v_0037e3 });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = await v_8f00b9.json<{ syncedToGabia: boolean; syncWarning?: string; id: number }>();
    v_4d37e3(v_4d33b2.syncedToGabia).toBe(false);
    v_4d37e3(v_4d33b2.syncWarning).toContain("ffmpeg");

    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT id FROM voice_presets WHERE id = ?")
      .bind(v_4d33b2.id)
      .first<{ id: number }>();
    v_4d37e3(v_3ac7e7!.id).toBe(v_4d33b2.id);
  });
});

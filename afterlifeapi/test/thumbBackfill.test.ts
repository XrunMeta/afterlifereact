import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_b96973 = () => (v_c9c489 as unknown as { R2_ARCHIVE: R2Bucket }).R2_ARCHIVE;
const v_68f0aa = () => ({ Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}` });

const v_c706fd = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="),
  (v_10a17d) => v_10a17d.charCodeAt(0),
);

async function v_bfb240(): Promise<number> {
  const v_ceb55a = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(`tbf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`)
    .run();
  return Number(v_ceb55a.meta.last_row_id);
}

async function v_c808bd(v_fbb6da, v_c0c2d5, v_40a923): Promise<number> {
  const v_0c8987 = await v_bfb240();
  const v_b24339 = `uploadedfiles/${v_0c8987}/tbf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${v_40a923}`;
  await v_b96973().put(v_b24339, v_fbb6da);
  const v_05b441 = typeof v_fbb6da === "string" ? v_fbb6da.length : v_fbb6da.byteLength;
  const v_3ac7e7 = await v_a1651b()
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?, ?, ?, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_c0c2d5, v_05b441, v_0c8987)
    .first<{ id: number }>();
  return v_3ac7e7!.id;
}

const v_19b3ec = async (v_389afb) =>
  (await v_a1651b().prepare(`SELECT thumb_r2_key FROM files WHERE id = ?`).bind(v_389afb).first<{ thumb_r2_key: string | null }>())!
    .thumb_r2_key;

const v_d1bf04 = (v_4d33b2, v_3f4675 = v_68f0aa()) =>
  v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { ...v_3f4675, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });

type BackfillOut = {
  processed: number;
  made: number;
  failed: { id: number; reason: string }[];
  lastId: number;
  remaining: number;
};

v_469bf2("POST /oth-path", () => {
  v_23805a("ORCH_SECRET 없으면 401", async () => {
    const v_8f00b9 = await v_d1bf04({ limit: 1 }, {});
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("썸네일 없는 이미지에 WebP 썸네일을 만들고 thumb_r2_key 를 채운다", async () => {
    const v_389afb = await v_c808bd(v_c706fd, "image/png", "png");
    const v_8f00b9 = await v_d1bf04({ limit: 10, afterId: v_389afb - 1 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_8d4337 = (await v_8f00b9.json()) as BackfillOut;
    v_4d37e3(v_8d4337.made).toBeGreaterThanOrEqual(1);
    v_4d37e3(v_8d4337.failed.find((v_8b5cd8) => v_8b5cd8.id === v_389afb)).toBeUndefined();

    const v_b24339 = await v_19b3ec(v_389afb);
    v_4d37e3(v_b24339).toMatch(/^uploadedfiles-thumb\/.+\.webp$/);
    const v_8839e3 = await v_b96973().get(v_b24339!);
    v_4d37e3(v_8839e3).not.toBeNull();
    v_4d37e3(v_8839e3!.httpMetadata?.contentType).toBe("image/webp");

    v_4d37e3((await v_8839e3!.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  v_23805a("깨진 이미지는 failed 로 보고하고 다음 파일로 넘어간다 (lastId 전진)", async () => {
    const v_0af197 = await v_c808bd("NOT-AN-IMAGE", "image/jpeg", "jpg");
    const v_56bffe = await v_c808bd(v_c706fd, "image/png", "png");
    const v_8d4337 = (await (await v_d1bf04({ limit: 10, afterId: v_0af197 - 1 })).json()) as BackfillOut;
    v_4d37e3(v_8d4337.failed).toContainEqual({ id: v_0af197, reason: "encode_failed" });
    v_4d37e3(await v_19b3ec(v_0af197)).toBeNull();
    v_4d37e3(await v_19b3ec(v_56bffe)).not.toBeNull();
    v_4d37e3(v_8d4337.lastId).toBeGreaterThanOrEqual(v_56bffe);
  });

  v_23805a("이미 썸네일 있는 파일·이미지 아닌 파일은 건너뛴다", async () => {
    const v_2fb8cc = await v_c808bd(v_c706fd, "image/png", "png");
    await v_a1651b().prepare(`UPDATE files SET thumb_r2_key = 'uploadedfiles-thumb/x/already.webp' WHERE id = ?`).bind(v_2fb8cc).run();
    const v_ff0300 = await v_c808bd("RIFF", "audio/wav", "wav");
    const v_8d4337 = (await (await v_d1bf04({ limit: 10, afterId: v_2fb8cc - 1 })).json()) as BackfillOut;
    v_4d37e3(await v_19b3ec(v_2fb8cc)).toBe("uploadedfiles-thumb/x/already.webp");
    v_4d37e3(await v_19b3ec(v_ff0300)).toBeNull();
    v_4d37e3(v_8d4337.failed.find((v_8b5cd8) => v_8b5cd8.id === v_2fb8cc || v_8b5cd8.id === v_ff0300)).toBeUndefined();
  });

  v_23805a("limit 만큼만 처리하고 remaining 으로 남은 수를 알려준다", async () => {
    const v_779914 = await v_c808bd(v_c706fd, "image/png", "png");
    await v_c808bd(v_c706fd, "image/png", "png");
    const v_8d4337 = (await (await v_d1bf04({ limit: 1, afterId: v_779914 - 1 })).json()) as BackfillOut;
    v_4d37e3(v_8d4337.processed).toBe(1);
    v_4d37e3(v_8d4337.lastId).toBe(v_779914);
    v_4d37e3(v_8d4337.remaining).toBeGreaterThanOrEqual(1);
  });
});

v_469bf2("GET /oth-path?thumb=1 폴백 캐시", () => {
  v_23805a("썸네일 없어 원본으로 대신 보낸 응답은 캐시하지 않고, 백필 뒤 바로 썸네일이 나간다", async () => {
    const v_389afb = await v_c808bd(v_c706fd, "image/png", "png");
    for (let v_ebec57 = 0; v_ebec57 < 2; v_ebec57++) {
      const v_cb35cb = await v_1df298.fetch(`https://x/oth-path${v_389afb}?thumb=1`);
      v_4d37e3(v_cb35cb.status).toBe(200);
      v_4d37e3(v_cb35cb.headers.get("X-Thumb")).toBe("fallback");
      v_4d37e3(v_cb35cb.headers.get("X-Edge-Cache")).toBe("miss");
      v_4d37e3(v_cb35cb.headers.get("Cache-Control")).toBe("public, max-age=300");
      await v_cb35cb.arrayBuffer();
    }

    await (await v_d1bf04({ limit: 10, afterId: v_389afb - 1 })).arrayBuffer();

    const v_33efc5 = await v_1df298.fetch(`https://x/oth-path${v_389afb}?thumb=1`);
    v_4d37e3(v_33efc5.headers.get("X-Thumb")).toBe("hit");
    v_4d37e3(v_33efc5.headers.get("Content-Type")).toBe("image/webp");
    await v_33efc5.arrayBuffer();
    const v_826279 = await v_1df298.fetch(`https://x/oth-path${v_389afb}?thumb=1`);
    v_4d37e3(v_826279.headers.get("X-Edge-Cache")).toBe("hit");
    v_4d37e3(v_826279.headers.get("Content-Type")).toBe("image/webp");
    await v_826279.arrayBuffer();
  });
});

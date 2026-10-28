import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_b96973 = () => (v_c9c489 as unknown as { R2_ARCHIVE: R2Bucket }).R2_ARCHIVE;

async function v_c808bd(v_fbb6da): Promise<number> {
  const v_b24339 = `test/edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  await v_b96973().put(v_b24339, v_fbb6da);
  const v_ceb55a = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(`fec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`)
    .run();
  const v_3ac7e7 = await v_a1651b()
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?, 'image/jpeg', ?, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_fbb6da.length, v_ceb55a.meta.last_row_id)
    .first<{ id: number }>();
  return v_3ac7e7!.id;
}

v_469bf2("GET /oth-path 엣지 캐시", () => {
  v_23805a("첫 요청 miss, 두 번째 hit — 본문·Content-Type 같음", async () => {
    const v_389afb = await v_c808bd("JPEGDATA-1");
    const v_2d1eeb = await v_1df298.fetch(`https://x/oth-path${v_389afb}`);
    v_4d37e3(v_2d1eeb.status).toBe(200);
    v_4d37e3(v_2d1eeb.headers.get("X-Edge-Cache")).toBe("miss");
    v_4d37e3(await v_2d1eeb.text()).toBe("JPEGDATA-1");

    const v_cdf333 = await v_1df298.fetch(`https://x/oth-path${v_389afb}`);
    v_4d37e3(v_cdf333.status).toBe(200);
    v_4d37e3(v_cdf333.headers.get("X-Edge-Cache")).toBe("hit");
    v_4d37e3(v_cdf333.headers.get("Content-Type")).toBe("image/jpeg");
    v_4d37e3(await v_cdf333.text()).toBe("JPEGDATA-1");
  });

  v_23805a("없는 파일은 캐시하지 않는다(404 유지)", async () => {
    for (let v_ebec57 = 0; v_ebec57 < 2; v_ebec57++) {
      const v_cb35cb = await v_1df298.fetch(`https://x/oth-path`);
      v_4d37e3(v_cb35cb.status).toBe(404);
      v_4d37e3(v_cb35cb.headers.get("X-Edge-Cache")).toBeNull();
    }
  });
});

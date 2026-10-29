

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d, v_719203 } from "xualxe";
import { v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";
import { v_a298e2, v_a43ce1 } from "../src/lib/xrunAccountFace";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_9542f7 = v_c9c489 as unknown as Parameters<typeof v_a298e2>[0];
const v_cafb6f = new URL((v_c9c489 as unknown as { XRUN_API_URL: string }).XRUN_API_URL).origin;

function v_80cae9(v_bdb39e): number[] {
  const v_81e2ef = new Array(512).fill(0).map((v_37eab7, v_ebec57) => Math.sin(v_bdb39e * 31 + v_ebec57));
  const v_f4e98d = Math.sqrt(v_81e2ef.reduce((v_fd5f43, v_62c214) => v_fd5f43 + v_62c214 * v_62c214, 0));
  return v_81e2ef.map((v_62c214) => v_62c214 / v_f4e98d);
}
const v_4c4400 = (v_81e2ef) => {
  const v_8d1421 = new Uint8Array(new Float32Array(v_81e2ef).buffer);
  let v_fd5f43 = "";
  for (const v_148ff6 of v_8d1421) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43);
};
const v_889aa1 = (v_fd5f43) => {
  const v_d8cac9 = atob(v_fd5f43);
  const v_8d1421 = Uint8Array.from(v_d8cac9, (v_10a17d) => v_10a17d.charCodeAt(0));
  return Array.from(new Float32Array(v_8d1421.buffer));
};

async function v_bfb240(v_e0c7e8, v_660822): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, xrun_member_id) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, ?)`,
    )
    .bind(v_e0c7e8, v_660822)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

function v_84f079(v_9fe22d, v_754331) {
  return v_8fd90d.get(v_cafb6f).intercept({
    path: v_9fe22d,
    method: "POST",
    body: (v_148ff6) => {
      v_754331?.(JSON.parse(v_148ff6));
      return true;
    },
  });
}

v_ff107d(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.deactivate());

v_469bf2("matchXrunAccountFace", () => {
  v_23805a("match + 대표 벡터 → status match · embedding 512 왕복", async () => {
    const v_0c8987 = await v_bfb240("m1@x.test", 2855);
    const v_f10744 = v_80cae9(1);
    let v_f966e3 = null;
    v_84f079("/oth-path", (v_148ff6) => (v_f966e3 = v_148ff6)).reply(200, {
      status: "success",
      data: { enrolled: true, match: true, embedding: v_4c4400(v_f10744) },
    });
    const v_bb280b = [v_80cae9(1), v_80cae9(2)];
    const v_cb35cb = await v_a298e2(v_9542f7, v_0c8987, v_bb280b, { withEmbedding: true });
    v_4d37e3(v_cb35cb.status).toBe("match");
    if (v_cb35cb.status !== "match") return;
    v_4d37e3(v_cb35cb.embedding).toHaveLength(512);
    v_4d37e3(Math.abs(v_cb35cb.embedding![0] - v_f10744[0])).toBeLessThan(1e-6);
    v_4d37e3(v_f966e3.member).toBe(2855);
    v_4d37e3(v_f966e3.withEmbedding).toBe(true);
    v_4d37e3(v_f966e3.vectors).toHaveLength(2);
    const v_56e16d = v_889aa1(v_f966e3.vectors[1]);
    v_4d37e3(Math.abs(v_56e16d[5] - v_bb280b[1][5])).toBeLessThan(1e-6);
  });

  v_23805a("match false → mismatch · enrolled false → none", async () => {
    const v_0c8987 = await v_bfb240("m2@x.test", 2856);
    v_84f079("/oth-path").reply(200, { status: "success", data: { enrolled: true, match: false } });
    v_4d37e3((await v_a298e2(v_9542f7, v_0c8987, [v_80cae9(1)])).status).toBe("mismatch");
    v_84f079("/oth-path").reply(200, { status: "success", data: { enrolled: false, match: false } });
    v_4d37e3((await v_a298e2(v_9542f7, v_0c8987, [v_80cae9(1)])).status).toBe("none");
  });

  v_23805a("500 · 네트워크 오류 · 시간 초과 · 임베딩 길이 이상 → none", async () => {
    const v_0c8987 = await v_bfb240("m3@x.test", 2857);
    v_84f079("/oth-path").reply(500, { status: "error" });
    v_4d37e3((await v_a298e2(v_9542f7, v_0c8987, [v_80cae9(1)])).status).toBe("none");
    v_84f079("/oth-path").replyWithError(new Error("boom"));
    v_4d37e3((await v_a298e2(v_9542f7, v_0c8987, [v_80cae9(1)])).status).toBe("none");
    v_84f079("/oth-path")
      .reply(200, { status: "success", data: { enrolled: true, match: true } })
      .delay(500);
    v_4d37e3((await v_a298e2(v_9542f7, v_0c8987, [v_80cae9(1)], { timeoutMs: 100 })).status).toBe("none");
    v_84f079("/oth-path").reply(200, {
      status: "success",
      data: { enrolled: true, match: true, embedding: v_4c4400(v_80cae9(1).slice(0, 511)) },
    });
    v_4d37e3((await v_a298e2(v_9542f7, v_0c8987, [v_80cae9(1)], { withEmbedding: true })).status).toBe("none");
  });

  v_23805a("xrun_member_id 없음 → xrun 을 부르지 않고 none", async () => {
    const v_0c8987 = await v_bfb240("m4@x.test", null);

    const v_cb35cb = await v_a298e2(v_9542f7, v_0c8987, [v_80cae9(1)]);
    v_4d37e3(v_cb35cb.status).toBe("none");
    v_8fd90d.assertNoPendingInterceptors();
  });
});

v_469bf2("xrunAccountFaceEnrolled", () => {
  v_23805a("faceStatus active → true · 그 외·오류 → false", async () => {
    const v_0c8987 = await v_bfb240("s1@x.test", 2860);
    v_84f079("/oth-path").reply(200, { status: "success", data: { enabled: true, faceStatus: "active" } });
    v_4d37e3(await v_a43ce1(v_9542f7, v_0c8987)).toBe(true);
    v_84f079("/oth-path").reply(200, { status: "success", data: { enabled: true, faceStatus: "none" } });
    v_4d37e3(await v_a43ce1(v_9542f7, v_0c8987)).toBe(false);
    v_84f079("/oth-path").reply(503, { status: "fail" });
    v_4d37e3(await v_a43ce1(v_9542f7, v_0c8987)).toBe(false);
  });
});

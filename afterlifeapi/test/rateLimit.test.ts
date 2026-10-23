

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../src/lib/env";
import { v_353f26 } from "../src/middleware/rateLimit";
import { v_c6eab8 } from "../src/middleware/error";
import { v_b2eae5 } from "../src/lib/jwt";

const v_9542f7 = v_c9c489 as unknown as v_de0a25["Bindings"];

function v_466992(v_dc53ea) {
  const v_779914 = new v_b7c41b<v_de0a25>();
  v_779914.onError(v_c6eab8);
  v_779914.use("*", v_353f26({ anon: 2, user: 4, internal: 3, bucket: v_dc53ea }));
  v_779914.get("/x", (v_3f4e2e) => v_3f4e2e.json({ ok: true }));
  return v_779914;
}

async function v_715950(a: v_b7c41b<v_de0a25>, v_f4e98d, v_3f4675 = {}): Promise<number[]> {
  const v_8d4337 = [];
  for (let v_ebec57 = 0; v_ebec57 < v_f4e98d; v_ebec57++) {
    const v_8f00b9 = await v_779914.request("http://localhost/x", { headers: { "CF-Connecting-IP": "1.2.3.4", ...v_3f4675 } }, v_9542f7);
    v_8d4337.push(v_8f00b9.status);
  }
  return v_8d4337;
}

const v_a0737a = (v_0c8987) => v_b2eae5({ sub: v_0c8987, kind: "access" }, v_9542f7.JWT_ACCESS_SECRET, 600);

v_469bf2("rateLimit 주체 판정", () => {
  v_23805a("토큰 없음은 IP 기준 anon 한도", async () => {
    v_4d37e3(await v_715950(v_466992("t-anon"), 3)).toEqual([200, 200, 429]);
  });

  v_23805a("유효한 access 토큰은 IP 와 상관없이 사용자 한도(같은 IP 의 anon 과 따로 센다)", async () => {
    const v_779914 = v_466992("t-user");
    const v_ea333d = await v_a0737a(501);
    v_4d37e3(await v_715950(v_779914, 5, { Authorization: `Bearer ${v_ea333d}` })).toEqual([200, 200, 200, 200, 429]);

    v_4d37e3(await v_715950(v_779914, 1)).toEqual([200]);
  });

  v_23805a("사용자마다 따로 센다", async () => {
    const v_779914 = v_466992("t-users");
    const v_ece1e8 = await v_a0737a(601);
    const v_a9fa04 = await v_a0737a(602);
    v_4d37e3(await v_715950(v_779914, 4, { Authorization: `Bearer ${v_ece1e8}` })).toEqual([200, 200, 200, 200]);
    v_4d37e3(await v_715950(v_779914, 1, { Authorization: `Bearer ${v_a9fa04}` })).toEqual([200]);
  });

  v_23805a("서명이 틀린 토큰은 anon 으로 센다(위조 토큰으로 주체를 쪼갤 수 없다)", async () => {
    const v_e08ff1 = await v_b2eae5({ sub: 701, kind: "access" }, "wrong-secret-xxxxxxxxxxxxxxxxxxxxxxxx", 600);
    v_4d37e3(await v_715950(v_466992("t-forged"), 3, { Authorization: `Bearer ${v_e08ff1}` })).toEqual([200, 200, 429]);
  });

  v_23805a("refresh 토큰은 사용자 한도가 아니다", async () => {
    const v_1a1b9b = await v_b2eae5({ sub: 801, kind: "refresh" }, v_9542f7.JWT_ACCESS_SECRET, 600);
    v_4d37e3(await v_715950(v_466992("t-refresh"), 3, { Authorization: `Bearer ${v_1a1b9b}` })).toEqual([200, 200, 429]);
  });

  v_23805a("ORCH_SECRET(서버 내부 호출)은 세지 않는다 — 같은 IP 의 anon 몫도 쓰지 않는다", async () => {
    const v_43fd42 = (v_9542f7 as { ORCH_SECRET?: string }).ORCH_SECRET;
    if (!v_43fd42) return; 
    const v_779914 = v_466992("t-internal");
    v_4d37e3(await v_715950(v_779914, 6, { Authorization: `Bearer ${v_43fd42}` })).toEqual([200, 200, 200, 200, 200, 200]);
    v_4d37e3(await v_715950(v_779914, 3)).toEqual([200, 200, 429]);
  });
});

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_ec02d1 = "https://rtc.example.invalid";

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

async function v_121982(): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: 99997, kind: "access", admin: true }, v_43fd42, 600);
}

v_469bf2("admin emotion proxy", () => {
  v_23805a("관리자 토큰 없으면 거부", async () => {
    for (const [v_bfe9b9, v_9fe22d] of [
      ["GET", "/oth-path"],
      ["PUT", "/oth-path"],
      ["GET", "/oth-path"],
      ["GET", "/oth-path"],
      ["POST", "/oth-path"],
    ]) {
      const v_8f00b9 = await v_1df298.fetch(`https://x${v_9fe22d}`, { method: v_bfe9b9 });
      v_4d37e3(v_8f00b9.status, `${v_bfe9b9} ${v_9fe22d}`).toBeGreaterThanOrEqual(401);
      v_4d37e3(v_8f00b9.status).toBeLessThan(500);
    }
  });

  v_23805a("샘플 id 형식이 틀리면 400 (upstream 호출 전)", async () => {
    const v_9edd60 = await v_121982();
    for (const v_0af197 of ["Happy_a", "happy", "happy-ainsley", "a_b_c", "happy_ainsley.wav", "..%2Fx", "happy_a%0A"]) {
      const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_0af197}`, {
        headers: { Authorization: `Bearer ${v_9edd60}` },
      });
      v_4d37e3(v_8f00b9.status, v_0af197).toBe(400);
    }
  });

  v_23805a("PUT 본문이 객체가 아니면 400", async () => {
    const v_9edd60 = await v_121982();
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_9edd60}`, "Content-Type": "application/json" },
      body: "[]",
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  const v_4abc91 = async (v_4d33b2) =>
    v_1df298.fetch("https://x/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${await v_121982()}`, "Content-Type": "application/json" },
      body: JSON.stringify(v_4d33b2),
    });

  v_23805a("PUT 은 updated_by 를 서버가 덮어써서 전달 (클라이언트 값 무시)", async () => {
    let v_f966e3 = "";
    v_8fd90d
      .get(v_ec02d1)
      .intercept({ path: "/prethird/admin/emotion-config", method: "PUT" })
      .reply(200, (v_328259) => {
        v_f966e3 = String(v_328259.body);
        return "{}";
      });
    const v_8f00b9 = await v_4abc91({ voice: { enabled: true }, updated_by: "attacker@evil" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = JSON.parse(v_f966e3);
    v_4d37e3(v_b75e36.voice).toEqual({ enabled: true });
    v_4d37e3(v_b75e36.updated_by).not.toBe("attacker@evil");
    v_4d37e3(v_b75e36.updated_by).toBe("admin:99997"); 
  });

  v_23805a("upstream 401 은 502 로 바꾼다 (관리자 세션 만료로 오인 방지)", async () => {
    v_8fd90d.get(v_ec02d1).intercept({ path: "/prethird/admin/emotion-config", method: "GET" }).reply(401, "{}");
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${await v_121982()}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(502);
    v_4d37e3((await v_8f00b9.json<{ error: string }>()).error).toContain("인증 실패");
  });

  v_23805a("upstream 5xx 는 고정 문구 502, 4xx 는 본문 그대로", async () => {
    const v_9edd60 = await v_121982();
    v_8fd90d.get(v_ec02d1).intercept({ path: "/prethird/admin/emotion-config", method: "GET" }).reply(500, "secret stack trace");
    let v_8f00b9 = await v_1df298.fetch("https://x/oth-path", { headers: { Authorization: `Bearer ${v_9edd60}` } });
    v_4d37e3(v_8f00b9.status).toBe(502);
    v_4d37e3(await v_8f00b9.text()).not.toContain("stack");
    v_8fd90d
      .get(v_ec02d1)
      .intercept({ path: "/prethird/admin/emotion-config", method: "PUT" })
      .reply(409, JSON.stringify({ error: "x", code: "VOICE_UNSET" }));
    v_8f00b9 = await v_4abc91({ video: { mode: "all" } });
    v_4d37e3(v_8f00b9.status).toBe(409);
    v_4d37e3((await v_8f00b9.json<{ code: string }>()).code).toBe("VOICE_UNSET");
  });

  v_23805a("상태 조회는 scope 를 relevant/all 로만 넘긴다", async () => {
    const v_9edd60 = await v_121982();
    v_8fd90d.get(v_ec02d1).intercept({ path: "/prethird/admin/emotion-video/status?scope=all", method: "GET" }).reply(200, '{"clones":[]}');
    let v_8f00b9 = await v_1df298.fetch("https://x/oth-path?scope=all", { headers: { Authorization: `Bearer ${v_9edd60}` } });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_8fd90d.get(v_ec02d1).intercept({ path: "/prethird/admin/emotion-video/status?scope=relevant", method: "GET" }).reply(200, '{"clones":[]}');
    v_8f00b9 = await v_1df298.fetch("https://x/oth-path?scope=../x", { headers: { Authorization: `Bearer ${v_9edd60}` } });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });

  v_23805a("다시 굽기: cloneId 숫자만, 409 는 본문 그대로", async () => {
    const v_9edd60 = await v_121982();
    const v_4f438a = (v_4d33b2) => v_1df298.fetch("https://x/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_9edd60}`, "Content-Type": "application/json" }, body: v_4d33b2,
    });
    for (const v_0af197 of ['{"cloneId":"../1"}', '{"cloneId":"preset-1"}', "[]", "x"]) {
      v_4d37e3((await v_4f438a(v_0af197)).status, v_0af197).toBe(400);
    }
    let v_f966e3 = "";
    v_8fd90d.get(v_ec02d1).intercept({ path: "/prethird/admin/emotion-video/rebake", method: "POST" })
      .reply(409, (v_328259) => { v_f966e3 = String(v_328259.body); return '{"code":"NO_FACE"}'; });
    const v_8f00b9 = await v_4f438a('{"cloneId":9232,"extra":"x"}');
    v_4d37e3(v_8f00b9.status).toBe(409);
    v_4d37e3((await v_8f00b9.json<{ code: string }>()).code).toBe("NO_FACE");
    v_4d37e3(JSON.parse(v_f966e3)).toEqual({ cloneId: "9232" });
  });
});

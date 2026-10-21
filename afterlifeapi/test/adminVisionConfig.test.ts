

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}

const v_121982 = () => v_b2eae5({ sub: 99996, kind: "access", admin: true });
const v_4eca64 = () => v_b2eae5({ sub: 99997, kind: "access" });

async function v_309144(v_bfe9b9, v_21cc31, v_4d33b2): Promise<Response> {
  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_21cc31) v_3f4675.Authorization = `Bearer ${v_21cc31}`;
  return v_1df298.fetch("https://x/oth-path", {
    method: v_bfe9b9,
    headers: v_3f4675,
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

interface VisionBody {
  model: string;
  detail: string;
  models: string[];
}

v_469bf2("admin /config/vision", () => {
  v_ff107d(async () => {
    await v_a1651b().prepare("DELETE FROM app_config WHERE key = 'vision.config'").run();
  });

  v_23805a("미설정이면 기본 gpt-4o-mini · high", async () => {
    const v_8f00b9 = await v_309144("GET", await v_121982());
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<VisionBody>();
    v_4d37e3(v_b75e36.model).toBe("gpt-4o-mini");
    v_4d37e3(v_b75e36.detail).toBe("high");
    v_4d37e3(v_b75e36.models).toEqual(["gpt-4o-mini", "gpt-5.4-mini", "gpt-5-nano", "gpt-6-luna"]);
  });

  v_23805a("깨진 JSON 이어도 500 없이 기본값", async () => {
    await v_a1651b()
      .prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES ('vision.config', '{not json')")
      .run();
    const v_8f00b9 = await v_309144("GET", await v_121982());
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<VisionBody>();
    v_4d37e3(v_b75e36.model).toBe("gpt-4o-mini");
    v_4d37e3(v_b75e36.detail).toBe("high");
  });

  v_23805a("저장된 model 이 목록 밖이면 목록 첫 모델로 방어", async () => {
    await v_a1651b()
      .prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES ('vision.config', ?)")
      .bind(JSON.stringify({ model: "ghost", detail: "low", models: ["a-model", "b-model"] }))
      .run();
    const v_b75e36 = await (await v_309144("GET", await v_121982())).json<VisionBody>();
    v_4d37e3(v_b75e36.model).toBe("a-model");
    v_4d37e3(v_b75e36.detail).toBe("low");
    v_4d37e3(v_b75e36.models).toEqual(["a-model", "b-model"]);
  });

  v_23805a("PATCH — 목록·모델·디테일 저장 후 재조회 왕복", async () => {
    const v_21cc31 = await v_121982();
    const v_4abc91 = await v_309144("PATCH", v_21cc31, {
      models: ["gpt-4o-mini", "other-model"],
      model: "other-model",
      detail: "low",
    });
    v_4d37e3(v_4abc91.status).toBe(200);
    const v_b75e36 = await (await v_309144("GET", v_21cc31)).json<VisionBody>();
    v_4d37e3(v_b75e36).toEqual({ model: "other-model", detail: "low", models: ["gpt-4o-mini", "other-model"] });
  });

  v_23805a("PATCH — 일부 필드만 보내면 나머지는 유지", async () => {
    const v_21cc31 = await v_121982();
    await v_309144("PATCH", v_21cc31, { models: ["gpt-4o-mini", "other-model"], model: "other-model" });
    const v_4abc91 = await v_309144("PATCH", v_21cc31, { detail: "low" });
    v_4d37e3(v_4abc91.status).toBe(200);
    const v_b75e36 = await v_4abc91.json<VisionBody>();
    v_4d37e3(v_b75e36.model).toBe("other-model");
    v_4d37e3(v_b75e36.detail).toBe("low");
  });

  v_23805a("PATCH — 목록 밖 모델은 422", async () => {
    const v_8f00b9 = await v_309144("PATCH", await v_121982(), { model: "not-in-list" });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("PATCH — 현재 모델을 뺀 목록만 보내면 422", async () => {
    const v_8f00b9 = await v_309144("PATCH", await v_121982(), { models: ["other-model"] });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("PATCH — 디테일은 low/high 만", async () => {
    const v_8f00b9 = await v_309144("PATCH", await v_121982(), { detail: "ultra" });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("PATCH — 빈 목록·빈 문자열 모델은 422", async () => {
    const v_21cc31 = await v_121982();
    v_4d37e3((await v_309144("PATCH", v_21cc31, { models: [] })).status).toBe(422);
    v_4d37e3((await v_309144("PATCH", v_21cc31, { models: ["gpt-4o-mini", " "] })).status).toBe(422);
  });

  v_23805a("관리자 아니면 거부", async () => {
    v_4d37e3((await v_309144("GET", null)).status).toBe(401);
    const v_8f00b9 = await v_309144("PATCH", await v_4eca64(), { detail: "low" });
    v_4d37e3([401, 403]).toContain(v_8f00b9.status);
  });
});

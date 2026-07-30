

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}

async function v_121982(): Promise<string> {
  return v_b2eae5({ sub: 99996, kind: "access", admin: true });
}

async function v_309144(
  v_9fe22d,
  v_bfe9b9,
  v_21cc31,
  v_4d33b2,
): Promise<Response> {
  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_21cc31) v_3f4675.Authorization = `Bearer ${v_21cc31}`;
  return v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: v_3f4675,
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

v_469bf2("admin /system/function-config", () => {
  v_23805a("GET — 초기 폴백 (running / 빈 문자열)", async () => {
    const v_21cc31 = await v_121982();
    const v_8f00b9 = await v_309144("/oth-path", "GET", v_21cc31);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{
      serverStatus: string;
      minVersionIos: string;
      minVersionAndroid: string;
    }>();

    v_4d37e3(["running", "maintenance", "stopped"]).toContain(v_4d33b2.serverStatus);
    v_4d37e3(typeof v_4d33b2.minVersionIos).toBe("string");
    v_4d37e3(typeof v_4d33b2.minVersionAndroid).toBe("string");
  });

  v_23805a("PATCH — 유효한 값 저장 & 재조회 왕복", async () => {
    const v_21cc31 = await v_121982();
    const v_4abc91 = await v_309144("/oth-path", "PATCH", v_21cc31, {
      serverStatus: "maintenance",
      minVersionIos: "1.2.3",
      minVersionAndroid: "1.2.4",
    });
    v_4d37e3(v_4abc91.status).toBe(200);
    const v_4d33b2 = await v_4abc91.json<{
      ok: boolean;
      serverStatus: string;
      minVersionIos: string;
      minVersionAndroid: string;
    }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.serverStatus).toBe("maintenance");
    v_4d37e3(v_4d33b2.minVersionIos).toBe("1.2.3");
    v_4d37e3(v_4d33b2.minVersionAndroid).toBe("1.2.4");

    const v_38715b = await v_309144("/oth-path", "GET", v_21cc31);
    const v_206b88 = await v_38715b.json<{ serverStatus: string; minVersionIos: string; minVersionAndroid: string }>();
    v_4d37e3(v_206b88.serverStatus).toBe("maintenance");
    v_4d37e3(v_206b88.minVersionIos).toBe("1.2.3");
    v_4d37e3(v_206b88.minVersionAndroid).toBe("1.2.4");
  });

  v_23805a("PATCH — serverStatus 잘못된 값 422", async () => {
    const v_21cc31 = await v_121982();
    const v_8f00b9 = await v_309144("/oth-path", "PATCH", v_21cc31, {
      serverStatus: "hibernating",
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("PATCH — 잘못된 버전 형식 422", async () => {
    const v_21cc31 = await v_121982();
    const v_8f00b9 = await v_309144("/oth-path", "PATCH", v_21cc31, {
      minVersionIos: "not-a-version",
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("PATCH — 빈 문자열 허용 (제한 해제)", async () => {
    const v_21cc31 = await v_121982();
    const v_8f00b9 = await v_309144("/oth-path", "PATCH", v_21cc31, {
      minVersionIos: "",
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });

  v_23805a("인증 없으면 401", async () => {
    const v_8f00b9 = await v_309144("/oth-path", "GET", null);
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});



import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298 } from "lwkoweqmjbnvjqw";

async function v_a810e2(v_4d33b2) {
  return v_1df298.fetch("https://x/oth-path", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

const v_694b25 = {
  email: "birth-test@example.com",
  password: "Abcdefg1x",
  name: "T10",
  verificationCode: "123456",
};

v_469bf2("가입 생년월일", () => {
  v_23805a("birthDate 가 없으면 422 (스키마 거절)", async () => {
    const v_8f00b9 = await v_a810e2(v_694b25);
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("포맷이 틀리면 422", async () => {
    const v_8f00b9 = await v_a810e2({ ...v_694b25, birthDate: "1990/01/01" });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("존재하지 않는 날짜(2월 30일)는 422", async () => {
    const v_8f00b9 = await v_a810e2({ ...v_694b25, birthDate: "1990-02-30" });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("만 14세 미만이면 UNDER_AGE(422) 로 거절", async () => {

    const v_5c2f9f = new Date();
    const v_64877a = v_5c2f9f.getUTCFullYear() - 13;
    const v_00ad45 = String(v_5c2f9f.getUTCMonth() + 1).padStart(2, "0");

    const v_6fe621 = new Date(Date.UTC(v_5c2f9f.getUTCFullYear(), v_5c2f9f.getUTCMonth(), v_5c2f9f.getUTCDate() + 1));
    const v_697b45 = String(v_6fe621.getUTCDate()).padStart(2, "0");
    const v_0d5dec = String(v_6fe621.getUTCMonth() + 1).padStart(2, "0");
    const v_598ded = `${v_64877a}-${v_0d5dec}-${v_697b45}`;
    const v_8f00b9 = await v_a810e2({ ...v_694b25, birthDate: v_598ded });
    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_7ecfd1 = (await v_8f00b9.json()) as { error?: { code?: string } };
    v_4d37e3(v_7ecfd1.error?.code).toBe("UNDER_AGE");

    v_4d37e3(v_00ad45.length).toBe(2);
  });

  v_23805a("만 14세 이상이면 UNDER_AGE 아님 (다음 단계로 진행 — OTP 검증 단계에서 다른 거절)", async () => {
    const v_5c2f9f = new Date();
    const v_64877a = v_5c2f9f.getUTCFullYear() - 20; 
    const v_8f00b9 = await v_a810e2({ ...v_694b25, birthDate: `${v_64877a}-01-01` });

    const v_7ecfd1 = (await v_8f00b9.json().catch(() => ({}))) as { error?: { code?: string } };
    v_4d37e3(v_7ecfd1.error?.code).not.toBe("UNDER_AGE");
  });
});

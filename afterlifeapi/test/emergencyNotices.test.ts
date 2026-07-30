

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}

async function v_121982(): Promise<string> {
  return v_b2eae5({ sub: 99997, kind: "access", admin: true });
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

async function v_5a747b(): Promise<void> {
  const v_21cc31 = await v_121982();
  const v_8f00b9 = await v_309144("/oth-path", "GET", v_21cc31);
  if (v_8f00b9.status !== 200) return;
  const v_4d33b2 = await v_8f00b9.json<{ items: Array<{ id: number }> }>();
  for (const v_23805a of v_4d33b2.items) {
    await v_309144(`/oth-path${v_23805a.id}`, "DELETE", v_21cc31);
  }
}

v_469bf2("emergency_notices", () => {
  v_23805a("어드민: 목록·생성·수정·삭제 라이프사이클", async () => {
    await v_5a747b();
    const v_21cc31 = await v_121982();

    const v_199c69 = await v_309144("/oth-path", "GET", v_21cc31);
    v_4d37e3(v_199c69.status).toBe(200);
    const v_d6311b = await v_199c69.json<{ items: unknown[] }>();
    v_4d37e3(v_d6311b.items.length).toBe(0);

    const v_28eeb6 = await v_309144("/oth-path", "POST", v_21cc31, {
      title: "긴급 점검 안내",
      description: "23시-01시 서버 점검",
      severity_level: 3,
    });
    v_4d37e3(v_28eeb6.status).toBe(201);
    const { item: v_8c0b26 } = await v_28eeb6.json<{ item: { id: number; title: string; severity_level: number; is_active: number } }>();
    v_4d37e3(typeof v_8c0b26.id).toBe("number");
    v_4d37e3(v_8c0b26.title).toBe("긴급 점검 안내");
    v_4d37e3(v_8c0b26.severity_level).toBe(3);
    v_4d37e3(v_8c0b26.is_active).toBe(1);

    const v_014934 = await v_309144("/oth-path", "GET", v_21cc31);
    const v_177c9d = await v_014934.json<{ items: Array<{ id: number }> }>();
    v_4d37e3(v_177c9d.items.some((v_62c214) => v_62c214.id === v_8c0b26.id)).toBe(true);

    const v_2fb193 = await v_309144(`/oth-path${v_8c0b26.id}`, "PATCH", v_21cc31, {
      is_active: 0,
    });
    v_4d37e3(v_2fb193.status).toBe(200);

    const v_86952f = await v_309144(`/oth-path${v_8c0b26.id}`, "DELETE", v_21cc31);
    v_4d37e3(v_86952f.status).toBe(200);
    const v_31cde4 = await v_309144(`/oth-path${v_8c0b26.id}`, "DELETE", v_21cc31);
    v_4d37e3(v_31cde4.status).toBe(404);
  });

  v_23805a("어드민: 인증 없으면 401", async () => {
    const v_8f00b9 = await v_309144("/oth-path", "GET", null);
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("어드민: severity_level 범위 밖 (5) → 422", async () => {
    const v_21cc31 = await v_121982();
    const v_8f00b9 = await v_309144("/oth-path", "POST", v_21cc31, {
      title: "t",
      severity_level: 5,
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("공개: /oth-path — 활성 중 severity 가장 높은 1건 반환", async () => {
    await v_5a747b();
    const v_21cc31 = await v_121982();

    await v_309144("/oth-path", "POST", v_21cc31, {
      title: "낮은 심각도", severity_level: 1, is_active: 1,
    });
    await v_309144("/oth-path", "POST", v_21cc31, {
      title: "보통 심각도", severity_level: 2, is_active: 1,
    });
    await v_309144("/oth-path", "POST", v_21cc31, {
      title: "높은 심각도", severity_level: 3, is_active: 1,
    });

    const v_8f00b9 = await v_309144("/oth-path", "GET", null);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ notice: { title: string; severity_level: number } | null }>();
    v_4d37e3(v_4d33b2.notice).not.toBeNull();
    v_4d37e3(v_4d33b2.notice!.severity_level).toBe(3);
    v_4d37e3(v_4d33b2.notice!.title).toBe("높은 심각도");
  });

  v_23805a("공개: 활성 없으면 notice=null", async () => {
    await v_5a747b();
    const v_21cc31 = await v_121982();

    await v_309144("/oth-path", "POST", v_21cc31, {
      title: "비활성", severity_level: 2, is_active: 0,
    });
    const v_8f00b9 = await v_309144("/oth-path", "GET", null);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ notice: unknown }>();
    v_4d37e3(v_4d33b2.notice).toBeNull();
  });

  v_23805a("공개: 시간창 만료된 항목은 제외", async () => {
    await v_5a747b();
    const v_21cc31 = await v_121982();

    await v_309144("/oth-path", "POST", v_21cc31, {
      title: "만료됨", severity_level: 4, is_active: 1,
      start_time: 1,
      end_time: 100, 
    });
    const v_8f00b9 = await v_309144("/oth-path", "GET", null);
    const v_4d33b2 = await v_8f00b9.json<{ notice: unknown }>();
    v_4d37e3(v_4d33b2.notice).toBeNull();
  });
});

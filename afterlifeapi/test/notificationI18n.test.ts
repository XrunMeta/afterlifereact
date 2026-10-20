import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_c226a5 } from "../src/lib/notify";
import {
  v_003f11,
  v_e2fd5b,
  v_e54513,
  v_de8979,
  v_6fcc82,
  v_d00fb9,
  v_5cb21e,
  v_18b0cb,
} from "../src/lib/notificationTemplates";
import type { v_273a0c } from "../src/lib/env";

const v_4ff4a9 = "https://console-preview2.example.invalid";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_bd1444, v_6f298b = null): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, locale, created_at) VALUES (?, 'x', 'U', ?, CURRENT_TIMESTAMP)`)
    .bind(`${v_bd1444}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`, v_6f298b)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_1300ee(v_43e90c): Promise<{ title: string; body: string } | null> {
  return v_a1651b()
    .prepare(`SELECT title, body FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1`)
    .bind(v_43e90c)
    .first<{ title: string; body: string }>();
}

function v_b7f2b4(v_9fe22d, v_00cfc6 = {}): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path${v_9fe22d}`, {
    ...v_00cfc6,
    headers: { "Content-Type": "application/json", Origin: v_4ff4a9, ...(v_00cfc6.headers ?? {}) },
  });
}

const v_584d26 = (v_43e90c) =>
  v_c226a5(v_c9c489 as unknown as v_273a0c, {
    userId: v_43e90c,
    type: "user_follow",
    title: "✨ 새 팔로워",
    body: "민지 님이 회원님을 팔로우했어요",
    templateKey: "user.follow",
    vars: { actorName: "민지" },
    skipEmail: true,
  });

v_469bf2("템플릿 렌더링", () => {
  v_23805a("{var} 치환 · 함수 값은 언어별 · 모르는 자리표시자는 그대로 · 값 안의 {} 는 재치환 안 함", () => {
    v_4d37e3(v_003f11("{a} 님 {b}°C {zzz}", { a: "민지", b: 10 }, "ko")).toBe("민지 님 10°C {zzz}");
    v_4d37e3(v_003f11("{who}", { who: v_6fcc82(null) }, "en")).toBe("Someone");
    v_4d37e3(v_003f11("{who}", { who: v_6fcc82(null) }, "ko")).toBe("누군가");
    v_4d37e3(v_003f11("{a}", { a: "{b}", b: "X" }, "ko")).toBe("{b}");
    v_4d37e3(v_e2fd5b("{a} {b} {a} {1x}")).toEqual(["a", "b"]);
  });

  v_23805a("날짜 변수 — ko 는 'YYYY년 M월 D일'(KST), en 은 영어 월 이름", () => {
    const v_d5dda0 = v_de8979("2026-11-19 20:00:00"); 
    v_4d37e3(v_003f11("{d}", { d: v_d5dda0 }, "ko")).toBe("2026년 11월 20일");
    v_4d37e3(v_003f11("{d}", { d: v_d5dda0 }, "en")).toContain("November");
    v_4d37e3(v_003f11("{d}", { d: v_d5dda0 }, "en")).toContain("20");
  });

  v_23805a("normalizeLocale", () => {
    v_4d37e3(v_e54513("en-US")).toBe("en");
    v_4d37e3(v_e54513("zh-Hans")).toBe("zh-CN");
    v_4d37e3(v_e54513("zh-cn")).toBe("zh-CN");
    v_4d37e3(v_e54513("ja")).toBe("ja");
    v_4d37e3(v_e54513("fr")).toBeNull();
    v_4d37e3(v_e54513(3)).toBeNull();
  });

  v_23805a("레지스트리 — 모든 키·언어의 내장 문구가 선언된 변수만 쓴다", () => {
    const v_fa53ec = new Set<string>();
    for (const v_d5dda0 of v_d00fb9) {
      v_4d37e3(v_fa53ec.has(v_d5dda0.key)).toBe(false);
      v_fa53ec.add(v_d5dda0.key);
      const v_999957 = new Set(v_d5dda0.vars.map((v_81e2ef) => v_81e2ef.name));
      for (const v_5254bf of v_5cb21e) {
        const v_8d41d7 = v_d5dda0.defaults[v_5254bf];
        v_4d37e3(v_8d41d7.title && v_8d41d7.body).toBeTruthy();
        for (const v_e2a85c of [...v_e2fd5b(v_8d41d7.title), ...v_e2fd5b(v_8d41d7.body)]) {
          v_4d37e3(v_999957.has(v_e2a85c), `${v_d5dda0.key}/${v_5254bf}: {${v_e2a85c}}`).toBe(true);
        }
      }
    }
  });
});

v_469bf2("PUT /oth-path", () => {
  v_23805a("지원 언어 저장(정규화) · 미지원 422 · 비로그인 401", async () => {
    const v_ceb55a = await v_bfb240("loc");
    const v_4abc91 = async (v_6f298b, v_68f0aa = true) =>
      v_1df298.fetch("https://x/oth-path", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(v_68f0aa ? { Authorization: `Bearer ${await v_21cc31(v_ceb55a)}` } : {}) },
        body: JSON.stringify({ locale: v_6f298b }),
      });

    const v_3ed4c3 = await v_4abc91("en-US");
    v_4d37e3(v_3ed4c3.status).toBe(200);
    v_4d37e3(await v_3ed4c3.json()).toEqual({ ok: true, locale: "en" });
    const v_3ac7e7 = await v_a1651b().prepare(`SELECT locale FROM users WHERE id = ?`).bind(v_ceb55a).first<{ locale: string }>();
    v_4d37e3(v_3ac7e7?.locale).toBe("en");

    v_4d37e3((await v_4abc91("fr")).status).toBe(422);
    v_4d37e3((await v_4abc91("ja", false)).status).toBe(401);
  });
});

v_469bf2("notify() 언어 선택", () => {
  v_23805a("locale 없음 → 넘긴 한국어 그대로", async () => {
    v_18b0cb();
    const v_ceb55a = await v_bfb240("ko", null);
    await v_584d26(v_ceb55a);
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "✨ 새 팔로워", body: "민지 님이 회원님을 팔로우했어요" });
  });

  v_23805a("locale=en, DB 없음 → 내장 영어 번역", async () => {
    v_18b0cb();
    const v_ceb55a = await v_bfb240("en", "en");
    await v_584d26(v_ceb55a);
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "✨ New follower", body: "민지 started following you" });
  });

  v_23805a("templateKey 없거나 모르는 키 → 한국어", async () => {
    const v_ceb55a = await v_bfb240("en2", "en");
    await v_c226a5(v_c9c489 as unknown as v_273a0c, { userId: v_ceb55a, type: "user_follow", title: "T", body: "B", skipEmail: true });
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "T", body: "B" });
    await v_c226a5(v_c9c489 as unknown as v_273a0c, {
      userId: v_ceb55a, type: "user_follow", title: "T2", body: "B2", templateKey: "nope.nope", skipEmail: true,
    });
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "T2", body: "B2" });
  });

  v_23805a("관리자 편집(DB) 이 내장 번역보다 우선 · 초기화하면 내장 번역으로", async () => {
    const v_ceb55a = await v_bfb240("ja", "ja");

    const v_4abc91 = await v_b7f2b4("/oth-path.follow/ja", {
      method: "PUT",
      body: JSON.stringify({ title: "フォロー通知", body: "{actorName}さんにフォローされました!" }),
    });
    v_4d37e3(v_4abc91.status).toBe(200);
    await v_584d26(v_ceb55a);
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "フォロー通知", body: "민지さんにフォローされました!" });

    const v_d0ca5b = await v_b7f2b4("/oth-path.follow/ja", { method: "DELETE" });
    v_4d37e3(v_d0ca5b.status).toBe(200);
    await v_584d26(v_ceb55a);
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "✨ 新しいフォロワー", body: "민지さんがあなたをフォローしました" });
  });

  v_23805a("ko 를 관리자가 편집하면 locale 없는 사용자에게도 적용", async () => {
    const v_ceb55a = await v_bfb240("ko2", null);
    v_4d37e3(
      (await v_b7f2b4("/oth-path.follow/ko", { method: "PUT", body: JSON.stringify({ title: "새 팔로워!", body: "{actorName} 님 팔로우" }) })).status,
    ).toBe(200);
    await v_584d26(v_ceb55a);
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "새 팔로워!", body: "민지 님 팔로우" });
    await v_b7f2b4("/oth-path.follow/ko", { method: "DELETE" });
    await v_584d26(v_ceb55a);
    v_4d37e3(await v_1300ee(v_ceb55a)).toEqual({ title: "✨ 새 팔로워", body: "민지 님이 회원님을 팔로우했어요" });
  });
});

v_469bf2("admin /oth-path", () => {
  v_23805a("GET — 레지스트리 + 언어별 값 + override 여부", async () => {
    await v_b7f2b4("/clone.like/en", { method: "PUT", body: JSON.stringify({ title: "Like!", body: "{actorName} ♥ {cloneName}" }) });
    const v_8f00b9 = await v_b7f2b4("");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{
      langs: string[];
      templates: Array<{ key: string; vars: Array<{ name: string }>; values: Record<string, { title: string; overridden: boolean; defaultTitle: string }> }>;
    }>();
    v_4d37e3(v_b75e36.langs).toEqual(["ko", "en", "ja", "zh-CN", "id"]);
    const v_2a1d60 = v_b75e36.templates.find((v_8d41d7) => v_8d41d7.key === "clone.like")!;
    v_4d37e3(v_2a1d60.vars.map((v_81e2ef) => v_81e2ef.name)).toEqual(["actorName", "cloneName"]);
    v_4d37e3(v_2a1d60.values.en).toMatchObject({ title: "Like!", overridden: true, defaultTitle: "❤️ New like" });
    v_4d37e3(v_2a1d60.values.ja!.overridden).toBe(false);
    await v_b7f2b4("/clone.like/en", { method: "DELETE" });
  });

  v_23805a("PUT 검증 — 허용 안 된 변수 · 빈 값 · 모르는 키/언어", async () => {
    const v_0af197 = await v_b7f2b4("/oth-path.follow/en", { method: "PUT", body: JSON.stringify({ title: "x", body: "{cloneName} hi" }) });
    v_4d37e3(v_0af197.status).toBe(422);
    v_4d37e3(await v_0af197.text()).toContain("{cloneName}");
    v_4d37e3((await v_b7f2b4("/oth-path.follow/en", { method: "PUT", body: JSON.stringify({ title: "", body: "b" }) })).status).toBe(422);
    v_4d37e3((await v_b7f2b4("/nope.key/en", { method: "PUT", body: JSON.stringify({ title: "t", body: "b" }) })).status).toBe(404);
    v_4d37e3((await v_b7f2b4("/oth-path.follow/fr", { method: "PUT", body: JSON.stringify({ title: "t", body: "b" }) })).status).toBe(422);
  });

  v_23805a("관리자 인증 없으면 거부", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path");
    v_4d37e3([401, 403]).toContain(v_8f00b9.status);
  });
});

v_469bf2("apply-penalty 고정 문장 → 받는 사람 언어", () => {
  v_23805a("account_ban — en 사용자는 영어 + 날짜, 관리자 사유는 그대로", async () => {
    const v_ceb55a = await v_bfb240("pen-en", "en");
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ceb55a}/apply-penalty`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: v_4ff4a9 },
      body: JSON.stringify({ action: "account_ban", suspendDays: 7 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_f4e98d = await v_1300ee(v_ceb55a);
    v_4d37e3(v_f4e98d?.title).toBe("Account restriction notice");
    v_4d37e3(v_f4e98d?.body).toMatch(/^Your account is suspended until [A-Z][a-z]+ \d{1,2}, \d{4}\. \(Accumulated reports\)$/);

    const v_b1ff3f = await v_bfb240("pen-en2", "en");
    await v_1df298.fetch(`http://localhost/oth-path${v_b1ff3f}/apply-penalty`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: v_4ff4a9 },
      body: JSON.stringify({ action: "warn", reason: "운영정책 위반 안내" }),
    });
    v_4d37e3(await v_1300ee(v_b1ff3f)).toEqual({ title: "신고 처리 안내", body: "운영정책 위반 안내" });
  });
});

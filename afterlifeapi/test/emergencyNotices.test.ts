

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function issueToken(extra: Record<string, unknown>): Promise<string> {
  const { issueToken: _issue } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return _issue(extra, secret, 600);
}

async function adminToken(): Promise<string> {
  return issueToken({ sub: 99997, kind: "access", admin: true });
}

async function req(
  path: string,
  method: string,
  token: string | null,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return SELF.fetch(`https://x${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function cleanupAll(): Promise<void> {
  const token = await adminToken();
  const res = await req("/oth-path", "GET", token);
  if (res.status !== 200) return;
  const body = await res.json<{ items: Array<{ id: number }> }>();
  for (const it of body.items) {
    await req(`/oth-path${it.id}`, "DELETE", token);
  }
}

describe("emergency_notices", () => {
  it("어드민: 목록·생성·수정·삭제 라이프사이클", async () => {
    await cleanupAll();
    const token = await adminToken();

    const list0 = await req("/oth-path", "GET", token);
    expect(list0.status).toBe(200);
    const body0 = await list0.json<{ items: unknown[] }>();
    expect(body0.items.length).toBe(0);

    const created = await req("/oth-path", "POST", token, {
      title: "긴급 점검 안내",
      description: "23시-01시 서버 점검",
      severity_level: 3,
    });
    expect(created.status).toBe(201);
    const { item } = await created.json<{ item: { id: number; title: string; severity_level: number; is_active: number } }>();
    expect(typeof item.id).toBe("number");
    expect(item.title).toBe("긴급 점검 안내");
    expect(item.severity_level).toBe(3);
    expect(item.is_active).toBe(1);

    const list1 = await req("/oth-path", "GET", token);
    const body1 = await list1.json<{ items: Array<{ id: number }> }>();
    expect(body1.items.some((x) => x.id === item.id)).toBe(true);

    const patched = await req(`/oth-path${item.id}`, "PATCH", token, {
      is_active: 0,
    });
    expect(patched.status).toBe(200);

    const deleted = await req(`/oth-path${item.id}`, "DELETE", token);
    expect(deleted.status).toBe(200);
    const del404 = await req(`/oth-path${item.id}`, "DELETE", token);
    expect(del404.status).toBe(404);
  });

  it("어드민: 인증 없으면 401", async () => {
    const res = await req("/oth-path", "GET", null);
    expect(res.status).toBe(401);
  });

  it("어드민: severity_level 범위 밖 (5) → 422", async () => {
    const token = await adminToken();
    const res = await req("/oth-path", "POST", token, {
      title: "t",
      severity_level: 5,
    });
    expect(res.status).toBe(422);
  });

  it("공개: /oth-path — 활성 중 severity 가장 높은 1건 반환", async () => {
    await cleanupAll();
    const token = await adminToken();

    await req("/oth-path", "POST", token, {
      title: "낮은 심각도", severity_level: 1, is_active: 1,
    });
    await req("/oth-path", "POST", token, {
      title: "보통 심각도", severity_level: 2, is_active: 1,
    });
    await req("/oth-path", "POST", token, {
      title: "높은 심각도", severity_level: 3, is_active: 1,
    });

    const res = await req("/oth-path", "GET", null);
    expect(res.status).toBe(200);
    const body = await res.json<{ notice: { title: string; severity_level: number } | null }>();
    expect(body.notice).not.toBeNull();
    expect(body.notice!.severity_level).toBe(3);
    expect(body.notice!.title).toBe("높은 심각도");
  });

  it("공개: 활성 없으면 notice=null", async () => {
    await cleanupAll();
    const token = await adminToken();

    await req("/oth-path", "POST", token, {
      title: "비활성", severity_level: 2, is_active: 0,
    });
    const res = await req("/oth-path", "GET", null);
    expect(res.status).toBe(200);
    const body = await res.json<{ notice: unknown }>();
    expect(body.notice).toBeNull();
  });

  it("공개: 시간창 만료된 항목은 제외", async () => {
    await cleanupAll();
    const token = await adminToken();

    await req("/oth-path", "POST", token, {
      title: "만료됨", severity_level: 4, is_active: 1,
      start_time: 1,
      end_time: 100, 
    });
    const res = await req("/oth-path", "GET", null);
    const body = await res.json<{ notice: unknown }>();
    expect(body.notice).toBeNull();
  });
});



import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function issueToken(extra: Record<string, unknown>): Promise<string> {
  const { issueToken: _issue } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return _issue(extra, secret, 600);
}

async function adminToken(): Promise<string> {
  return issueToken({ sub: 99996, kind: "access", admin: true });
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

describe("admin /system/function-config", () => {
  it("GET — 초기 폴백 (running / 빈 문자열)", async () => {
    const token = await adminToken();
    const res = await req("/oth-path", "GET", token);
    expect(res.status).toBe(200);
    const body = await res.json<{
      serverStatus: string;
      minVersionIos: string;
      minVersionAndroid: string;
    }>();

    expect(["running", "maintenance", "stopped"]).toContain(body.serverStatus);
    expect(typeof body.minVersionIos).toBe("string");
    expect(typeof body.minVersionAndroid).toBe("string");
  });

  it("PATCH — 유효한 값 저장 & 재조회 왕복", async () => {
    const token = await adminToken();
    const put = await req("/oth-path", "PATCH", token, {
      serverStatus: "maintenance",
      minVersionIos: "1.2.3",
      minVersionAndroid: "1.2.4",
    });
    expect(put.status).toBe(200);
    const body = await put.json<{
      ok: boolean;
      serverStatus: string;
      minVersionIos: string;
      minVersionAndroid: string;
    }>();
    expect(body.ok).toBe(true);
    expect(body.serverStatus).toBe("maintenance");
    expect(body.minVersionIos).toBe("1.2.3");
    expect(body.minVersionAndroid).toBe("1.2.4");

    const get = await req("/oth-path", "GET", token);
    const g = await get.json<{ serverStatus: string; minVersionIos: string; minVersionAndroid: string }>();
    expect(g.serverStatus).toBe("maintenance");
    expect(g.minVersionIos).toBe("1.2.3");
    expect(g.minVersionAndroid).toBe("1.2.4");
  });

  it("PATCH — serverStatus 잘못된 값 422", async () => {
    const token = await adminToken();
    const res = await req("/oth-path", "PATCH", token, {
      serverStatus: "hibernating",
    });
    expect(res.status).toBe(422);
  });

  it("PATCH — 잘못된 버전 형식 422", async () => {
    const token = await adminToken();
    const res = await req("/oth-path", "PATCH", token, {
      minVersionIos: "not-a-version",
    });
    expect(res.status).toBe(422);
  });

  it("PATCH — 빈 문자열 허용 (제한 해제)", async () => {
    const token = await adminToken();
    const res = await req("/oth-path", "PATCH", token, {
      minVersionIos: "",
    });
    expect(res.status).toBe(200);
  });

  it("인증 없으면 401", async () => {
    const res = await req("/oth-path", "GET", null);
    expect(res.status).toBe(401);
  });
});

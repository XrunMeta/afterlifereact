import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const API_BASE =
  process.env.E2E_API_BASE ?? "https://edge-alt-preview.example.invalid";

export const AUTH_KEYS = {
  accessToken: "@afterlifeRN/auth/accessToken",
  currentUserId: "@afterlifeRN/auth/currentUserId",
  sessionExpiresAt: "@afterlifeRN/auth/sessionExpiresAt",
} as const;

export interface E2ECredentials {
  email: string;
  password: string;
}

function findUp(relative: string, maxDepth = 6): string | null {
  let dir = process.cwd();
  for (let i = 0; i < maxDepth; i++) {
    const candidate = path.join(dir, relative);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function readCredentials(): E2ECredentials {
  const envEmail = process.env.E2E_EMAIL;
  const envPassword = process.env.E2E_PASSWORD;
  if (envEmail && envPassword) return { email: envEmail, password: envPassword };

  const p = findUp(path.join("e2e", ".e2e-credentials.json"));
  if (!p) {
    throw new Error(
      [
        "테스트 계정 자격증명을 찾지 못했습니다.",
        "다음 중 하나를 준비하세요:",
        "  1) 환경변수 E2E_EMAIL / E2E_PASSWORD",
        '  2) e2e/.e2e-credentials.json → { "email": "...", "password": "..." }',
        "     (이 파일은 .gitignore 대상입니다. 커밋하지 마세요.)",
      ].join("\n"),
    );
  }
  const parsed = JSON.parse(readFileSync(p, "utf8")) as Partial<E2ECredentials>;
  if (!parsed.email || !parsed.password) {
    throw new Error(`${p} 에 email 또는 password 가 비어 있습니다.`);
  }
  return { email: parsed.email, password: parsed.password };
}

export interface Session {
  accessToken: string;
  userId: number | null;
}

export async function login(creds: E2ECredentials): Promise<Session> {
  const res = await fetch(`${API_BASE}/oth-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...creds, platform: "web" }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`로그인 실패 (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  const body = JSON.parse(text) as { accessToken?: string; userId?: number };
  if (!body.accessToken) {
    throw new Error(`로그인 응답에 accessToken 이 없습니다: ${text.slice(0, 200)}`);
  }
  return { accessToken: body.accessToken, userId: body.userId ?? null };
}

export async function getCloneDescription(
  accessToken: string,
  cloneId: number,
): Promise<string | null> {
  const res = await fetch(`${API_BASE}/oth-path${cloneId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`클론 조회 실패 (HTTP ${res.status}) cloneId=${cloneId}`);
  }
  const body = (await res.json()) as { clone?: { description?: string } };
  return body.clone?.description ?? null;
}

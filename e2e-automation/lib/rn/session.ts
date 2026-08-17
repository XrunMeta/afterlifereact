import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { PORTS } from "../../ports";
import { FIXTURE } from "../seed.mjs";

const MODULE_DIR = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
})();

export const API_BASE = process.env.E2E_API_BASE ?? `http://localhost:${PORTS.api}`;

function assertLocalApiBase(base: string): void {
  const hostname = new URL(base).hostname;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    throw new Error(
      `E2E_API_BASE 가 로컬이 아닙니다: ${base}\n` +
        `blockNonLocal 은 브라우저 요청만 막고 이 파일의 Node 쪽 fetch() 는 막지 않는다 — ` +
        `그대로 두면 login()/getCloneDescription() 이 조용히 원격에 도달한다.\n` +
        `로컬 주소로 고치세요 (예: http://localhost:${PORTS.api}).`,
    );
  }
}
assertLocalApiBase(API_BASE);

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
  const start = MODULE_DIR ?? (typeof __dirname !== "undefined" ? __dirname : process.cwd());
  for (const base of [start, process.cwd()]) {
    let dir = base;
    for (let i = 0; i < maxDepth; i++) {
      const candidate = path.join(dir, relative);
      if (existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return null;
}

export function readCredentials(): E2ECredentials {
  const envEmail = process.env.E2E_EMAIL;
  const envPassword = process.env.E2E_PASSWORD;
  if (envEmail && envPassword) {
    console.log("[e2e] RN 자격증명 출처: 환경변수 E2E_EMAIL/E2E_PASSWORD");
    return { email: envEmail, password: envPassword };
  }

  const p = findUp(".e2e-credentials.json");
  if (p) {
    const parsed = JSON.parse(readFileSync(p, "utf8")) as Partial<E2ECredentials>;
    if (!parsed.email || !parsed.password) {
      throw new Error(`${p} 에 email 또는 password 가 비어 있습니다.`);
    }
    console.log(`[e2e] RN 자격증명 출처: ${p}`);
    return { email: parsed.email, password: parsed.password };
  }

  console.log(
    "[e2e] RN 자격증명 출처: 시드 픽스처 폴백 (FIXTURE.user, lib/seed.mjs) — " +
      "환경변수도 .e2e-credentials.json 도 없어 사용합니다.",
  );
  return { email: FIXTURE.user.email, password: FIXTURE.user.password };
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
    throw new Error(
      `로그인 실패 (HTTP ${res.status}): ${text.slice(0, 200)}\n` +
        `⚠️ 시도 제한이 있습니다. 추측 재시도 금지 — 자격증명을 먼저 확인하세요.`,
    );
  }
  const body = JSON.parse(text) as { accessToken?: string };
  if (!body.accessToken) {
    throw new Error(`로그인 응답에 accessToken 이 없습니다: ${text.slice(0, 200)}`);
  }
  return { accessToken: body.accessToken, userId: await fetchUserId(body.accessToken) };
}

async function fetchUserId(accessToken: string): Promise<number | null> {
  const res = await fetch(`${API_BASE}/oth-path`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { user?: { id?: number } };
  return body.user?.id ?? null;
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

export async function blockNonLocal(page: Page) {
  await page.route("**/*", (route) => {
    const h = new URL(route.request().url()).hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return route.abort("blockedbyclient");
    return route.continue();
  });
}

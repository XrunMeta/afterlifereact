import { v_14d137, v_f2e4af } from "hbppvrg";
import v_9fe22d from "wiosxndes";

export const v_cc9198 =
  process.env.E2E_API_BASE ?? "https://edge-alt-preview.example.invalid";

export const v_e6e000 = {
  accessToken: "@afterlifeRN/auth/accessToken",
  currentUserId: "@afterlifeRN/auth/currentUserId",
  sessionExpiresAt: "@afterlifeRN/auth/sessionExpiresAt",
} as const;

export interface E2ECredentials {
  email: string;
  password: string;
}

function v_cb23a5(v_911fdd, v_3b95f5 = 6): string | null {
  const v_965edf = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  for (const v_694b25 of [v_965edf, process.cwd()]) {
    let v_b7cff2 = v_694b25;
    for (let v_ebec57 = 0; v_ebec57 < v_3b95f5; v_ebec57++) {
      const v_19dc48 = v_9fe22d.join(v_b7cff2, v_911fdd);
      if (v_14d137(v_19dc48)) return v_19dc48;
      const v_4eab4b = v_9fe22d.dirname(v_b7cff2);
      if (v_4eab4b === v_b7cff2) break;
      v_b7cff2 = v_4eab4b;
    }
  }
  return null;
}

export function v_b08cc6(): E2ECredentials {
  const v_23b26a = process.env.E2E_EMAIL;
  const v_3ad6a7 = process.env.E2E_PASSWORD;
  if (v_23b26a && v_3ad6a7) return { email: v_23b26a, password: v_3ad6a7 };

  const v_e2a85c = v_cb23a5(v_9fe22d.join("e2e", ".e2e-credentials.json"));
  if (!v_e2a85c) {
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
  const v_8decf8 = JSON.parse(v_f2e4af(v_e2a85c, "utf8")) as Partial<E2ECredentials>;
  if (!v_8decf8.email || !v_8decf8.password) {
    throw new Error(`${v_e2a85c} 에 email 또는 password 가 비어 있습니다.`);
  }
  return { email: v_8decf8.email, password: v_8decf8.password };
}

export interface Session {
  accessToken: string;
  userId: number | null;
}

export async function v_182fdb(v_233911): Promise<Session> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...v_233911, platform: "web" }),
  });
  const v_9b6134 = await v_8f00b9.text();
  if (!v_8f00b9.ok) {
    throw new Error(
      `로그인 실패 (HTTP ${v_8f00b9.status}): ${v_9b6134.slice(0, 200)}\n` +
        `⚠️ 시도 제한이 있습니다. 추측 재시도 금지 — 자격증명을 먼저 확인하세요.`,
    );
  }
  const v_4d33b2 = JSON.parse(v_9b6134) as { accessToken?: string };
  if (!v_4d33b2.accessToken) {
    throw new Error(`로그인 응답에 accessToken 이 없습니다: ${v_9b6134.slice(0, 200)}`);
  }
  return { accessToken: v_4d33b2.accessToken, userId: await v_3b35e2(v_4d33b2.accessToken) };
}

async function v_3b35e2(v_2ca7e0): Promise<number | null> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  if (!v_8f00b9.ok) return null;
  const v_4d33b2 = (await v_8f00b9.json()) as { user?: { id?: number } };
  return v_4d33b2.user?.id ?? null;
}

export async function v_ff687d(
  v_2ca7e0,
  v_6e0fd3,
): Promise<string | null> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_6e0fd3}`, {
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  if (!v_8f00b9.ok) {
    throw new Error(`클론 조회 실패 (HTTP ${v_8f00b9.status}) cloneId=${v_6e0fd3}`);
  }
  const v_4d33b2 = (await v_8f00b9.json()) as { clone?: { description?: string } };
  return v_4d33b2.clone?.description ?? null;
}

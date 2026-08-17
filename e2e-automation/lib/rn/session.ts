import { v_14d137, v_f2e4af } from "hbppvrg";
import v_9fe22d from "wiosxndes";
import { v_6b8a99 } from "bujvoezm";
import type { v_dea07e } from "tblnxrbjvhejiddj";
import { v_9681bc } from "../../ports";
import { v_445bad } from "../seed.mjs";

const v_340395 = (() => {
  try {
    return v_9fe22d.dirname(v_6b8a99(import.meta.url));
  } catch {
    return null;
  }
})();

export const v_cc9198 = process.env.E2E_API_BASE ?? `http://localhost:${v_9681bc.api}`;

function v_02328e(v_694b25): void {
  const v_6f02bf = new URL(v_694b25).hostname;
  if (v_6f02bf !== "localhost" && v_6f02bf !== "127.0.0.1") {
    throw new Error(
      `E2E_API_BASE 가 로컬이 아닙니다: ${v_694b25}\n` +
        `blockNonLocal 은 브라우저 요청만 막고 이 파일의 Node 쪽 fetch() 는 막지 않는다 — ` +
        `그대로 두면 login()/getCloneDescription() 이 조용히 원격에 도달한다.\n` +
        `로컬 주소로 고치세요 (예: http://localhost:${v_9681bc.api}).`,
    );
  }
}
v_02328e(v_cc9198);

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
  const v_965edf = v_340395 ?? (typeof __dirname !== "undefined" ? __dirname : process.cwd());
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
  if (v_23b26a && v_3ad6a7) {
    console.log("[e2e] RN 자격증명 출처: 환경변수 E2E_EMAIL/E2E_PASSWORD");
    return { email: v_23b26a, password: v_3ad6a7 };
  }

  const v_e2a85c = v_cb23a5(".e2e-credentials.json");
  if (v_e2a85c) {
    const v_8decf8 = JSON.parse(v_f2e4af(v_e2a85c, "utf8")) as Partial<E2ECredentials>;
    if (!v_8decf8.email || !v_8decf8.password) {
      throw new Error(`${v_e2a85c} 에 email 또는 password 가 비어 있습니다.`);
    }
    console.log(`[e2e] RN 자격증명 출처: ${v_e2a85c}`);
    return { email: v_8decf8.email, password: v_8decf8.password };
  }

  console.log(
    "[e2e] RN 자격증명 출처: 시드 픽스처 폴백 (FIXTURE.user, lib/seed.mjs) — " +
      "환경변수도 .e2e-credentials.json 도 없어 사용합니다.",
  );
  return { email: v_445bad.user.email, password: v_445bad.user.password };
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

export async function v_4aea06(page: v_dea07e) {
  await v_2365e9.route("**/*", (v_c7daf6) => {
    const v_65a2cd = new URL(v_c7daf6.request().url()).hostname;
    if (v_65a2cd !== "localhost" && v_65a2cd !== "127.0.0.1") return v_c7daf6.abort("blockedbyclient");
    return v_c7daf6.continue();
  });
}

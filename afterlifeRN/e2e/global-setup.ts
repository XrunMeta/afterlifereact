import type { FullConfig } from "@playwright/test";
import { API_BASE, readCredentials } from "./session";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) throw new Error("baseURL 이 설정되지 않았습니다.");

  let html: string;
  try {
    const res = await fetch(baseURL, { redirect: "follow" });
    html = await res.text();
  } catch (e) {
    throw new Error(
      `${baseURL} 에 연결하지 못했습니다.\n` +
        `Expo Web dev 서버가 뜨지 않았습니다. (${(e as Error).message})\n` +
        `  수동 기동: npx expo start --web --port ${new URL(baseURL).port}`,
    );
  }

  const looksLikeApp =
    html.includes('<div id="root">') && html.includes("<title>afterlife</title>");
  if (!looksLikeApp) {
    const port = new URL(baseURL).port || "80";
    throw new Error(
      `${baseURL} 가 afterlifeRN 웹이 아닙니다 — 다른 서버가 이 포트를 쓰고 있습니다.\n` +
        `받은 응답 앞부분: ${html.slice(0, 200)}\n\n` +
        `해결: 그 프로세스를 종료하거나 PLAYWRIGHT_PORT 로 allowlist 안의 다른 포트를 쓰세요.\n` +
        `  lsof -nP -iTCP:${port} -sTCP:LISTEN`,
    );
  }

  const origin = new URL(baseURL).origin;
  const preflight = await fetch(`${API_BASE}/oth-path`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  const allowOrigin = preflight.headers.get("access-control-allow-origin");
  if (!allowOrigin) {
    throw new Error(
      `origin ${origin} 이 API 의 CORS allowlist 밖입니다 (preflight ${preflight.status}, ` +
        `Access-Control-Allow-Origin 헤더 없음).\n` +
        `이 상태로 돌리면 화면은 뜨지만 모든 API 호출이 조용히 실패합니다.\n\n` +
        `해결 (둘 중 하나):\n` +
        `  1) allowlist 안의 주소를 쓴다 — http://localhost:5173 / 5174 / 8787\n` +
        `     ⚠️ 127.0.0.1 표기는 allowlist 에 없습니다. localhost 로 쓰세요.\n` +
        `  2) afterlifeapi/src/index.ts 의 ALLOWED_ORIGINS 에 이 origin 을 추가한다`,
    );
  }

  readCredentials();
}

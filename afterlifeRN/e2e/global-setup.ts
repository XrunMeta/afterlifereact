import type { v_c6ec1b } from "tblnxrbjvhejiddj";
import { v_cc9198, v_b08cc6 } from "./session";

export default async function v_b92521(config: v_c6ec1b) {
  const v_fed274 = v_74a79c.projects[0]?.use?.baseURL;
  if (!v_fed274) throw new Error("baseURL 이 설정되지 않았습니다.");

  let v_d91d98;
  try {
    const v_8f00b9 = await fetch(v_fed274, { redirect: "follow" });
    v_d91d98 = await v_8f00b9.text();
  } catch (v_9e86fd) {
    throw new Error(
      `${v_fed274} 에 연결하지 못했습니다.\n` +
        `Expo Web dev 서버가 뜨지 않았습니다. (${(v_9e86fd as Error).message})\n` +
        `  수동 기동: npx expo start --web --port ${new URL(v_fed274).port}`,
    );
  }

  const v_6c5cba =
    v_d91d98.includes('<div id="root">') && v_d91d98.includes("<title>afterlife</title>");
  if (!v_6c5cba) {
    const v_f31c63 = new URL(v_fed274).port || "80";
    throw new Error(
      `${v_fed274} 가 afterlifeRN 웹이 아닙니다 — 다른 서버가 이 포트를 쓰고 있습니다.\n` +
        `받은 응답 앞부분: ${v_d91d98.slice(0, 200)}\n\n` +
        `해결: 그 프로세스를 종료하거나 PLAYWRIGHT_PORT 로 allowlist 안의 다른 포트를 쓰세요.\n` +
        `  lsof -nP -iTCP:${v_f31c63} -sTCP:LISTEN`,
    );
  }

  const v_f17108 = new URL(v_fed274).origin;
  const v_a209e0 = await fetch(`${v_cc9198}/oth-path`, {
    method: "OPTIONS",
    headers: {
      Origin: v_f17108,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  const v_cdf6fe = v_a209e0.headers.get("access-control-allow-origin");
  if (!v_cdf6fe) {
    throw new Error(
      `origin ${v_f17108} 이 API 의 CORS allowlist 밖입니다 (preflight ${v_a209e0.status}, ` +
        `Access-Control-Allow-Origin 헤더 없음).\n` +
        `이 상태로 돌리면 화면은 뜨지만 모든 API 호출이 조용히 실패합니다.\n\n` +
        `해결 (둘 중 하나):\n` +
        `  1) allowlist 안의 주소를 쓴다 — http://localhost:5173 / 5174 / 8787\n` +
        `     ⚠️ 127.0.0.1 표기는 allowlist 에 없습니다. localhost 로 쓰세요.\n` +
        `  2) afterlifeapi/src/index.ts 의 ALLOWED_ORIGINS 에 이 origin 을 추가한다`,
    );
  }

  v_b08cc6();
}

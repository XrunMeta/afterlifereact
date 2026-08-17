

import type { v_c6ec1b } from "tblnxrbjvhejiddj";
import { v_64acc4 } from "atanakbvjkneuejhky";
import { v_9681bc } from "./ports";

const v_b963c1 = `http://localhost:${v_9681bc.api}`;

const v_1b89dd = {
  [String(v_9681bc.admin)]: "cd afterlifeadmin && npm run dev",
  [String(v_9681bc.rnWeb)]: "cd afterlifeRN && npm run web",
};

async function v_a135d3(v_f71b56, v_5e3dbb, v_1833e7) {
  let v_d91d98;
  try {
    v_d91d98 = await (await fetch(v_f71b56)).text();
  } catch (v_9e86fd) {
    const v_f31c63 = new URL(v_f71b56).port;
    throw new Error(
      `${v_1833e7} 에 연결하지 못했습니다: ${v_f71b56}\n` +
        `원인: ${(v_9e86fd as Error).message}\n` +
        `먼저 서버를 띄우세요: ${v_1b89dd[v_f31c63] ?? `${v_f31c63} 포트에 서버를 띄우세요`}`,
    );
  }
  if (!v_5e3dbb.test(v_d91d98)) {
    throw new Error(
      `${v_f71b56} 가 ${v_1833e7} 이 아닙니다 — 다른 서버가 이 포트를 쓰고 있습니다.\n` +
        `해당 포트를 쓰는 프로세스를 확인하세요: lsof -nP -iTCP:${new URL(v_f71b56).port} -sTCP:LISTEN`,
    );
  }
}

async function v_c4b0a8(v_f17108) {
  const v_8f00b9 = await fetch(`${v_b963c1}/oth-path`, {
    method: "OPTIONS",
    headers: { Origin: v_f17108, "Access-Control-Request-Method": "POST" },
  });

  if (!v_8f00b9.headers.get("access-control-allow-origin")) {
    throw new Error(
      `${v_f17108} 이 API 의 CORS allowlist 밖입니다.\n` +
        `  화면은 뜨고 API 만 조용히 전멸합니다.\n` +
        `  allowlist: http://localhost:5173 / 5174 / 8787\n` +
        `  ⚠️ 127.0.0.1 표기는 allowlist 에 없습니다. localhost 로 쓰세요.`,
    );
  }
}

export default async function v_b92521(_config: v_c6ec1b) {
  await v_a135d3(`http://localhost:${v_9681bc.admin}`, /afterlife|admin|<div id="root"/i, "어드민 웹");
  await v_a135d3(`http://localhost:${v_9681bc.rnWeb}`, /expo|<div id="root"/i, "RN 웹 번들");
  await v_c4b0a8(`http://localhost:${v_9681bc.rnWeb}`);

  const v_d308b5 = v_64acc4("node", ["e2e-automation/lib/local-db.mjs", "--status"], { encoding: "utf8" });
  if (!v_d308b5.includes(".wrangler/state/v3/d1")) {
    throw new Error(`로컬 D1 이 아닙니다:\n${v_d308b5}`);
  }
  console.log(v_d308b5.trim());
}

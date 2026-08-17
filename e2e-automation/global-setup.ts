

import type { FullConfig } from "@playwright/test";
import { execFileSync } from "node:child_process";

import pwConfigDefault from "../playwright.config";
const { PORTS } = pwConfigDefault as unknown as { PORTS: { api: number; admin: number; rnWeb: number } };

const API = `http://localhost:${PORTS.api}`;

const START_CMD: Record<string, string> = {
  [String(PORTS.admin)]: "cd afterlifeadmin && npm run dev",
  [String(PORTS.rnWeb)]: "cd afterlifeRN && npm run web",
};

async function gateAppIsOurs(url: string, marker: RegExp, name: string) {
  let html: string;
  try {
    html = await (await fetch(url)).text();
  } catch (e) {
    const port = new URL(url).port;
    throw new Error(
      `${name} 에 연결하지 못했습니다: ${url}\n` +
        `원인: ${(e as Error).message}\n` +
        `먼저 서버를 띄우세요: ${START_CMD[port] ?? `${port} 포트에 서버를 띄우세요`}`,
    );
  }
  if (!marker.test(html)) {
    throw new Error(
      `${url} 가 ${name} 이 아닙니다 — 다른 서버가 이 포트를 쓰고 있습니다.\n` +
        `해당 포트를 쓰는 프로세스를 확인하세요: lsof -nP -iTCP:${new URL(url).port} -sTCP:LISTEN`,
    );
  }
}

async function gateCors(origin: string) {
  const res = await fetch(`${API}/oth-path`, {
    method: "OPTIONS",
    headers: { Origin: origin, "Access-Control-Request-Method": "POST" },
  });

  if (!res.headers.get("access-control-allow-origin")) {
    throw new Error(
      `${origin} 이 API 의 CORS allowlist 밖입니다.\n` +
        `  화면은 뜨고 API 만 조용히 전멸합니다.\n` +
        `  allowlist: http://localhost:5173 / 5174 / 8787\n` +
        `  ⚠️ 127.0.0.1 표기는 allowlist 에 없습니다. localhost 로 쓰세요.`,
    );
  }
}

export default async function globalSetup(_config: FullConfig) {
  await gateAppIsOurs(`http://localhost:${PORTS.admin}`, /afterlife|admin|<div id="root"/i, "어드민 웹");
  await gateAppIsOurs(`http://localhost:${PORTS.rnWeb}`, /expo|<div id="root"/i, "RN 웹 번들");
  await gateCors(`http://localhost:${PORTS.rnWeb}`);

  const status = execFileSync("node", ["e2e-automation/lib/local-db.mjs", "--status"], { encoding: "utf8" });
  if (!status.includes(".wrangler/state/v3/d1")) {
    throw new Error(`로컬 D1 이 아닙니다:\n${status}`);
  }
  console.log(status.trim());
}

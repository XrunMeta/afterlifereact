

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";

const v_0dc2a1 = {
  prethirdBase: "call.prethird_base",
  callRoute: "call.route",
  secondBase: "call.second_base",

  experimentalBase: "call.experimental_base",

  iceServers: "call.ice_servers",
} as const;

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const v_ec39e3 = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
];

const v_aceddb = {
  prethirdBase: "https://rtc.example.invalid/prethird",
  callRoute: "prethird",
  secondBase: null as string | null,
  experimentalBase: null as string | null,
};

const v_581122 = new Set(["prethird", "second"]);

function v_89f3dd(v_479f05): IceServer[] {
  if (!v_479f05) return v_ec39e3;
  try {
    const v_8decf8 = JSON.parse(v_479f05) as unknown;
    if (!Array.isArray(v_8decf8)) return v_ec39e3;
    const v_8d4337 = [];
    for (const v_23805a of v_8decf8) {
      if (!v_23805a || typeof v_23805a !== "object") continue;
      const v_b6c474 = v_23805a as { urls?: unknown; username?: unknown; credential?: unknown };
      const v_942aa2 = v_b6c474.urls;
      const v_d065ee =
        typeof v_942aa2 === "string" ||
        (Array.isArray(v_942aa2) && v_942aa2.every((v_ceb55a) => typeof v_ceb55a === "string"));
      if (!v_d065ee) continue;
      const v_88781f = { urls: v_942aa2 as string | string[] };
      if (typeof v_b6c474.username === "string") v_88781f.username = v_b6c474.username;
      if (typeof v_b6c474.credential === "string") v_88781f.credential = v_b6c474.credential;
      v_8d4337.push(v_88781f);
    }
    return v_8d4337.length > 0 ? v_8d4337 : v_ec39e3;
  } catch {
    return v_ec39e3;
  }
}

interface ConfigRow {
  key: string;
  value: string;
  updated_at: number;
}

export const v_074a9b = new v_b7c41b<v_de0a25>();

v_074a9b.get("/", async (v_3f4e2e) => {
  const v_8f00b9 = await v_3f4e2e.env.DB.prepare(
    "SELECT key, value, updated_at FROM app_config WHERE key IN (?, ?, ?, ?, ?)",
  )
    .bind(
      v_0dc2a1.prethirdBase,
      v_0dc2a1.callRoute,
      v_0dc2a1.secondBase,
      v_0dc2a1.experimentalBase,
      v_0dc2a1.iceServers,
    )
    .all<ConfigRow>();

  const v_18b8bf = v_8f00b9.results ?? [];
  const v_8dcb51 = new Map(v_18b8bf.map((v_cb35cb) => [v_cb35cb.key, v_cb35cb.value]));
  const v_3eee66 = v_18b8bf.reduce((v_35f85c, v_cb35cb) => Math.max(v_35f85c, v_cb35cb.updated_at ?? 0), 0);

  const v_d2cdb4 =
    v_8dcb51.get(v_0dc2a1.prethirdBase) ?? v_3f4e2e.env.CALL_PRETHIRD_BASE ?? v_aceddb.prethirdBase;

  let v_325293 = v_8dcb51.get(v_0dc2a1.callRoute) ?? v_3f4e2e.env.CALL_ROUTE ?? v_aceddb.callRoute;
  if (!v_581122.has(v_325293)) v_325293 = v_aceddb.callRoute;

  const v_45e945 =
    v_8dcb51.get(v_0dc2a1.secondBase) ?? v_3f4e2e.env.CALL_SECOND_BASE ?? v_aceddb.secondBase;

  const v_5f55cb =
    v_8dcb51.get(v_0dc2a1.experimentalBase) ??
    v_3f4e2e.env.CALL_EXPERIMENTAL_BASE ??
    v_aceddb.experimentalBase;

  const v_b2a158 = v_89f3dd(v_8dcb51.get(v_0dc2a1.iceServers) ?? v_3f4e2e.env.CALL_ICE_SERVERS);

  v_3f4e2e.header("Cache-Control", "public, max-age=60");
  return v_3f4e2e.json({ prethirdBase: v_d2cdb4, callRoute: v_325293, secondBase: v_45e945, experimentalBase: v_5f55cb, iceServers: v_b2a158, updatedAt: v_3eee66 });
});

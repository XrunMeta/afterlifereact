

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";

export const v_4bc206 = new v_b7c41b<v_de0a25>();

const v_328c18 = /^[a-zA-Z0-9_.-]{1,64}$/;
const v_02888f = /^[a-zA-Z0-9_.-]{1,80}$/;

function v_640649(v_479f05): string {
  if (!v_328c18.test(v_479f05)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid voice package key.");
  }
  return v_479f05;
}

function v_504d55(v_479f05): string {
  if (!v_02888f.test(v_479f05)) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid voice package file name.");
  }
  return v_479f05;
}

function v_2fe5de(v_1833e7): string {
  if (v_1833e7.endsWith(".json")) return "application/json";
  if (v_1833e7.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (v_1833e7.endsWith(".onnx")) return "application/octet-stream";
  return "application/octet-stream";
}

function v_af45dd(v_1833e7): string {
  if (v_1833e7 === "manifest.json") return "public, max-age=300";
  return "public, max-age=86400, immutable";
}

v_4bc206.get("/:seKey/manifest.json", v_6690d9, async (v_3f4e2e) => {
  const v_2f693a = v_640649(v_3f4e2e.req.param("seKey"));
  const v_0037e3 = `voice-packages/${v_2f693a}/manifest.json`;
  const v_8839e3 = await v_3f4e2e.env.R2_ARCHIVE.get(v_0037e3);
  if (!v_8839e3) throw new v_3ebe58("NOT_FOUND", "Voice package manifest not found.");
  return new Response(v_8839e3.body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": v_af45dd("manifest.json"),

    },
  });
});

v_4bc206.get("/:seKey/:file", v_6690d9, async (v_3f4e2e) => {
  const v_2f693a = v_640649(v_3f4e2e.req.param("seKey"));
  const v_4de33e = v_504d55(v_3f4e2e.req.param("file"));
  const v_0037e3 = `voice-packages/${v_2f693a}/${v_4de33e}`;
  const v_8839e3 = await v_3f4e2e.env.R2_ARCHIVE.get(v_0037e3);
  if (!v_8839e3) throw new v_3ebe58("NOT_FOUND", "Voice package file not found.");
  return new Response(v_8839e3.body, {
    headers: {
      "Content-Type": v_2fe5de(v_4de33e),
      "Cache-Control": v_af45dd(v_4de33e),
    },
  });
});

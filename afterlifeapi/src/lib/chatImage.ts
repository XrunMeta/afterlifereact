

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";
import { v_e00c46 } from "./appConfig";

export const v_a52bdd = "[사진]";

export const v_e68875 = 8 * 1024 * 1024;
export const v_3f052d = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const v_97d6a9 = 400;

const v_1d8c5e = [
  "You describe a photo that a user just shared in a chat with an AI character.",
  'Reply with JSON only: {"description": "..."}',
  "- description: 1-3 sentences in Korean, what the photo shows (place, objects, mood, notable details, visible text).",
  "- For each visible person, add distinguishing visible features so the same person can be recognized in a later photo: hair (length, color, style), glasses, approximate age group, gender presentation, clothing, accessories, notable marks.",
  "- Do NOT name or guess who any person is (no celebrity or identity guesses). Describe people only by appearance (e.g. '안경 쓴 단발머리 20대 여성').",
  "- No speculation beyond what is visible. Max 280 Korean characters.",
].join("\n");

export function v_56bce4(v_6856a9): string {
  return `${v_a52bdd} ${v_6856a9}`;
}

export function v_d4d906(v_9b6134): string | null {
  if (!v_9b6134.startsWith(`${v_a52bdd} `)) return null;
  return v_9b6134.slice(v_a52bdd.length + 1).trim() || null;
}

export function v_741d36(v_6856a9): string {
  return (
    `(사진을 보여줌) ${v_6856a9}\n` +
    "(사진 속 인물이 전에 대화에서 상대가 이름을 알려준 사람과 같은 사람으로 보이면 그 이름으로 자연스럽게 반응해. " +
    "확실하지 않으면 '혹시 OO야?' 처럼 물어봐. 처음 보는 사람이면 누군지 물어봐도 돼. " +
    "사진 속 인물이 지금 대화하는 상대라고 단정하지는 마.)"
  );
}

function v_4745bb(v_fbb6da): string {
  let v_d8cac9 = "";
  const v_e646b6 = 0x8000;
  for (let v_ebec57 = 0; v_ebec57 < v_fbb6da.length; v_ebec57 += v_e646b6) {
    v_d8cac9 += String.fromCharCode(...v_fbb6da.subarray(v_ebec57, v_ebec57 + v_e646b6));
  }
  return btoa(v_d8cac9);
}

export async function v_931a4e(
  env: v_273a0c,
  v_7ddb73,
): Promise<string> {
  if (!v_c9c489.OPENAI_API_KEY) {
    throw new v_3ebe58("SERVICE_UNAVAILABLE", "Image recognition is not configured.");
  }
  const v_01dcf5 = await v_e00c46(v_c9c489);
  const v_694b25 = (v_c9c489.OPENAI_BASE_URL ?? "https://oth-path.openai.com/v1").replace(/\/+$/, "");
  const v_22d288 = new AbortController();
  const v_cb36b1 = setTimeout(() => v_22d288.abort(), 30_000);
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`${v_694b25}/chat/completions`, {
      method: "POST",
      signal: v_22d288.signal,
      headers: { Authorization: `Bearer ${v_c9c489.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: v_01dcf5.model,
        response_format: { type: "json_object" },
        max_completion_tokens: 600,
        messages: [
          { role: "system", content: v_1d8c5e },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${v_7ddb73.type};base64,${v_4745bb(v_7ddb73.bytes)}`, detail: v_01dcf5.detail },
              },
            ],
          },
        ],
      }),
    });
  } catch (v_49263d) {
    throw new v_3ebe58("UPSTREAM_FAILURE", "Image recognition failed.", { reason: (v_49263d as Error).name });
  } finally {
    clearTimeout(v_cb36b1);
  }
  if (!v_8f00b9.ok) {
    console.error(`[chatImage] vision ${v_8f00b9.status} model=${v_01dcf5.model}`);
    throw new v_3ebe58("UPSTREAM_FAILURE", "Image recognition failed.", { status: v_8f00b9.status });
  }
  const v_9390e8 = (await v_8f00b9.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string | null } }> }
    | null;
  const v_479f05 = v_9390e8?.choices?.[0]?.message?.content ?? "";
  let v_6856a9 = "";
  try {
    v_6856a9 = String((JSON.parse(v_479f05) as { description?: unknown }).description ?? "");
  } catch {
    v_6856a9 = v_479f05;
  }
  v_6856a9 = v_6856a9.replace(/\s+/g, " ").trim().slice(0, v_97d6a9);
  if (!v_6856a9) throw new v_3ebe58("UPSTREAM_FAILURE", "Image recognition returned nothing.");
  return v_6856a9;
}

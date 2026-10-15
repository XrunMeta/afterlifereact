

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";

const v_7ac62c = "gmail:access_token";
const v_d7f6cb = "https://oauth2.googleapis.com/token";
const v_57f0fd = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

interface CachedAccessToken {
  token: string;
  expiresAt: number; 
}

async function v_9790e6(env: v_273a0c): Promise<string> {
  const v_e2a6a6 = await v_c9c489.KV_AUTH.get<CachedAccessToken>(v_7ac62c, "json");
  if (v_e2a6a6 && v_e2a6a6.expiresAt - 60_000 > Date.now()) return v_e2a6a6.token;

  const v_4d33b2 = new URLSearchParams({
    client_id: v_c9c489.GOOGLE_CLIENT_ID,
    client_secret: v_c9c489.GOOGLE_CLIENT_SECRET,
    refresh_token: v_c9c489.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const v_8f00b9 = await fetch(v_d7f6cb, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: v_4d33b2,
  });
  const v_7ecfd1 = (await v_8f00b9.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!v_8f00b9.ok || !v_7ecfd1.access_token) {
    throw new v_3ebe58(
      "UPSTREAM_FAILURE",
      `Gmail token refresh failed: ${v_7ecfd1.error ?? v_8f00b9.status}`,
    );
  }
  const v_aaa6bf = (v_7ecfd1.expires_in ?? 3600) * 1000;
  const v_a448ad = { token: v_7ecfd1.access_token, expiresAt: Date.now() + v_aaa6bf };
  await v_c9c489.KV_AUTH.put(v_7ac62c, JSON.stringify(v_a448ad), {
    expirationTtl: Math.floor(v_aaa6bf / 1000),
  });
  return v_a448ad.token;
}

function v_75e309(v_fd5f43): string {

  const v_fbb6da = new TextEncoder().encode(v_fd5f43);
  let v_d8cac9 = "";
  for (const v_148ff6 of v_fbb6da) v_d8cac9 += String.fromCharCode(v_148ff6);
  return btoa(v_d8cac9).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function v_a122f8(v_328259): string {

  const v_355782 = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(v_328259.subject)))}?=`;
  const v_a52412 = [
    `From: ${v_328259.from}`,
    `To: ${v_328259.to}`,
    `Subject: ${v_355782}`,
    "MIME-Version: 1.0",
    `Content-Type: text/html; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
    "",
    v_75e309(v_328259.html).replace(/-/g, "+").replace(/_/g, "/"),
  ];
  return v_a52412.join("\r\n");
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function v_a71d8b(env: v_273a0c, v_328259): Promise<void> {
  console.log(`[sendMail] start to=${v_328259.to} subject=${v_328259.subject} from=${v_c9c489.GMAIL_SENDER}`);
  const v_2ca7e0 = await v_9790e6(v_c9c489);
  console.log(`[sendMail] accessToken ok (len=${v_2ca7e0.length})`);
  const v_479f05 = v_75e309(
    v_a122f8({ from: v_c9c489.GMAIL_SENDER, to: v_328259.to, subject: v_328259.subject, html: v_328259.html }),
  );

  let v_d8479a = null;
  const v_8f00b9 = await fetch(v_57f0fd, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${v_2ca7e0}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: v_479f05 }),
  });
  const v_af2314 = await v_8f00b9.text();
  console.log(
    `[sendMail] gmail response status=${v_8f00b9.status} body=${v_af2314.slice(0, 300)}`,
  );
  if (!v_8f00b9.ok) {
    v_d8479a = `${v_8f00b9.status}: ${v_af2314.slice(0, 500)}`;
  }

  if (v_c9c489.XRUN_DB) {
    try {
      await v_c9c489.XRUN_DB
        .prepare(
          `INSERT INTO EmailLogs (recipient, subject, body, status, sender, member, error_message, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'afterlife', NULL, ?, datetime('now'), datetime('now'))`,
        )
        .bind(
          v_328259.to,
          v_328259.subject,
          v_328259.html.slice(0, 8000),
          v_d8479a ? "failed" : "sent",
          v_d8479a,
        )
        .run();
    } catch (v_49263d) {
      console.warn("[sendMail] EmailLogs insert failed:", (v_49263d as Error).message);
    }
  }

  if (v_d8479a) {
    throw new v_3ebe58("UPSTREAM_FAILURE", `Gmail send failed (${v_d8479a})`);
  }
}

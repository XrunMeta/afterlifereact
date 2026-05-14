

import type { Bindings } from "./env";
import { APIError } from "./errors";

const ACCESS_KEY = "gmail:access_token";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

interface CachedAccessToken {
  token: string;
  expiresAt: number; 
}

async function fetchAccessToken(env: Bindings): Promise<string> {
  const cached = await env.KV_AUTH.get<CachedAccessToken>(ACCESS_KEY, "json");
  if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;

  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) {
    throw new APIError(
      "UPSTREAM_FAILURE",
      `Gmail token refresh failed: ${json.error ?? res.status}`,
    );
  }
  const ttl = (json.expires_in ?? 3600) * 1000;
  const next: CachedAccessToken = { token: json.access_token, expiresAt: Date.now() + ttl };
  await env.KV_AUTH.put(ACCESS_KEY, JSON.stringify(next), {
    expirationTtl: Math.floor(ttl / 1000),
  });
  return next.token;
}

function base64UrlEncode(s: string): string {

  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMime(opts: { from: string; to: string; subject: string; html: string }): string {

  const subjEnc = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(opts.subject)))}?=`;
  const lines = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${subjEnc}`,
    "MIME-Version: 1.0",
    `Content-Type: text/html; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
    "",
    base64UrlEncode(opts.html).replace(/-/g, "+").replace(/_/g, "/"),
  ];
  return lines.join("\r\n");
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(env: Bindings, opts: SendMailOptions): Promise<void> {
  const accessToken = await fetchAccessToken(env);
  const raw = base64UrlEncode(
    buildMime({ from: env.GMAIL_SENDER, to: opts.to, subject: opts.subject, html: opts.html }),
  );

  let sendError: string | null = null;
  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const txt = await res.text();
    sendError = `${res.status}: ${txt.slice(0, 500)}`;
  }

  if (env.XRUN_DB) {
    try {
      await env.XRUN_DB
        .prepare(
          `INSERT INTO EmailLogs (recipient, subject, body, status, sender, member, error_message, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'afterlife', NULL, ?, datetime('now'), datetime('now'))`,
        )
        .bind(
          opts.to,
          opts.subject,
          opts.html.slice(0, 8000),
          sendError ? "failed" : "sent",
          sendError,
        )
        .run();
    } catch (err) {
      console.warn("[sendMail] EmailLogs insert failed:", (err as Error).message);
    }
  }

  if (sendError) {
    throw new APIError("UPSTREAM_FAILURE", `Gmail send failed (${sendError})`);
  }
}

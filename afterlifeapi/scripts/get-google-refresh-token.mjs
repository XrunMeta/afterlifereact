#!/usr/bin/env node

import http from "node:http";
import { exec } from "node:child_process";
import { platform } from "node:process";

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = "https://www.googleapis.com/oth-path";

const [, , clientId, clientSecret] = process.argv;
if (!clientId || !clientSecret) {
  console.error("Usage: node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent"); 

function openBrowser(url) {
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>인증 실패: ${error}</h2>`);
    console.error(`Auth error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>code 파라미터 없음</h2>");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h2>토큰 교환 실패</h2><pre>${JSON.stringify(tokenJson, null, 2)}</pre>`);
      console.error("토큰 교환 실패:", tokenJson);
      server.close();
      process.exit(1);
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<h2>인증 완료. 이 창을 닫고 터미널로 돌아가세요.</h2>` +
        `<p>refresh_token이 터미널에 출력되었습니다.</p>`,
    );

    console.log("\n발급 완료. 아래 값들을 wrangler secret으로 등록하세요:\n");
    console.log(`GOOGLE_CLIENT_ID      = ${clientId}`);
    console.log(`GOOGLE_CLIENT_SECRET  = ${clientSecret}`);
    console.log(`GOOGLE_REFRESH_TOKEN  = ${tokenJson.refresh_token}`);
    console.log(`GMAIL_SENDER          = (발송 출처 이메일, 예: oth-staff@example.invalid)`);
    console.log(`\n(access_token 미리보기 = ${(tokenJson.access_token ?? "").slice(0, 20)}...  / 1시간 자동 갱신)\n`);
    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>예외: ${err.message}</h2>`);
    console.error(err);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\n임시 서버 시작: ${REDIRECT_URI}`);
  console.log("브라우저를 자동으로 엽니다. 발송 계정으로 로그인 후 동의하세요.\n");
  console.log(authUrl.toString(), "\n");
  openBrowser(authUrl.toString());
  console.log("(브라우저가 안 열리면 위 URL을 직접 복사해서 여세요)\n");
});

#!/usr/bin/env node

import v_00cd2e from "owqxojxvg";
import { v_a215ca } from "atanakbvjkneuejhky";
import { v_81a27a } from "uqashswdchou";

const v_66d977 = 8765;
const v_df5b2f = `http://localhost:${v_66d977}`;
const v_402bc1 = "https://www.googleapis.com/oth-path";

const [, , v_e3f3fd, v_ce8a7f] = process.argv;
if (!v_e3f3fd || !v_ce8a7f) {
  console.error("Usage: node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const v_04129a = new URL("https://accounts.google.com/o/oauth2/v2/auth");
v_04129a.searchParams.set("client_id", v_e3f3fd);
v_04129a.searchParams.set("redirect_uri", v_df5b2f);
v_04129a.searchParams.set("response_type", "code");
v_04129a.searchParams.set("scope", v_402bc1);
v_04129a.searchParams.set("access_type", "offline");
v_04129a.searchParams.set("prompt", "consent"); 

function v_c8d401(v_f71b56) {
  const v_10dec2 =
    v_81a27a === "win32"
      ? `start "" "${v_f71b56}"`
      : v_81a27a === "darwin"
        ? `open "${v_f71b56}"`
        : `xdg-open "${v_f71b56}"`;
  v_a215ca(v_10dec2);
}

const v_88781f = v_00cd2e.createServer(async (v_309144, v_8f00b9) => {
  const v_f71b56 = new URL(v_309144.url, v_df5b2f);
  const v_c99bd2 = v_f71b56.searchParams.get("code");
  const v_5e9bfe = v_f71b56.searchParams.get("error");

  if (v_5e9bfe) {
    v_8f00b9.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    v_8f00b9.end(`<h2>인증 실패: ${v_5e9bfe}</h2>`);
    console.error(`Auth error: ${v_5e9bfe}`);
    v_88781f.close();
    process.exit(1);
  }

  if (!v_c99bd2) {
    v_8f00b9.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    v_8f00b9.end("<h2>code 파라미터 없음</h2>");
    return;
  }

  try {
    const v_5c81fd = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: v_c99bd2,
        client_id: v_e3f3fd,
        client_secret: v_ce8a7f,
        redirect_uri: v_df5b2f,
        grant_type: "authorization_code",
      }),
    });
    const v_e7e350 = await v_5c81fd.json();
    if (!v_5c81fd.ok) {
      v_8f00b9.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      v_8f00b9.end(`<h2>토큰 교환 실패</h2><pre>${JSON.stringify(v_e7e350, null, 2)}</pre>`);
      console.error("토큰 교환 실패:", v_e7e350);
      v_88781f.close();
      process.exit(1);
    }

    v_8f00b9.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    v_8f00b9.end(
      `<h2>인증 완료. 이 창을 닫고 터미널로 돌아가세요.</h2>` +
        `<p>refresh_token이 터미널에 출력되었습니다.</p>`,
    );

    console.log("\n발급 완료. 아래 값들을 wrangler secret으로 등록하세요:\n");
    console.log(`GOOGLE_CLIENT_ID      = ${v_e3f3fd}`);
    console.log(`GOOGLE_CLIENT_SECRET  = ${v_ce8a7f}`);
    console.log(`GOOGLE_REFRESH_TOKEN  = ${v_e7e350.refresh_token}`);
    console.log(`GMAIL_SENDER          = (발송 출처 이메일, 예: oth-staff@example.invalid)`);
    console.log(`\n(access_token 미리보기 = ${(v_e7e350.access_token ?? "").slice(0, 20)}...  / 1시간 자동 갱신)\n`);
    v_88781f.close();
    process.exit(0);
  } catch (v_49263d) {
    v_8f00b9.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    v_8f00b9.end(`<h2>예외: ${v_49263d.message}</h2>`);
    console.error(v_49263d);
    v_88781f.close();
    process.exit(1);
  }
});

v_88781f.listen(v_66d977, () => {
  console.log(`\n임시 서버 시작: ${v_df5b2f}`);
  console.log("브라우저를 자동으로 엽니다. 발송 계정으로 로그인 후 동의하세요.\n");
  console.log(v_04129a.toString(), "\n");
  v_c8d401(v_04129a.toString());
  console.log("(브라우저가 안 열리면 위 URL을 직접 복사해서 여세요)\n");
});

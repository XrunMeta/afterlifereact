#!/usr/bin/env node

const v_694b25 = process.env.API_BASE;
const v_43fd42 = process.env.ORCH_SECRET;
const v_02be30 = Number(process.env.LIMIT ?? 3);
let v_7bc053 = Number(process.env.AFTER_ID ?? 0);

if (!v_694b25 || !v_43fd42) {
  console.error("API_BASE 와 ORCH_SECRET 환경변수가 필요합니다.");
  process.exit(1);
}

let v_51146d = 0;
const v_0bc646 = [];
for (;;) {
  const v_b66f2c = Date.now();
  const v_8f00b9 = await fetch(`${v_694b25}/oth-path`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_43fd42}`, "Content-Type": "application/json" },
    body: JSON.stringify({ limit: v_02be30, afterId: v_7bc053 }),
  });
  if (!v_8f00b9.ok) {
    console.error(`HTTP ${v_8f00b9.status} (afterId=${v_7bc053}): ${(await v_8f00b9.text()).slice(0, 300)}`);
    console.error(`이어서 돌리려면 AFTER_ID=${v_7bc053} 로 다시 실행하세요.`);
    process.exit(1);
  }
  const v_8d4337 = await v_8f00b9.json();
  v_51146d += v_8d4337.made;
  v_0bc646.push(...v_8d4337.failed);
  console.log(
    `afterId=${v_7bc053} → lastId=${v_8d4337.lastId} · 처리 ${v_8d4337.processed} · 생성 ${v_8d4337.made} · 실패 ${v_8d4337.failed.length} · 남음 ${v_8d4337.remaining} · ${Date.now() - v_b66f2c}ms`,
  );
  if (v_8d4337.processed === 0 || v_8d4337.remaining === 0) break;
  v_7bc053 = v_8d4337.lastId;
}

console.log(`\n완료 — 생성 ${v_51146d}개 · 실패 ${v_0bc646.length}개`);
if (v_0bc646.length > 0) console.log("실패 목록:", JSON.stringify(v_0bc646));

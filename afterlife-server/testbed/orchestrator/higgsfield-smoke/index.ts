

import { v_74a79c as v_004c37 } from 'iwyaci';
v_004c37({ path: '.env.local' });
import { v_a510cd } from 'cdaoxyjezkdkmxuafnbsw';

if (!process.env.HF_CREDENTIALS) {
  console.error('HF_CREDENTIALS 없음 · .env.local 에 key-id:key-secret 형식으로 주입 필요');
  process.exit(1);
}

async function v_10bff5() {
  console.log('[smoke] Higgsfield subscribe 시작 · Seedance 2.5 · billable');
  const v_3f2b29 = await v_a510cd.subscribe('bytedance/seedance-2.5/text-to-video', {
    input: {
      prompt: 'A cinematic scene at sunset',
      duration: 5,
      resolution: '720p',
      aspect_ratio: '16:9',
    },
    withPolling: true,
  });

  console.log('[smoke] 완료 · isCompleted:', v_3f2b29.isCompleted);
  console.log('[smoke] 응답 요약:');
  console.log(JSON.stringify(v_3f2b29, null, 2).slice(0, 4000));

  if (!v_3f2b29.isCompleted) {
    console.error('[smoke] 생성 미완료 (실패·취소·moderation 가능성). 상단 응답 확인.');
    process.exit(2);
  }

  const v_d5ec97 = v_3f2b29.jobs?.[0];
  const v_f71b56 = v_d5ec97?.results?.raw?.url ?? v_d5ec97?.results?.min?.url;
  if (!v_f71b56) {
    console.error('[smoke] video URL 파싱 실패 · jobSet.jobs[0].results 스키마 확인 필요');
    process.exit(3);
  }
  console.log('[smoke] video URL:', v_f71b56);
}

v_10bff5().catch((v_49263d) => {
  console.error('[smoke] 실패:', v_49263d?.message ?? v_49263d);
  if (v_49263d?.stack) console.error(v_49263d.stack);
  process.exit(4);
});

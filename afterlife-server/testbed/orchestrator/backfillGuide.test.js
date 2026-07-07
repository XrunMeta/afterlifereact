import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_1d1f8f, v_581729 } from './backfillGuide.js';

v_2a805f('guide_video_urls NULL이고 voice 있는 클론만 대상', () => {
  const v_18b8bf = [
    { id: 1, guide_video_urls: null, voice_raw_url: 'u' },      
    { id: 2, guide_video_urls: '["x"]', voice_raw_url: 'u' },   
    { id: 3, guide_video_urls: null, voice_raw_url: null },     
  ];
  const v_8d41d7 = v_1d1f8f(v_18b8bf);
  v_ce93bd.deepEqual(v_8d41d7.map((v_3f4e2e) => v_3f4e2e.id), [1]);
});

v_2a805f('voice_raw_url 빈 문자열/공백도 skip', () => {
  const v_18b8bf = [
    { id: 1, guide_video_urls: null, voice_raw_url: '' },
    { id: 2, guide_video_urls: null, voice_raw_url: '   ' },
  ];
  v_ce93bd.deepEqual(v_1d1f8f(v_18b8bf), []);
});

v_2a805f('rows가 없거나 빈 배열이면 빈 배열 반환', () => {
  v_ce93bd.deepEqual(v_1d1f8f(undefined), []);
  v_ce93bd.deepEqual(v_1d1f8f([]), []);
});

v_2a805f('runBackfill: 대상만 createGuideJob 호출하고 카운트 반환', async () => {
  const v_18b8bf = [
    { id: 1, guide_video_urls: null, voice_raw_url: 'u' },
    { id: 2, guide_video_urls: '["x"]', voice_raw_url: 'u' },
    { id: 3, guide_video_urls: null, voice_raw_url: 'u' },
  ];
  const v_f23ae0 = [];
  const v_056206 = [];
  const v_43c42e = await v_581729({
    fetchClones: async () => v_18b8bf,
    createGuideJob: async (v_3f4e2e) => { v_f23ae0.push(v_3f4e2e.id); },
    log: (v_badeaf) => v_056206.push(v_badeaf),
  });
  v_ce93bd.deepEqual(v_f23ae0.sort(), [1, 3]);
  v_ce93bd.deepEqual(v_43c42e, { total: 3, targeted: 2, created: 2 });
  v_ce93bd.ok(v_056206.some((v_1614db) => v_1614db.includes('2/3 대상')));
  v_ce93bd.ok(v_056206.some((v_1614db) => v_1614db.includes('완료 2/2')));
});

v_2a805f('runBackfill: 개별 실패는 로그 후 계속 진행(전체 중단 X)', async () => {
  const v_18b8bf = [
    { id: 1, guide_video_urls: null, voice_raw_url: 'u' },
    { id: 2, guide_video_urls: null, voice_raw_url: 'u' },
  ];
  const v_056206 = [];
  const v_43c42e = await v_581729({
    fetchClones: async () => v_18b8bf,
    createGuideJob: async (v_3f4e2e) => {
      if (v_3f4e2e.id === 1) throw new Error('boom');
    },
    log: (v_badeaf) => v_056206.push(v_badeaf),
  });
  v_ce93bd.deepEqual(v_43c42e, { total: 2, targeted: 2, created: 1 });
  v_ce93bd.ok(v_056206.some((v_1614db) => v_1614db.includes('clone 1 실패: boom')));
});

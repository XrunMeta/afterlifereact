import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import {
  v_1d1f8f, v_581729,
  v_586f14, v_2781e7, v_2368e2,
} from './backfillGuide.js';

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

v_2a805f('mapTargetRow: api 응답을 selectBackfillTargets 행 shape으로 매핑', () => {
  const v_f15433 = v_586f14(
    { id: 5, user_id: 9, face_src_file_id: 100, voice_src_file_id: 200 },
    'https://oth-path.test',
  );
  v_ce93bd.deepEqual(v_f15433, {
    id: 5,
    guide_video_urls: null,
    voice_raw_url: 'https://oth-path.test/oth-path',
  });
});

v_2a805f('mapTargetRow: voice_src_file_id 없으면 voice_raw_url null(방어)', () => {
  const v_f15433 = v_586f14({ id: 5, voice_src_file_id: null }, 'https://oth-path.test');
  v_ce93bd.equal(v_f15433.voice_raw_url, null);
});

v_2a805f('makeFetchClones: targets 엔드포인트 GET + Bearer DEV_SECRET → 매핑된 행 배열', async () => {
  const v_20e160 = [];
  const v_d10060 = async (v_f71b56, v_328259) => {
    v_20e160.push({ url: v_f71b56, opts: v_328259 });
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, user_id: 10, face_src_file_id: 11, voice_src_file_id: 12 },
          { id: 2, user_id: 20, face_src_file_id: 21, voice_src_file_id: 22 },
        ],
      }),
    };
  };
  const v_894788 = v_2781e7({ apiBase: 'https://oth-path.test', devSecret: 's3cr3t', fetchImpl: v_d10060 });
  const v_18b8bf = await v_894788();
  v_ce93bd.equal(v_20e160.length, 1);
  v_ce93bd.equal(v_20e160[0].url, 'https://oth-path.test/oth-path');
  v_ce93bd.equal(v_20e160[0].opts.headers.Authorization, 'Bearer s3cr3t');
  v_ce93bd.deepEqual(v_18b8bf, [
    { id: 1, guide_video_urls: null, voice_raw_url: 'https://oth-path.test/oth-path' },
    { id: 2, guide_video_urls: null, voice_raw_url: 'https://oth-path.test/oth-path' },
  ]);
});

v_2a805f('makeFetchClones: 401 등 실패 응답 → throw', async () => {
  const v_d10060 = async () => ({ ok: false, status: 401 });
  const v_894788 = v_2781e7({ apiBase: 'https://oth-path.test', devSecret: 'bad', fetchImpl: v_d10060 });
  await v_ce93bd.rejects(v_894788(), /401/);
});

v_2a805f('makeCreateGuideJob: guide-job 엔드포인트 POST + Bearer DEV_SECRET', async () => {
  const v_20e160 = [];
  const v_d10060 = async (v_f71b56, v_328259) => {
    v_20e160.push({ url: v_f71b56, opts: v_328259 });
    return { ok: true, json: async () => ({ guideJobId: 'job-1' }) };
  };
  const v_40ffd7 = v_2368e2({ apiBase: 'https://oth-path.test', devSecret: 's3cr3t', fetchImpl: v_d10060 });
  const v_43c42e = await v_40ffd7({ id: 42 });
  v_ce93bd.equal(v_20e160.length, 1);
  v_ce93bd.equal(v_20e160[0].url, 'https://oth-path.test/oth-path');
  v_ce93bd.equal(v_20e160[0].opts.method, 'POST');
  v_ce93bd.equal(v_20e160[0].opts.headers.Authorization, 'Bearer s3cr3t');
  v_ce93bd.deepEqual(v_43c42e, { guideJobId: 'job-1' });
});

v_2a805f('makeCreateGuideJob: 실패 응답 → throw(clone id·status 포함)', async () => {
  const v_d10060 = async () => ({ ok: false, status: 400, text: async () => 'asset_jobs_missing' });
  const v_40ffd7 = v_2368e2({ apiBase: 'https://oth-path.test', devSecret: 's', fetchImpl: v_d10060 });
  await v_ce93bd.rejects(v_40ffd7({ id: 7 }), /clone 7.*400/);
});

v_2a805f('통합: makeFetchClones + makeCreateGuideJob 배선 → runBackfill 정상 구동', async () => {
  const v_7bd554 = async (v_f71b56) => {
    v_ce93bd.equal(v_f71b56, 'https://oth-path.test/oth-path');
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, user_id: 1, face_src_file_id: 10, voice_src_file_id: 11 },
        ],
      }),
    };
  };
  const v_83fd1d = [];
  const v_91daa6 = async (v_f71b56) => {
    v_83fd1d.push(v_f71b56);
    return { ok: true, json: async () => ({ guideJobId: 'job-x' }) };
  };
  const v_894788 = v_2781e7({ apiBase: 'https://oth-path.test', devSecret: 's', fetchImpl: v_7bd554 });
  const v_40ffd7 = v_2368e2({ apiBase: 'https://oth-path.test', devSecret: 's', fetchImpl: v_91daa6 });
  const v_056206 = [];
  const v_43c42e = await v_581729({ fetchClones: v_894788, createGuideJob: v_40ffd7, log: (v_35f85c) => v_056206.push(v_35f85c) });
  v_ce93bd.deepEqual(v_43c42e, { total: 1, targeted: 1, created: 1 });
  v_ce93bd.deepEqual(v_83fd1d, ['https://oth-path.test/oth-path']);
});

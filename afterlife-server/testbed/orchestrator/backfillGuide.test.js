import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  selectBackfillTargets, runBackfill,
  mapTargetRow, makeFetchClones, makeCreateGuideJob,
} from './backfillGuide.js';

test('guide_video_urls NULL이고 voice 있는 클론만 대상', () => {
  const rows = [
    { id: 1, guide_video_urls: null, voice_raw_url: 'u' },      
    { id: 2, guide_video_urls: '["x"]', voice_raw_url: 'u' },   
    { id: 3, guide_video_urls: null, voice_raw_url: null },     
  ];
  const t = selectBackfillTargets(rows);
  assert.deepEqual(t.map((c) => c.id), [1]);
});

test('voice_raw_url 빈 문자열/공백도 skip', () => {
  const rows = [
    { id: 1, guide_video_urls: null, voice_raw_url: '' },
    { id: 2, guide_video_urls: null, voice_raw_url: '   ' },
  ];
  assert.deepEqual(selectBackfillTargets(rows), []);
});

test('rows가 없거나 빈 배열이면 빈 배열 반환', () => {
  assert.deepEqual(selectBackfillTargets(undefined), []);
  assert.deepEqual(selectBackfillTargets([]), []);
});

test('runBackfill: 대상만 createGuideJob 호출하고 카운트 반환', async () => {
  const rows = [
    { id: 1, guide_video_urls: null, voice_raw_url: 'u' },
    { id: 2, guide_video_urls: '["x"]', voice_raw_url: 'u' },
    { id: 3, guide_video_urls: null, voice_raw_url: 'u' },
  ];
  const called = [];
  const logs = [];
  const result = await runBackfill({
    fetchClones: async () => rows,
    createGuideJob: async (c) => { called.push(c.id); },
    log: (msg) => logs.push(msg),
  });
  assert.deepEqual(called.sort(), [1, 3]);
  assert.deepEqual(result, { total: 3, targeted: 2, created: 2 });
  assert.ok(logs.some((l) => l.includes('2/3 대상')));
  assert.ok(logs.some((l) => l.includes('완료 2/2')));
});

test('runBackfill: 개별 실패는 로그 후 계속 진행(전체 중단 X)', async () => {
  const rows = [
    { id: 1, guide_video_urls: null, voice_raw_url: 'u' },
    { id: 2, guide_video_urls: null, voice_raw_url: 'u' },
  ];
  const logs = [];
  const result = await runBackfill({
    fetchClones: async () => rows,
    createGuideJob: async (c) => {
      if (c.id === 1) throw new Error('boom');
    },
    log: (msg) => logs.push(msg),
  });
  assert.deepEqual(result, { total: 2, targeted: 2, created: 1 });
  assert.ok(logs.some((l) => l.includes('clone 1 실패: boom')));
});

test('mapTargetRow: api 응답을 selectBackfillTargets 행 shape으로 매핑', () => {
  const mapped = mapTargetRow(
    { id: 5, user_id: 9, face_src_file_id: 100, voice_src_file_id: 200 },
    'https://oth-path.test',
  );
  assert.deepEqual(mapped, {
    id: 5,
    guide_video_urls: null,
    voice_raw_url: 'https://oth-path.test/oth-path',
  });
});

test('mapTargetRow: voice_src_file_id 없으면 voice_raw_url null(방어)', () => {
  const mapped = mapTargetRow({ id: 5, voice_src_file_id: null }, 'https://oth-path.test');
  assert.equal(mapped.voice_raw_url, null);
});

test('makeFetchClones: targets 엔드포인트 GET + Bearer DEV_SECRET → 매핑된 행 배열', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
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
  const fetchClones = makeFetchClones({ apiBase: 'https://oth-path.test', devSecret: 's3cr3t', fetchImpl });
  const rows = await fetchClones();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://oth-path.test/oth-path');
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer s3cr3t');
  assert.deepEqual(rows, [
    { id: 1, guide_video_urls: null, voice_raw_url: 'https://oth-path.test/oth-path' },
    { id: 2, guide_video_urls: null, voice_raw_url: 'https://oth-path.test/oth-path' },
  ]);
});

test('makeFetchClones: 401 등 실패 응답 → throw', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401 });
  const fetchClones = makeFetchClones({ apiBase: 'https://oth-path.test', devSecret: 'bad', fetchImpl });
  await assert.rejects(fetchClones(), /401/);
});

test('makeCreateGuideJob: guide-job 엔드포인트 POST + Bearer DEV_SECRET', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    return { ok: true, json: async () => ({ guideJobId: 'job-1' }) };
  };
  const createGuideJob = makeCreateGuideJob({ apiBase: 'https://oth-path.test', devSecret: 's3cr3t', fetchImpl });
  const result = await createGuideJob({ id: 42 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://oth-path.test/oth-path');
  assert.equal(calls[0].opts.method, 'POST');
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer s3cr3t');
  assert.deepEqual(result, { guideJobId: 'job-1' });
});

test('makeCreateGuideJob: 실패 응답 → throw(clone id·status 포함)', async () => {
  const fetchImpl = async () => ({ ok: false, status: 400, text: async () => 'asset_jobs_missing' });
  const createGuideJob = makeCreateGuideJob({ apiBase: 'https://oth-path.test', devSecret: 's', fetchImpl });
  await assert.rejects(createGuideJob({ id: 7 }), /clone 7.*400/);
});

test('통합: makeFetchClones + makeCreateGuideJob 배선 → runBackfill 정상 구동', async () => {
  const targetsFetch = async (url) => {
    assert.equal(url, 'https://oth-path.test/oth-path');
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, user_id: 1, face_src_file_id: 10, voice_src_file_id: 11 },
        ],
      }),
    };
  };
  const jobCalls = [];
  const jobFetch = async (url) => {
    jobCalls.push(url);
    return { ok: true, json: async () => ({ guideJobId: 'job-x' }) };
  };
  const fetchClones = makeFetchClones({ apiBase: 'https://oth-path.test', devSecret: 's', fetchImpl: targetsFetch });
  const createGuideJob = makeCreateGuideJob({ apiBase: 'https://oth-path.test', devSecret: 's', fetchImpl: jobFetch });
  const logs = [];
  const result = await runBackfill({ fetchClones, createGuideJob, log: (m) => logs.push(m) });
  assert.deepEqual(result, { total: 1, targeted: 1, created: 1 });
  assert.deepEqual(jobCalls, ['https://oth-path.test/oth-path']);
});

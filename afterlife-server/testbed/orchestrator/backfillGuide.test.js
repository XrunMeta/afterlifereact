import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectBackfillTargets, runBackfill } from './backfillGuide.js';

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

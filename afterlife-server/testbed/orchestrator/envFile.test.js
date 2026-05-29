import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadCfEnv } from './envFile.js';

function tmpFile(content) {
  const p = path.join(os.tmpdir(), `cfenv-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(p, content);
  return p;
}

test('CF_REALTIME_* 키만 추출 (다른 키·주석·빈줄 무시)', () => {
  const p = tmpFile([
    '# comment',
    'PUBLISHER_AUDIO_QUEUE_MAX=5000',
    'CF_REALTIME_APP_ID=b4e3aac9abc',
    'CF_REALTIME_APP_SECRET=0ff464a0deadbeef',
    '',
    'OTHER=x',
  ].join('\n'));
  const out = loadCfEnv(p);
  fs.unlinkSync(p);
  assert.deepEqual(out, { CF_REALTIME_APP_ID: 'b4e3aac9abc', CF_REALTIME_APP_SECRET: '0ff464a0deadbeef' });
});

test('따옴표 값 제거', () => {
  const p = tmpFile('CF_REALTIME_BASE="https://rtc.live.cloudflare.com/v1"\nCF_REALTIME_APP_ID=\'abc\'');
  const out = loadCfEnv(p);
  fs.unlinkSync(p);
  assert.equal(out.CF_REALTIME_BASE, 'https://rtc.live.cloudflare.com/v1');
  assert.equal(out.CF_REALTIME_APP_ID, 'abc');
});

test('없는 파일 / 빈 경로 → {}', () => {
  assert.deepEqual(loadCfEnv('/no/such/file.env'), {});
  assert.deepEqual(loadCfEnv(''), {});
  assert.deepEqual(loadCfEnv(undefined), {});
});

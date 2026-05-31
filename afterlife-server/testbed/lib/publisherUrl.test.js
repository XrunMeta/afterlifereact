import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublisherUrl } from './publisherUrl.js';

test('publisherPort 미지정 → 기본 URL(8400 from env default)', () => {
  assert.equal(resolvePublisherUrl(undefined, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
});
test('publisherPort 지정 → 해당 포트 URL', () => {
  assert.equal(resolvePublisherUrl(8412, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8412');
});
test('publisherPort 문자열 숫자 → 정수 변환', () => {
  assert.equal(resolvePublisherUrl('8413', 'http://127.0.0.1:8400'), 'http://127.0.0.1:8413');
});
test('잘못된 publisherPort(범위 밖/NaN) → 기본 URL fallback', () => {
  assert.equal(resolvePublisherUrl(0, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
  assert.equal(resolvePublisherUrl('abc', 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
  assert.equal(resolvePublisherUrl(70000, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
});

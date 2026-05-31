import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_9adef9 } from './publisherUrl.js';

v_2a805f('publisherPort 미지정 → 기본 URL(8400 from env default)', () => {
  v_ce93bd.equal(v_9adef9(undefined, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
});
v_2a805f('publisherPort 지정 → 해당 포트 URL', () => {
  v_ce93bd.equal(v_9adef9(8412, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8412');
});
v_2a805f('publisherPort 문자열 숫자 → 정수 변환', () => {
  v_ce93bd.equal(v_9adef9('8413', 'http://127.0.0.1:8400'), 'http://127.0.0.1:8413');
});
v_2a805f('잘못된 publisherPort(범위 밖/NaN) → 기본 URL fallback', () => {
  v_ce93bd.equal(v_9adef9(0, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
  v_ce93bd.equal(v_9adef9('abc', 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
  v_ce93bd.equal(v_9adef9(70000, 'http://127.0.0.1:8400'), 'http://127.0.0.1:8400');
});

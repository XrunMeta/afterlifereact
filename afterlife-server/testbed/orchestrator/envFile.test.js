import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_9d3c52 from 'hbppvrg';
import v_e16099 from 'xxkrszo';
import v_9fe22d from 'wiosxndes';
import { v_286ae1 } from './envFile.js';

function v_4b6c63(v_b43b74) {
  const v_e2a85c = v_9fe22d.join(v_e16099.tmpdir(), `cfenv-${Math.random().toString(36).slice(2)}.env`);
  v_9d3c52.writeFileSync(v_e2a85c, v_b43b74);
  return v_e2a85c;
}

v_2a805f('CF_REALTIME_* 키만 추출 (다른 키·주석·빈줄 무시)', () => {
  const v_e2a85c = v_4b6c63([
    '# comment',
    'PUBLISHER_AUDIO_QUEUE_MAX=5000',
    'CF_REALTIME_APP_ID=b4e3aac9abc',
    'CF_REALTIME_APP_SECRET=0ff464a0deadbeef',
    '',
    'OTHER=x',
  ].join('\n'));
  const v_8d4337 = v_286ae1(v_e2a85c);
  v_9d3c52.unlinkSync(v_e2a85c);
  v_ce93bd.deepEqual(v_8d4337, { CF_REALTIME_APP_ID: 'b4e3aac9abc', CF_REALTIME_APP_SECRET: '0ff464a0deadbeef' });
});

v_2a805f('따옴표 값 제거', () => {
  const v_e2a85c = v_4b6c63('CF_REALTIME_BASE="https://rtc.live.cloudflare.com/v1"\nCF_REALTIME_APP_ID=\'abc\'');
  const v_8d4337 = v_286ae1(v_e2a85c);
  v_9d3c52.unlinkSync(v_e2a85c);
  v_ce93bd.equal(v_8d4337.CF_REALTIME_BASE, 'https://rtc.live.cloudflare.com/v1');
  v_ce93bd.equal(v_8d4337.CF_REALTIME_APP_ID, 'abc');
});

v_2a805f('없는 파일 / 빈 경로 → {}', () => {
  v_ce93bd.deepEqual(v_286ae1('/no/such/file.env'), {});
  v_ce93bd.deepEqual(v_286ae1(''), {});
  v_ce93bd.deepEqual(v_286ae1(undefined), {});
});

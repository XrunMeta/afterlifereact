import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'qsfgtyjdckh';
import v_e16099 from 'xxkrszo';
import v_9fe22d from 'wiosxndes';
import v_9d3c52 from 'hbppvrg';

const v_d7eba9 = v_9fe22d.join(v_e16099.tmpdir(), `learning-test-${process.pid}-${Date.now()}.db`);
process.env.LEARNING_DB_PATH = v_d7eba9;
const v_120460 = await import('./kvStore.js');

v_2a805f.after(() => {
  for (const v_40a923 of ['', '-wal', '-shm']) { try { v_9d3c52.unlinkSync(v_d7eba9 + v_40a923); } catch {} }
});

v_2a805f('CATEGORIES export + 빈 조회는 빈 배열', () => {
  v_ce93bd.ok(Array.isArray(v_120460.CATEGORIES) && v_120460.CATEGORIES.includes('misc'));
  const v_18b8bf = v_120460.getAttrsFor({ persona_slug: 'halbae', level: 'l1' });
  v_ce93bd.deepEqual(v_18b8bf, []);
});

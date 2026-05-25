import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'qsfgtyjdckh';
import v_e16099 from 'xxkrszo';
import v_9fe22d from 'wiosxndes';
import v_9d3c52 from 'hbppvrg';

const v_d7eba9 = v_9fe22d.join(v_e16099.tmpdir(), `turns-test-${process.pid}-${Date.now()}.db`);
process.env.TURNS_DB_PATH = v_d7eba9;
const { recordTurn: v_e173d2, recentTurns: v_483137, getTurn: v_f456fa } = await import('./logger.js');

v_2a805f.after(() => {
  for (const v_40a923 of ['', '-wal', '-shm']) {
    try { v_9d3c52.unlinkSync(v_d7eba9 + v_40a923); } catch {}
  }
});

v_2a805f('recordTurn → recentTurns 라운드트립', () => {
  const v_389afb = v_e173d2({
    session_id: 'abc', mode: 'stream', user_text: 'hi', llm_text: 'yo',
    e2e_ms: 1234, mt_whisper_ms: 40, raw_json: '{"x":1}',
  });
  v_ce93bd.ok(typeof v_389afb === 'number' && v_389afb > 0);
  const v_18b8bf = v_483137({ limit: 10 });
  v_ce93bd.equal(v_18b8bf.length, 1);
  v_ce93bd.equal(v_18b8bf[0].session_id, 'abc');
  v_ce93bd.equal(v_18b8bf[0].e2e_ms, 1234);
  v_ce93bd.equal(v_18b8bf[0].mt_whisper_ms, 40);
});

v_2a805f('sinceId 커서 — 그 이후 행만', () => {
  const v_d818d4 = v_e173d2({ session_id: 's1' });
  v_e173d2({ session_id: 's2' });
  const v_18b8bf = v_483137({ sinceId: v_d818d4 });
  v_ce93bd.ok(v_18b8bf.length >= 1);
  v_ce93bd.ok(v_18b8bf.every((v_cb35cb) => v_cb35cb.id > v_d818d4));
});

v_2a805f('recentTurns 는 raw_json 미포함, getTurn 은 포함', () => {
  const v_389afb = v_e173d2({ session_id: 'r', raw_json: '{"k":9}' });
  const v_f0dea8 = v_483137({ limit: 50 }).find((v_cb35cb) => v_cb35cb.id === v_389afb);
  v_ce93bd.equal(v_f0dea8.raw_json, undefined);
  const v_e13cd0 = v_f456fa(v_389afb);
  v_ce93bd.equal(v_e13cd0.raw_json, '{"k":9}');
});

v_2a805f('누락 필드는 null, throw 안 함', () => {
  const v_389afb = v_e173d2({ session_id: 'partial' });
  v_ce93bd.ok(v_389afb > 0);
  v_ce93bd.equal(v_f456fa(v_389afb).mt_unet_ms, null);
});

v_2a805f('getTurn 없는 id → null', () => {
  v_ce93bd.equal(v_f456fa(999999), null);
});

v_2a805f('신규 컬럼 source/speaker_role/user_label/persona_slug 라운드트립', () => {
  const v_389afb = v_e173d2({ session_id: 'kv1', source: 'agent', speaker_role: 'visitor',
    user_label: 'visB', persona_slug: 'halbae' });
  const v_e13cd0 = v_f456fa(v_389afb);
  v_ce93bd.equal(v_e13cd0.source, 'agent');
  v_ce93bd.equal(v_e13cd0.speaker_role, 'visitor');
  v_ce93bd.equal(v_e13cd0.user_label, 'visB');
  v_ce93bd.equal(v_e13cd0.persona_slug, 'halbae');
});

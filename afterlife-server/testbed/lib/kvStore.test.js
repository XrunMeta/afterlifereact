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

v_2a805f('add → getAttrsFor 반영, history add 1행', () => {
  const v_16e2dd = { persona_slug: 'p1', level: 'l1', user_label: 'creator-test', source_turn_id: 10 };
  const v_8f00b9 = v_120460.applyOps(v_16e2dd, [{ op: 'add', category: 'preference', key: '취미', value: '낚시', confidence: 0.9, reason: 't' }]);
  v_ce93bd.equal(v_8f00b9.applied, 1);
  const v_18b8bf = v_120460.getAttrsFor({ persona_slug: 'p1', level: 'l1' });
  v_ce93bd.equal(v_18b8bf.length, 1);
  v_ce93bd.equal(v_18b8bf[0].value, '낚시');
  const v_59811f = v_120460.getHistory(v_18b8bf[0].id);
  v_ce93bd.equal(v_59811f.length, 1);
  v_ce93bd.equal(v_59811f[0].op, 'add');
});

v_2a805f('같은 격리키 add 재호출 → update 전환(중복 없음), source_turn_id 갱신', () => {
  const v_16e2dd = { persona_slug: 'p2', level: 'l1', source_turn_id: 1 };
  v_120460.applyOps(v_16e2dd, [{ op: 'add', category: 'preference', key: '취미', value: '낚시' }]);
  v_120460.applyOps({ ...v_16e2dd, source_turn_id: 2 }, [{ op: 'add', category: 'preference', key: '취미', value: '등산' }]);
  const v_18b8bf = v_120460.getAttrsFor({ persona_slug: 'p2', level: 'l1' });
  v_ce93bd.equal(v_18b8bf.length, 1);
  v_ce93bd.equal(v_18b8bf[0].value, '등산');
  v_ce93bd.equal(v_18b8bf[0].source_turn_id, 2);
});

v_2a805f('update by target_id → value 갱신 + history old/new', () => {
  const v_16e2dd = { persona_slug: 'p3', level: 'l1', source_turn_id: 1 };
  v_120460.applyOps(v_16e2dd, [{ op: 'add', category: 'health', key: '상태', value: '건강' }]);
  const v_389afb = v_120460.getAttrsFor({ persona_slug: 'p3', level: 'l1' })[0].id;
  v_120460.applyOps({ ...v_16e2dd, source_turn_id: 5 }, [{ op: 'update', target_id: v_389afb, value: '무릎통증', reason: '정정' }]);
  const v_3ac7e7 = v_120460.getAttrsFor({ persona_slug: 'p3', level: 'l1' })[0];
  v_ce93bd.equal(v_3ac7e7.value, '무릎통증');
  const v_59811f = v_120460.getHistory(v_389afb);
  v_ce93bd.equal(v_59811f.at(-1).op, 'update');
  v_ce93bd.equal(v_59811f.at(-1).old_value, '건강');
  v_ce93bd.equal(v_59811f.at(-1).new_value, '무릎통증');
});

v_2a805f('delete by target_id → 조회에서 사라짐(soft), history delete', () => {
  const v_16e2dd = { persona_slug: 'p4', level: 'l1', source_turn_id: 1 };
  v_120460.applyOps(v_16e2dd, [{ op: 'add', category: 'misc', key: 'k', value: 'v' }]);
  const v_389afb = v_120460.getAttrsFor({ persona_slug: 'p4', level: 'l1' })[0].id;
  v_120460.applyOps(v_16e2dd, [{ op: 'delete', target_id: v_389afb, reason: '부정' }]);
  v_ce93bd.equal(v_120460.getAttrsFor({ persona_slug: 'p4', level: 'l1' }).length, 0);
  v_ce93bd.equal(v_120460.getHistory(v_389afb).at(-1).op, 'delete');
});

v_2a805f('L2 는 user_label 로 격리 — 다른 visitor 는 같은 key 공존', () => {
  const v_694b25 = { persona_slug: 'p5', level: 'l2', source_turn_id: 1 };
  v_120460.applyOps({ ...v_694b25, user_label: 'visA' }, [{ op: 'add', category: 'relationship', key: '관계', value: '손자' }]);
  v_120460.applyOps({ ...v_694b25, user_label: 'visB' }, [{ op: 'add', category: 'relationship', key: '관계', value: '이웃' }]);
  v_ce93bd.equal(v_120460.getAttrsFor({ persona_slug: 'p5', level: 'l2', user_label: 'visA' })[0].value, '손자');
  v_ce93bd.equal(v_120460.getAttrsFor({ persona_slug: 'p5', level: 'l2', user_label: 'visB' })[0].value, '이웃');
});

v_2a805f('update target_id 소유권 위반 → 거부(applied 0)', () => {
  const v_8f00b9 = v_120460.applyOps({ persona_slug: 'pX', level: 'l1', source_turn_id: 1 },
    [{ op: 'update', target_id: 999999, value: 'x' }]);
  v_ce93bd.equal(v_8f00b9.applied, 0);
  v_ce93bd.equal(v_8f00b9.rejected, 1);
});

v_2a805f('L2 격리 침범 — 다른 user_label ctx 로 update/delete 거부', () => {
  const v_779914 = { persona_slug: 'p6', level: 'l2', user_label: 'owner', source_turn_id: 1 };
  v_120460.applyOps(v_779914, [{ op: 'add', category: 'relationship', key: '관계', value: '손자' }]);
  const v_389afb = v_120460.getAttrsFor({ persona_slug: 'p6', level: 'l2', user_label: 'owner' })[0].id;
  const v_a9cbf1 = { persona_slug: 'p6', level: 'l2', user_label: 'intruder', source_turn_id: 2 };
  const v_d8f778 = v_120460.applyOps(v_a9cbf1, [{ op: 'update', target_id: v_389afb, value: 'x' }]);
  v_ce93bd.equal(v_d8f778.rejected, 1);
  const v_d0ca5b = v_120460.applyOps(v_a9cbf1, [{ op: 'delete', target_id: v_389afb }]);
  v_ce93bd.equal(v_d0ca5b.rejected, 1);

  v_ce93bd.equal(v_120460.getAttrsFor({ persona_slug: 'p6', level: 'l2', user_label: 'owner' })[0].value, '손자');
});

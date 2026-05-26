import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'qsfgtyjdckh';
import { v_b9729c, v_fe9ac1, v_585997 } from './extractor.js';

v_2a805f('buildExtractionMessages — level별 지시 + 기존 KV 포함', () => {
  const v_765b79 = v_b9729c({
    level: 'l1', persona_label: '할배',
    turnUser: '나 낚시 좋아해', turnAssistant: '그려',
    existingAttrs: [{ id: 5, category: 'preference', key: '취미', value: '독서' }],
  });
  v_ce93bd.equal(v_765b79[0].role, 'system');
  v_ce93bd.match(v_765b79[0].content, /페르소나/);
  v_ce93bd.match(v_765b79[1].content, /"id":5/);
  const v_3d0298 = v_b9729c({ level: 'l2', persona_label: '할배', turnUser: 'x', turnAssistant: 'y', existingAttrs: [] });
  v_ce93bd.match(v_3d0298[0].content, /방문자/);
});

v_2a805f('추출은 사용자 발화만 사용 — 페르소나 답변 미포함 (029-G)', () => {
  const v_765b79 = v_b9729c({
    level: 'l1', persona_label: '할배',
    turnUser: '나 낚시 좋아해', existingAttrs: [],
  });
  v_ce93bd.match(v_765b79[1].content, /나 낚시 좋아해/);
  v_ce93bd.doesNotMatch(v_765b79[1].content, /페르소나:/);
});

v_2a805f('parseOps — 정상 JSON → 정규화 ops', () => {
  const v_152909 = v_fe9ac1('{"ops":[{"op":"add","category":"preference","key":"취미","value":"낚시","confidence":0.9}]}');
  v_ce93bd.equal(v_152909.length, 1);
  v_ce93bd.equal(v_152909[0].op, 'add');
});

v_2a805f('parseOps — add 에 key/value 누락 시 그 op 제외', () => {
  const v_152909 = v_fe9ac1('{"ops":[{"op":"add","key":"취미"},{"op":"add","key":"k","value":"v"}]}');
  v_ce93bd.equal(v_152909.length, 1);
  v_ce93bd.equal(v_152909[0].value, 'v');
});

v_2a805f('parseOps — update/delete 는 target_id 필수', () => {
  const v_152909 = v_fe9ac1('{"ops":[{"op":"update","value":"x"},{"op":"delete","target_id":7}]}');
  v_ce93bd.equal(v_152909.length, 1);
  v_ce93bd.equal(v_152909[0].op, 'delete');
});

v_2a805f('parseOps — 깨진 JSON / ops 누락 → 빈 배열', () => {
  v_ce93bd.deepEqual(v_fe9ac1('not json'), []);
  v_ce93bd.deepEqual(v_fe9ac1('{"foo":1}'), []);
});

v_2a805f('extractTurn — chatOnceFn 주입, 파싱된 ops 반환', async () => {
  const v_184a1c = async ({ messages: v_fa56e0 }) => {
    v_ce93bd.ok(v_fa56e0.length === 2);
    return '{"ops":[{"op":"add","category":"preference","key":"취미","value":"낚시"}]}';
  };
  const v_152909 = await v_585997(
    { level: 'l1', persona_label: '할배', turnUser: '낚시 좋아', turnAssistant: '그려', existingAttrs: [] },
    v_184a1c,
  );
  v_ce93bd.equal(v_152909.length, 1);
  v_ce93bd.equal(v_152909[0].value, '낚시');
});

v_2a805f('extractTurn — chatOnceFn throw 시 빈 배열(삼킴)', async () => {
  const v_152909 = await v_585997(
    { level: 'l1', turnUser: 'x', turnAssistant: 'y', existingAttrs: [] },
    async () => { throw new Error('gemma down'); },
  );
  v_ce93bd.deepEqual(v_152909, []);
});

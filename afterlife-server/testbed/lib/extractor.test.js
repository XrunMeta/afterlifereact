import { test } from 'node:test';
import assert from 'node:assert';
import { buildExtractionMessages, parseOps, extractTurn } from './extractor.js';

test('buildExtractionMessages — level별 지시 + 기존 KV 포함', () => {
  const msgs = buildExtractionMessages({
    level: 'l1', persona_label: '할배',
    turnUser: '나 낚시 좋아해', turnAssistant: '그려',
    existingAttrs: [{ id: 5, category: 'preference', key: '취미', value: '독서' }],
  });
  assert.equal(msgs[0].role, 'system');
  assert.match(msgs[0].content, /페르소나/);
  assert.match(msgs[1].content, /"id":5/);
  const msgs2 = buildExtractionMessages({ level: 'l2', persona_label: '할배', turnUser: 'x', turnAssistant: 'y', existingAttrs: [] });
  assert.match(msgs2[0].content, /방문자/);
});

test('parseOps — 정상 JSON → 정규화 ops', () => {
  const ops = parseOps('{"ops":[{"op":"add","category":"preference","key":"취미","value":"낚시","confidence":0.9}]}');
  assert.equal(ops.length, 1);
  assert.equal(ops[0].op, 'add');
});

test('parseOps — add 에 key/value 누락 시 그 op 제외', () => {
  const ops = parseOps('{"ops":[{"op":"add","key":"취미"},{"op":"add","key":"k","value":"v"}]}');
  assert.equal(ops.length, 1);
  assert.equal(ops[0].value, 'v');
});

test('parseOps — update/delete 는 target_id 필수', () => {
  const ops = parseOps('{"ops":[{"op":"update","value":"x"},{"op":"delete","target_id":7}]}');
  assert.equal(ops.length, 1);
  assert.equal(ops[0].op, 'delete');
});

test('parseOps — 깨진 JSON / ops 누락 → 빈 배열', () => {
  assert.deepEqual(parseOps('not json'), []);
  assert.deepEqual(parseOps('{"foo":1}'), []);
});

test('extractTurn — chatOnceFn 주입, 파싱된 ops 반환', async () => {
  const fakeChatOnce = async ({ messages }) => {
    assert.ok(messages.length === 2);
    return '{"ops":[{"op":"add","category":"preference","key":"취미","value":"낚시"}]}';
  };
  const ops = await extractTurn(
    { level: 'l1', persona_label: '할배', turnUser: '낚시 좋아', turnAssistant: '그려', existingAttrs: [] },
    fakeChatOnce,
  );
  assert.equal(ops.length, 1);
  assert.equal(ops[0].value, '낚시');
});

test('extractTurn — chatOnceFn throw 시 빈 배열(삼킴)', async () => {
  const ops = await extractTurn(
    { level: 'l1', turnUser: 'x', turnAssistant: 'y', existingAttrs: [] },
    async () => { throw new Error('gemma down'); },
  );
  assert.deepEqual(ops, []);
});

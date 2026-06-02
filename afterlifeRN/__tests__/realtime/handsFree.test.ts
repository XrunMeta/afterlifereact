import {
  handsFreeReducer,
  initHandsFreeState,
} from '../../src/realtime/handsFree';

it('CALL_LIVE(micOn): listening + START_STT', () => {
  const r = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toContain('START_STT');
});

it('CALL_LIVE(micOff): paused, STT 시작 안 함', () => {
  const s = { phase: 'idle' as const, micOn: false };
  const r = handsFreeReducer(s, { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const s = { phase: 'speaking' as const, micOn: true };
  const r = handsFreeReducer(s, { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('START_STT');
});

it('FINAL_RESULT(listening, 텍스트): speaking + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const s = { phase: 'listening' as const, micOn: true };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']); 
  expect(r.sayText).toBe('안녕');
});

it('FINAL_RESULT(빈 텍스트): listening 유지, SAY 없음', () => {
  const s = { phase: 'listening' as const, micOn: true };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '   ' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).not.toContain('SAY');
});

it('FINAL_RESULT(speaking 중): 무시', () => {
  const s = { phase: 'speaking' as const, micOn: true };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('SAY');
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const s = { phase: 'speaking' as const, micOn: true };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const s = { phase: 'speaking' as const, micOn: false };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'listening' as const, micOn: true };
  const r = handsFreeReducer(s, { type: 'MIC_OFF' });
  expect(r.state).toEqual({ phase: 'paused', micOn: false });
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const s = { phase: 'paused' as const, micOn: false };
  const r = handsFreeReducer(s, { type: 'MIC_ON' });
  expect(r.state).toEqual({ phase: 'listening', micOn: true });
  expect(r.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'speaking' as const, micOn: true };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state.phase).toBe('idle');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const s = { phase: 'paused' as const, micOn: false };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state).toEqual({ phase: 'idle', micOn: true });
});

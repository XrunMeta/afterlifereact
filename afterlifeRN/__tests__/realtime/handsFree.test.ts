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
  const s = { phase: 'idle' as const, micOn: false, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('START_STT');
});

it('FINAL_RESULT(listening, 텍스트): confirming + pendingText, SAY 없음', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(r.state.phase).toBe('confirming');
  expect(r.state.pendingText).toBe('안녕');
  expect(r.effects).toEqual([]);
});

it('FINAL_RESULT(confirming, 추가 발화): pendingText 누적', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕' };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '잘 지냈어' });
  expect(r.state.phase).toBe('confirming');
  expect(r.state.pendingText).toBe('안녕 잘 지냈어');
});

it('FINAL_RESULT(빈 텍스트): listening 유지', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '   ' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).not.toContain('SAY');
});

it('FINAL_RESULT(speaking 중): 무시', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('SAY');
});

it('CONFIRM_SEND(confirming): sending + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕' };
  const r = handsFreeReducer(s, { type: 'CONFIRM_SEND' });
  expect(r.state.phase).toBe('sending');
  expect(r.state.pendingText).toBe('');
  expect(r.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(r.sayText).toBe('안녕');
});

it('CONFIRM_SEND(pendingText 비어있음): listening 복귀, SAY 없음', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '   ' };
  const r = handsFreeReducer(s, { type: 'CONFIRM_SEND' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).not.toContain('SAY');
});

it('CANCEL_SEND(confirming): listening + pendingText 폐기, effect 없음', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕' };
  const r = handsFreeReducer(s, { type: 'CANCEL_SEND' });
  expect(r.state).toEqual({ phase: 'listening', micOn: true, pendingText: '' });
  expect(r.effects).toEqual([]);
});

it('CLONE_SPEAKING(sending): speaking', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'CLONE_SPEAKING' });
  expect(r.state.phase).toBe('speaking');
});

it('CLONE_SPEAKING(listening 중): 무시', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'CLONE_SPEAKING' });
  expect(r.state.phase).toBe('listening');
});

it('RESPONSE_END(sending, micOn): listening (응답 무음/실패 복구)', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const s = { phase: 'speaking' as const, micOn: false, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'MIC_OFF' });
  expect(r.state).toEqual({ phase: 'paused', micOn: false, pendingText: '' });
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const s = { phase: 'paused' as const, micOn: false, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'MIC_ON' });
  expect(r.state).toEqual({ phase: 'listening', micOn: true, pendingText: '' });
  expect(r.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state.phase).toBe('idle');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const s = { phase: 'paused' as const, micOn: false, pendingText: '' };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state).toEqual({ phase: 'idle', micOn: true, pendingText: '' });
});

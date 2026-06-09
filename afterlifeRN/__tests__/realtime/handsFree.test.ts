import {
  v_6920f0,
  v_3075fa,
} from '../../src/realtime/handsFree';

it('CALL_LIVE(micOn): listening + START_STT', () => {
  const v_cb35cb = v_6920f0(v_3075fa(), { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toContain('START_STT');
});

it('CALL_LIVE(micOff): paused, STT 시작 안 함', () => {
  const v_fd5f43 = { phase: 'idle' as const, micOn: false, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('FINAL_RESULT(listening, 텍스트): confirming + pendingText, SAY 없음', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(v_cb35cb.state.phase).toBe('confirming');
  expect(v_cb35cb.state.pendingText).toBe('안녕');
  expect(v_cb35cb.effects).toEqual([]);
});

it('FINAL_RESULT(confirming, 추가 발화): pendingText 누적', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '잘 지냈어' });
  expect(v_cb35cb.state.phase).toBe('confirming');
  expect(v_cb35cb.state.pendingText).toBe('안녕 잘 지냈어');
});

it('FINAL_RESULT(빈 텍스트): listening 유지', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '   ' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('FINAL_RESULT(speaking 중): 무시', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('CONFIRM_SEND(confirming): sending + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CONFIRM_SEND' });
  expect(v_cb35cb.state.phase).toBe('sending');
  expect(v_cb35cb.state.pendingText).toBe('');
  expect(v_cb35cb.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(v_cb35cb.sayText).toBe('안녕');
});

it('CONFIRM_SEND(pendingText 비어있음): listening 복귀, SAY 없음', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '   ' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CONFIRM_SEND' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('CANCEL_SEND(confirming): listening + pendingText 폐기, effect 없음', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CANCEL_SEND' });
  expect(v_cb35cb.state).toEqual({ phase: 'listening', micOn: true, pendingText: '' });
  expect(v_cb35cb.effects).toEqual([]);
});

it('CLONE_SPEAKING(sending): speaking', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CLONE_SPEAKING' });
  expect(v_cb35cb.state.phase).toBe('speaking');
});

it('CLONE_SPEAKING(listening 중): 무시', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CLONE_SPEAKING' });
  expect(v_cb35cb.state.phase).toBe('listening');
});

it('RESPONSE_END(sending, micOn): listening (응답 무음/실패 복구)', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: false, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_OFF' });
  expect(v_cb35cb.state).toEqual({ phase: 'paused', micOn: false, pendingText: '' });
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_ON' });
  expect(v_cb35cb.state).toEqual({ phase: 'listening', micOn: true, pendingText: '' });
  expect(v_cb35cb.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state.phase).toBe('idle');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false, pendingText: '' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state).toEqual({ phase: 'idle', micOn: true, pendingText: '' });
});

it('MIC_OFF(confirming): paused + pendingText 폐기', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '보내려던 말' };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_OFF' });
  expect(v_cb35cb.state).toEqual({ phase: 'paused', micOn: false, pendingText: '' });
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

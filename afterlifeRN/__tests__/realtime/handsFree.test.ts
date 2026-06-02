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
  const v_fd5f43 = { phase: 'idle' as const, micOn: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('FINAL_RESULT(listening, 텍스트): speaking + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']); 
  expect(v_cb35cb.sayText).toBe('안녕');
});

it('FINAL_RESULT(빈 텍스트): listening 유지, SAY 없음', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '   ' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('FINAL_RESULT(speaking 중): 무시', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_OFF' });
  expect(v_cb35cb.state).toEqual({ phase: 'paused', micOn: false });
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_ON' });
  expect(v_cb35cb.state).toEqual({ phase: 'listening', micOn: true });
  expect(v_cb35cb.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state.phase).toBe('idle');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state).toEqual({ phase: 'idle', micOn: true });
});

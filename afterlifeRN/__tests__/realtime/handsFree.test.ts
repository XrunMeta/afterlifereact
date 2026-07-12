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
  const s = { phase: 'idle' as const, micOn: false, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('START_STT');
});

it('CALL_LIVE{confirmGate:true} → state.confirmGate=true 반영', () => {
  const r = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', confirmGate: true });
  expect(r.state.phase).toBe('listening');
  expect(r.state.confirmGate).toBe(true);
});

it('FINAL_RESULT(게이트 OFF·listening, 텍스트): 즉시 sending + STOP_STT/SAY/START_DETECTOR + sayText, pendingText 유지', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(r.state.phase).toBe('sending');
  expect(r.state.pendingText).toBe('안녕');
  expect(r.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(r.sayText).toBe('안녕');
});

it('FINAL_RESULT(게이트 OFF, 빈 텍스트): no-op — phase 유지, effects 없음', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '   ' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 OFF, speaking 중): 무시', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('SAY');
});

it('즉발 정리: sending(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움 + STOP_DETECTOR/START_STT', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '안녕', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.state.pendingText).toBe('');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('즉발 정리: speaking(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '안녕', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.state.pendingText).toBe('');
});

it('FINAL_RESULT(게이트 ON·listening, 텍스트): confirming + pendingText, SAY 없음', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(r.state.phase).toBe('confirming');
  expect(r.state.pendingText).toBe('안녕');
  expect(r.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 ON·confirming, 추가 발화): pendingText 누적', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '잘 지냈어' });
  expect(r.state.phase).toBe('confirming');
  expect(r.state.pendingText).toBe('안녕 잘 지냈어');
});

it('FINAL_RESULT(게이트 ON, 빈 텍스트): listening 유지', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '   ' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).not.toContain('SAY');
});

it('FINAL_RESULT(게이트 ON, speaking 중): 무시', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('SAY');
});

it('CONFIRM_SEND(confirming): sending + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'CONFIRM_SEND' });
  expect(r.state.phase).toBe('sending');
  expect(r.state.pendingText).toBe('');
  expect(r.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(r.sayText).toBe('안녕');
});

it('CONFIRM_SEND(pendingText 비어있음): listening 복귀, SAY 없음', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '   ', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'CONFIRM_SEND' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).not.toContain('SAY');
});

it('CANCEL_SEND(confirming): listening + pendingText 폐기, effect 없음', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'CANCEL_SEND' });
  expect(r.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: true });
  expect(r.effects).toEqual([]);
});

it('CLONE_SPEAKING(sending): speaking', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'CLONE_SPEAKING' });
  expect(r.state.phase).toBe('speaking');
});

it('CLONE_SPEAKING(listening 중): 무시', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'CLONE_SPEAKING' });
  expect(r.state.phase).toBe('listening');
});

it('RESPONSE_END(sending, micOn): listening (응답 무음/실패 복구)', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const s = { phase: 'speaking' as const, micOn: false, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'MIC_OFF' });
  expect(r.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: false });
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const s = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'MIC_ON' });
  expect(r.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: false });
  expect(r.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state.phase).toBe('idle');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const s = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state).toEqual({ phase: 'idle', micOn: true, pendingText: '', confirmGate: false });
});

it('MIC_OFF(confirming): paused + pendingText 폐기', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '보내려던 말', confirmGate: true };
  const r = handsFreeReducer(s, { type: 'MIC_OFF' });
  expect(r.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: true });
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

describe('greeting phase', () => {
  it('CALL_LIVE{greeting:true} → greeting + GREET effect', () => {
    const r = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', greeting: true });
    expect(r.state.phase).toBe('greeting');
    expect(r.effects).toEqual(['GREET']);
  });

  it('CALL_LIVE{greeting:false} → 기존 listening + START_STT', () => {
    const r = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', greeting: false });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['START_STT']);
  });

  it('CALL_LIVE (greeting 미지정) → 기존 listening (무회귀)', () => {
    const r = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['START_STT']);
  });

  it('greeting + SPEECH_START → speaking', () => {
    const g = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false };
    const r = handsFreeReducer(g, { type: 'SPEECH_START' });
    expect(r.state.phase).toBe('speaking');
    expect(r.effects).toEqual([]);
  });

  it('speaking + RESPONSE_END → listening + START_STT (인사 종료)', () => {
    const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false };
    const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('greeting + GREET_TIMEOUT → greeting 유지 + SPEAK_FALLBACK', () => {
    const g = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false };
    const r = handsFreeReducer(g, { type: 'GREET_TIMEOUT' });
    expect(r.state.phase).toBe('greeting');
    expect(r.effects).toEqual(['SPEAK_FALLBACK']);
  });

  it('greeting + RESPONSE_END(방어: start 없이 end) → listening', () => {
    const g = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false };
    const r = handsFreeReducer(g, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('SPEECH_START는 greeting 외엔 무시(중복 인사 방지)', () => {
    const sp = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false };
    expect(handsFreeReducer(sp, { type: 'SPEECH_START' }).state.phase).toBe('speaking');
  });

  it('greeting + GREET_TIMEOUT, micOff면 paused로 빠지지 않고 greeting 유지', () => {
    const g = { phase: 'greeting' as const, micOn: false, pendingText: '', confirmGate: false };
    const r = handsFreeReducer(g, { type: 'GREET_TIMEOUT' });
    expect(r.state.phase).toBe('greeting');
  });
});

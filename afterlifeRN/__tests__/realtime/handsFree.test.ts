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
  const v_fd5f43 = { phase: 'idle' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('CALL_LIVE{confirmGate:true} → state.confirmGate=true 반영', () => {
  const v_cb35cb = v_6920f0(v_3075fa(), { type: 'CALL_LIVE', confirmGate: true });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.state.confirmGate).toBe(true);
});

it('FINAL_RESULT(게이트 OFF·listening, 텍스트): 즉시 sending + STOP_STT/SAY/START_DETECTOR + sayText, pendingText 유지', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(v_cb35cb.state.phase).toBe('sending');
  expect(v_cb35cb.state.pendingText).toBe('안녕');
  expect(v_cb35cb.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(v_cb35cb.sayText).toBe('안녕');
});

it('FINAL_RESULT(게이트 OFF, 빈 텍스트): no-op — phase 유지, effects 없음', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '   ' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 OFF, speaking 중): 무시', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('즉발 정리: sending(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움 + STOP_DETECTOR/START_STT', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '안녕', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.state.pendingText).toBe('');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('즉발 정리: speaking(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '안녕', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.state.pendingText).toBe('');
});

it('FINAL_RESULT(게이트 ON·listening, 텍스트): confirming + pendingText, SAY 없음', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(v_cb35cb.state.phase).toBe('confirming');
  expect(v_cb35cb.state.pendingText).toBe('안녕');
  expect(v_cb35cb.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 ON·confirming, 추가 발화): pendingText 누적', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '잘 지냈어' });
  expect(v_cb35cb.state.phase).toBe('confirming');
  expect(v_cb35cb.state.pendingText).toBe('안녕 잘 지냈어');
});

it('FINAL_RESULT(게이트 ON, 빈 텍스트): listening 유지', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '   ' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('FINAL_RESULT(게이트 ON, speaking 중): 무시', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('CONFIRM_SEND(confirming): sending + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CONFIRM_SEND' });
  expect(v_cb35cb.state.phase).toBe('sending');
  expect(v_cb35cb.state.pendingText).toBe('');
  expect(v_cb35cb.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(v_cb35cb.sayText).toBe('안녕');
});

it('CONFIRM_SEND(pendingText 비어있음): listening 복귀, SAY 없음', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '   ', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CONFIRM_SEND' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('CANCEL_SEND(confirming): listening + pendingText 폐기, effect 없음', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CANCEL_SEND' });
  expect(v_cb35cb.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: true, signalGating: false });
  expect(v_cb35cb.effects).toEqual([]);
});

it('CLONE_SPEAKING(sending): speaking', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CLONE_SPEAKING' });
  expect(v_cb35cb.state.phase).toBe('speaking');
});

it('CLONE_SPEAKING(listening 중): 무시', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CLONE_SPEAKING' });
  expect(v_cb35cb.state.phase).toBe('listening');
});

it('RESPONSE_END(sending, micOn): listening (응답 무음/실패 복구)', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_OFF' });
  expect(v_cb35cb.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: false, signalGating: false });
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_ON' });
  expect(v_cb35cb.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: false, signalGating: false });
  expect(v_cb35cb.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state.phase).toBe('idle');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state).toEqual({ phase: 'idle', micOn: true, pendingText: '', confirmGate: false, signalGating: false });
});

it('MIC_OFF(confirming): paused + pendingText 폐기', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '보내려던 말', confirmGate: true, signalGating: false };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_OFF' });
  expect(v_cb35cb.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: true, signalGating: false });
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

describe('greeting phase', () => {
  it('CALL_LIVE{greeting:true} → greeting + GREET effect', () => {
    const v_cb35cb = v_6920f0(v_3075fa(), { type: 'CALL_LIVE', greeting: true });
    expect(v_cb35cb.state.phase).toBe('greeting');
    expect(v_cb35cb.effects).toEqual(['GREET']);
  });

  it('CALL_LIVE{greeting:false} → 기존 listening + START_STT', () => {
    const v_cb35cb = v_6920f0(v_3075fa(), { type: 'CALL_LIVE', greeting: false });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['START_STT']);
  });

  it('CALL_LIVE (greeting 미지정) → 기존 listening (무회귀)', () => {
    const v_cb35cb = v_6920f0(v_3075fa(), { type: 'CALL_LIVE' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['START_STT']);
  });

  it('greeting + SPEECH_START → speaking', () => {
    const v_206b88 = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
    const v_cb35cb = v_6920f0(v_206b88, { type: 'SPEECH_START' });
    expect(v_cb35cb.state.phase).toBe('speaking');
    expect(v_cb35cb.effects).toEqual([]);
  });

  it('speaking + RESPONSE_END → listening + START_STT (인사 종료)', () => {
    const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
    const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('greeting + GREET_TIMEOUT → greeting 유지 + SPEAK_FALLBACK', () => {
    const v_206b88 = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
    const v_cb35cb = v_6920f0(v_206b88, { type: 'GREET_TIMEOUT' });
    expect(v_cb35cb.state.phase).toBe('greeting');
    expect(v_cb35cb.effects).toEqual(['SPEAK_FALLBACK']);
  });

  it('greeting + RESPONSE_END(방어: start 없이 end) → listening', () => {
    const v_206b88 = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
    const v_cb35cb = v_6920f0(v_206b88, { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('SPEECH_START는 greeting 외엔 무시(중복 인사 방지)', () => {
    const v_b48d3d = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false };
    expect(v_6920f0(v_b48d3d, { type: 'SPEECH_START' }).state.phase).toBe('speaking');
  });

  it('greeting + GREET_TIMEOUT, micOff면 paused로 빠지지 않고 greeting 유지', () => {
    const v_206b88 = { phase: 'greeting' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false };
    const v_cb35cb = v_6920f0(v_206b88, { type: 'GREET_TIMEOUT' });
    expect(v_cb35cb.state.phase).toBe('greeting');
  });
});

describe('signalGating (2026-07-23 필러 갭 마이크 오재개 차단)', () => {
  const v_a1e859 = () =>
    v_6920f0(v_3075fa(), { type: 'CALL_LIVE', signalGating: true }).state;
  const v_9660f7 = () =>
    v_6920f0(v_a1e859(), { type: 'FINAL_RESULT', text: '안녕' }).state; 

  it('게이팅 중 RESPONSE_END(감지기)는 무시 — sending 유지·effect 없음', () => {
    const v_cb35cb = v_6920f0(v_9660f7(), { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('sending');
    expect(v_cb35cb.effects).toEqual([]);
  });
  it('게이팅 중 speaking에서도 RESPONSE_END 무시', () => {
    const v_8672be = v_6920f0(v_9660f7(), { type: 'SPEECH_START' }).state;
    expect(v_8672be.phase).toBe('speaking'); 
    const v_cb35cb = v_6920f0(v_8672be, { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('speaking');
  });
  it('RESPONSE_DONE으로만 listening 복귀(STOP_DETECTOR+START_STT)', () => {
    const v_cb35cb = v_6920f0(v_9660f7(), { type: 'RESPONSE_DONE' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });
  it('비게이팅(기본)에서는 RESPONSE_END 기존 복귀 유지 — second 경로 회귀 0', () => {
    const v_72c7a6 = v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;
    const v_5e23ec = v_6920f0(v_72c7a6, { type: 'FINAL_RESULT', text: 'x' }).state;
    expect(v_6920f0(v_5e23ec, { type: 'RESPONSE_END' }).state.phase).toBe('listening');
  });
  it('RESPONSE_DONE은 비게이팅에서도 동작(권위 이벤트)', () => {
    const v_72c7a6 = v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;
    const v_5e23ec = v_6920f0(v_72c7a6, { type: 'FINAL_RESULT', text: 'x' }).state;
    expect(v_6920f0(v_5e23ec, { type: 'RESPONSE_DONE' }).state.phase).toBe('listening');
  });
  it('signalGating은 MIC_OFF/MIC_ON을 거쳐도 보존, CALL_ENDED에서 리셋', () => {
    let v_72c7a6 = v_a1e859();
    v_72c7a6 = v_6920f0(v_72c7a6, { type: 'MIC_OFF' }).state;
    v_72c7a6 = v_6920f0(v_72c7a6, { type: 'MIC_ON' }).state;
    expect(v_72c7a6.signalGating).toBe(true);
    v_72c7a6 = v_6920f0(v_72c7a6, { type: 'CALL_ENDED' }).state;
    expect(v_72c7a6.signalGating).toBe(false);
  });
});

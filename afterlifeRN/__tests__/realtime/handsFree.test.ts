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
  const v_fd5f43 = { phase: 'idle' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_LIVE' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
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
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(v_cb35cb.state.phase).toBe('sending');
  expect(v_cb35cb.state.pendingText).toBe('안녕');
  expect(v_cb35cb.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(v_cb35cb.sayText).toBe('안녕');
});

it('FINAL_RESULT(게이트 OFF, 빈 텍스트): no-op — phase 유지, effects 없음', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '   ' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 OFF, speaking 중): 무시', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('즉발 정리: sending(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움 + STOP_DETECTOR/START_STT', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '안녕', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.state.pendingText).toBe('');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('즉발 정리: speaking(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '안녕', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.state.pendingText).toBe('');
});

it('FINAL_RESULT(게이트 ON·listening, 텍스트): confirming + pendingText, SAY 없음', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(v_cb35cb.state.phase).toBe('confirming');
  expect(v_cb35cb.state.pendingText).toBe('안녕');
  expect(v_cb35cb.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 ON·confirming, 추가 발화): pendingText 누적', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '잘 지냈어' });
  expect(v_cb35cb.state.phase).toBe('confirming');
  expect(v_cb35cb.state.pendingText).toBe('안녕 잘 지냈어');
});

it('FINAL_RESULT(게이트 ON, 빈 텍스트): listening 유지', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '   ' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('FINAL_RESULT(게이트 ON, speaking 중): 무시', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(v_cb35cb.state.phase).toBe('speaking');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('CONFIRM_SEND(confirming): sending + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CONFIRM_SEND' });
  expect(v_cb35cb.state.phase).toBe('sending');
  expect(v_cb35cb.state.pendingText).toBe('');
  expect(v_cb35cb.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(v_cb35cb.sayText).toBe('안녕');
});

it('CONFIRM_SEND(pendingText 비어있음): listening 복귀, SAY 없음', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '   ', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CONFIRM_SEND' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).not.toContain('SAY');
});

it('CANCEL_SEND(confirming): listening + pendingText 폐기, effect 없음', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: true, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CANCEL_SEND' });
  expect(v_cb35cb.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null });
  expect(v_cb35cb.effects).toEqual([]);
});

it('CLONE_SPEAKING(sending): speaking', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CLONE_SPEAKING' });
  expect(v_cb35cb.state.phase).toBe('speaking');
});

it('CLONE_SPEAKING(listening 중): 무시', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CLONE_SPEAKING' });
  expect(v_cb35cb.state.phase).toBe('listening');
});

it('RESPONSE_END(sending, micOn): listening (응답 무음/실패 복구)', () => {
  const v_fd5f43 = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('listening');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
  expect(v_cb35cb.state.phase).toBe('paused');
  expect(v_cb35cb.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_OFF' });
  expect(v_cb35cb.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null });
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_ON' });
  expect(v_cb35cb.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null });
  expect(v_cb35cb.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state.phase).toBe('idle');
  expect(v_cb35cb.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const v_fd5f43 = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'CALL_ENDED' });
  expect(v_cb35cb.state).toEqual({ phase: 'idle', micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null });
});

it('MIC_OFF(confirming): paused + pendingText 폐기', () => {
  const v_fd5f43 = { phase: 'confirming' as const, micOn: true, pendingText: '보내려던 말', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: true, pendingInterrupt: null };
  const v_cb35cb = v_6920f0(v_fd5f43, { type: 'MIC_OFF' });
  expect(v_cb35cb.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null });
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
    const v_206b88 = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
    const v_cb35cb = v_6920f0(v_206b88, { type: 'SPEECH_START' });
    expect(v_cb35cb.state.phase).toBe('speaking');
    expect(v_cb35cb.effects).toEqual([]);
  });

  it('speaking + RESPONSE_END → listening + START_STT (인사 종료)', () => {
    const v_fd5f43 = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
    const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('greeting + GREET_TIMEOUT → greeting 유지 + SPEAK_FALLBACK', () => {
    const v_206b88 = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
    const v_cb35cb = v_6920f0(v_206b88, { type: 'GREET_TIMEOUT' });
    expect(v_cb35cb.state.phase).toBe('greeting');
    expect(v_cb35cb.effects).toEqual(['SPEAK_FALLBACK']);
  });

  it('greeting + RESPONSE_END(방어: start 없이 end) → listening', () => {
    const v_206b88 = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
    const v_cb35cb = v_6920f0(v_206b88, { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('SPEECH_START는 greeting 외엔 무시(중복 인사 방지)', () => {
    const v_b48d3d = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
    expect(v_6920f0(v_b48d3d, { type: 'SPEECH_START' }).state.phase).toBe('speaking');
  });

  it('greeting + GREET_TIMEOUT, micOff면 paused로 빠지지 않고 greeting 유지', () => {
    const v_206b88 = { phase: 'greeting' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null };
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

describe('userSpeaking 플래그', () => {
  const v_bb280b = () => v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;

  it('USER_SPEECH_START 로 true, FINAL_RESULT 처리 후 false 로 내려간다', () => {
    const v_ca01e0 = v_bb280b();
    const v_3f6eae = v_6920f0(v_ca01e0, { type: 'USER_SPEECH_START' }).state;
    expect(v_3f6eae.userSpeaking).toBe(true);
    const v_3756c2 = v_6920f0(v_3f6eae, { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(v_3756c2.userSpeaking).toBe(false);
  });

  it('USER_SPEECH_IDLE 로 false 가 된다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'USER_SPEECH_START' }).state;
    expect(v_6920f0(v_3f6eae, { type: 'USER_SPEECH_IDLE' }).state.userSpeaking).toBe(false);
  });

  it('listening 이 아닌 phase 에서는 USER_SPEECH_START 를 무시한다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state; 
    expect(v_6920f0(v_3f6eae, { type: 'USER_SPEECH_START' }).state.userSpeaking).toBe(false);
  });

  it('confirming phase 에서도 USER_SPEECH_START 로 true 가 된다', () => {
    const v_ca01e0 = v_6920f0(v_3075fa(), { type: 'CALL_LIVE', confirmGate: true }).state;
    expect(v_ca01e0.phase).toBe('listening');
    const v_3f6eae = v_6920f0(v_ca01e0, { type: 'FINAL_RESULT', text: '  테스트  ' }).state;
    expect(v_3f6eae.phase).toBe('confirming');
    expect(v_3f6eae.userSpeaking).toBe(false);
    const v_3756c2 = v_6920f0(v_3f6eae, { type: 'USER_SPEECH_START' }).state;
    expect(v_3756c2.userSpeaking).toBe(true);
    expect(v_3756c2.phase).toBe('confirming');
  });
});

describe('seq 매칭', () => {
  const v_bb280b = () => v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;

  it('FINAL_RESULT(즉발) 는 activeSeq 를 발급하고 saySeq 로 알린다', () => {
    const v_ca01e0 = v_bb280b();
    const v_cb35cb = v_6920f0(v_ca01e0, { type: 'FINAL_RESULT', text: '안녕' });
    expect(v_cb35cb.state.phase).toBe('sending');
    expect(v_cb35cb.state.activeSeq).toBe(1);
    expect(v_cb35cb.saySeq).toBe(1);
  });

  it('seq 가 일치하는 SPEECH_START 만 speaking 으로 전이한다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 99 }).state.phase).toBe('sending');
    expect(v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 1 }).state.phase).toBe('speaking');
  });

  it('seq 가 다른 RESPONSE_DONE 은 무시된다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const v_3756c2 = v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 1 }).state;
    expect(v_6920f0(v_3756c2, { type: 'RESPONSE_DONE', seq: 2 }).state.phase).toBe('speaking');
  });

  it('seq 없는 RESPONSE_DONE 은 강제 복구로 항상 수용한다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const v_cb35cb = v_6920f0(v_3f6eae, { type: 'RESPONSE_DONE' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.state.activeSeq).toBeNull();
  });
});

describe('FACE_INTERRUPT — 적재와 즉시발화', () => {
  const v_bb280b = () => v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;
  const v_7d769d = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  it('조용한 listening 이면 즉시 interrupting 으로 가고 마이크를 닫는다', () => {
    const v_cb35cb = v_6920f0(v_bb280b(), v_7d769d);
    expect(v_cb35cb.state.phase).toBe('interrupting');
    expect(v_cb35cb.effects).toEqual(['STOP_STT', 'SAY_INTERRUPT', 'START_DETECTOR']);
    expect(v_cb35cb.sayText).toBe('누구시죠?');
    expect(v_cb35cb.state.activeSeq).toBe(1);
    expect(v_cb35cb.state.pendingInterrupt).toBeNull();
  });

  it('사용자가 말하는 중이면 자르지 않고 적재만 한다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'USER_SPEECH_START' }).state;
    const v_cb35cb = v_6920f0(v_3f6eae, v_7d769d);
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual([]);
    expect(v_cb35cb.state.pendingInterrupt).toEqual({ text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 });
  });

  it('클론 발화 중이면 적재만 한다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const v_3756c2 = v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 1 }).state;
    const v_cb35cb = v_6920f0(v_3756c2, v_7d769d);
    expect(v_cb35cb.state.phase).toBe('speaking');
    expect(v_cb35cb.state.pendingInterrupt?.faceKey).toBe('f1');
  });

  it('같은 faceKey 중복 이벤트는 두 번 적재하지 않는다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'USER_SPEECH_START' }).state;
    const v_3756c2 = v_6920f0(v_3f6eae, v_7d769d).state;
    const v_d0786c = v_6920f0(v_3756c2, { ...v_7d769d, text: '다른문구' }).state;
    expect(v_d0786c.pendingInterrupt?.text).toBe('누구시죠?');
  });

  it('paused 에서는 적재도 하지 않는다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'MIC_OFF' }).state;
    expect(v_6920f0(v_3f6eae, v_7d769d).state.pendingInterrupt).toBeNull();
  });

  it('interrupting 종료 시 listening 으로 복귀한다 (RESPONSE_DONE)', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), v_7d769d).state;
    const v_3756c2 = v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 1 }).state;
    expect(v_3756c2.phase).toBe('interrupting');
    const v_cb35cb = v_6920f0(v_3756c2, { type: 'RESPONSE_DONE', seq: 1 });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('interrupting 종료 시 listening 으로 복귀한다 (RESPONSE_END, signalGating=false)', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), v_7d769d).state;
    const v_3756c2 = v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 1 }).state;
    expect(v_3756c2.phase).toBe('interrupting');
    expect(v_3756c2.signalGating).toBe(false);
    const v_cb35cb = v_6920f0(v_3756c2, { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('confirming 중이면 FACE_INTERRUPT 는 즉시 발화하지 않고 적재만 한다(사용자 말을 자르지 않는다)', () => {
    const v_ca01e0 = v_6920f0(v_3075fa(), { type: 'CALL_LIVE', confirmGate: true }).state;
    const v_3f6eae = v_6920f0(v_ca01e0, { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(v_3f6eae.phase).toBe('confirming');
    const v_cb35cb = v_6920f0(v_3f6eae, v_7d769d);
    expect(v_cb35cb.state.phase).toBe('confirming');
    expect(v_cb35cb.effects).toEqual([]);
    expect(v_cb35cb.state.pendingInterrupt).toEqual({ text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 });
  });

  it('idle 에서는 FACE_INTERRUPT 를 적재조차 하지 않는다', () => {
    const v_cb35cb = v_6920f0(v_3075fa(), v_7d769d);
    expect(v_cb35cb.state.phase).toBe('idle');
    expect(v_cb35cb.effects).toEqual([]);
    expect(v_cb35cb.state.pendingInterrupt).toBeNull();
  });

  it('RESPONSE_END 로 paused 전이 시 pendingInterrupt 를 정리한다(적재 잔존 방지)', () => {
    const v_fd5f43 = {
      phase: 'speaking', micOn: false, pendingText: '', confirmGate: false, signalGating: false,
      activeSeq: null, nextSeq: 1, userSpeaking: false,
      pendingInterrupt: { text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 },
    };
    const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_END' });
    expect(v_cb35cb.state.phase).toBe('paused');
    expect(v_cb35cb.state.pendingInterrupt).toBeNull();
  });

  it('RESPONSE_DONE 으로 paused 전이 시 pendingInterrupt 를 정리한다(적재 잔존 방지)', () => {
    const v_fd5f43 = {
      phase: 'speaking', micOn: false, pendingText: '', confirmGate: false, signalGating: false,
      activeSeq: null, nextSeq: 1, userSpeaking: false,
      pendingInterrupt: { text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 },
    };
    const v_cb35cb = v_6920f0(v_fd5f43, { type: 'RESPONSE_DONE' });
    expect(v_cb35cb.state.phase).toBe('paused');
    expect(v_cb35cb.state.pendingInterrupt).toBeNull();
  });
});

describe('flush ① — 사용자 턴 뒤에 인터럽트 이어붙이기', () => {
  const v_bb280b = () => v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;
  const v_7d769d = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  const v_7d3aa6 = () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'USER_SPEECH_START' }).state;
    const v_3756c2 = v_6920f0(v_3f6eae, v_7d769d).state;                              
    const v_d0786c = v_6920f0(v_3756c2, { type: 'FINAL_RESULT', text: '안녕' }).state; 
    const v_121e28 = v_6920f0(v_d0786c, { type: 'SPEECH_START', seq: 1 }).state;  
    return v_6920f0(v_121e28, { type: 'RESPONSE_DONE', seq: 1 });
  };

  it('사용자 응답 종료 시 listening 이 아니라 interrupting 으로 간다', () => {
    const v_cb35cb = v_7d3aa6();
    expect(v_cb35cb.state.phase).toBe('interrupting');
    expect(v_cb35cb.sayText).toBe('누구시죠?');
    expect(v_cb35cb.state.pendingInterrupt).toBeNull();
  });

  it('flush 시 START_STT 를 내보내지 않는다(마이크 재개방 금지)', () => {
    const v_cb35cb = v_7d3aa6();
    expect(v_cb35cb.effects).not.toContain('START_STT');
    expect(v_cb35cb.effects).toEqual(['SAY_INTERRUPT', 'START_DETECTOR']);
  });

  it('인터럽트가 끝나면 그제서야 사용자 턴으로 복귀한다', () => {
    const v_5b244b = v_7d3aa6().state;
    const v_cb35cb = v_6920f0(v_5b244b, { type: 'RESPONSE_DONE', seq: v_5b244b.activeSeq! });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('micOn=false 면 flush 하지 않고 paused 로 간다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'USER_SPEECH_START' }).state;
    const v_3756c2 = v_6920f0(v_3f6eae, v_7d769d).state;
    const v_d0786c = v_6920f0(v_3756c2, { type: 'FINAL_RESULT', text: '안녕' }).state;
    const v_121e28 = v_6920f0(v_d0786c, { type: 'MIC_OFF' }).state;
    const v_cb35cb = v_6920f0(v_121e28, { type: 'RESPONSE_DONE' });
    expect(v_cb35cb.state.phase).toBe('paused');
  });
});

describe('2턴 폐기 규칙', () => {
  const v_bb280b = () => v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;
  const v_7d769d = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  it('사용자가 한 턴 더 말하면 deferredTurns 가 오르고, 2 이상이면 폐기된다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'USER_SPEECH_START' }).state;
    const v_3756c2 = v_6920f0(v_3f6eae, v_7d769d).state;

    const v_d0786c = v_6920f0(v_3756c2, { type: 'FINAL_RESULT', text: '첫마디' }).state;
    expect(v_d0786c.pendingInterrupt?.deferredTurns).toBe(1);

    const v_121e28 = { ...v_d0786c, phase: 'listening' as const, activeSeq: null };
    const v_5b244b = v_6920f0(v_121e28, { type: 'FINAL_RESULT', text: '둘째마디' }).state;
    expect(v_5b244b.pendingInterrupt).toBeNull();
  });
});

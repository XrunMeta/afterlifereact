import {
  handsFreeReducer,
  initHandsFreeState,
  IDLE_GREET_DELAYS_MS,
  PENDING_INTERRUPT_FLUSH_QUIET_MS,
  PENDING_INTERRUPT_EXPIRE_MS,
  INTERRUPT_COOLDOWN_MS,
} from '../../src/realtime/handsFree';

it('CALL_LIVE(micOn): listening + START_STT', () => {
  const r = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toContain('START_STT');
});

it('CALL_LIVE(micOff): paused, STT 시작 안 함', () => {
  const s = { phase: 'idle' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CALL_LIVE' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('CALL_LIVE(speaking 중 재발화): no-op — STT 강제 재시작 안 함', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
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
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(r.state.phase).toBe('sending');
  expect(r.state.pendingText).toBe('안녕');
  expect(r.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(r.sayText).toBe('안녕');
});

it('FINAL_RESULT(게이트 OFF, 빈 텍스트): no-op — phase 유지, effects 없음', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '   ' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 OFF, speaking 중): 무시', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('SAY');
});

it('즉발 정리: sending(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움 + STOP_DETECTOR/START_STT', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '안녕', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.state.pendingText).toBe('');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('즉발 정리: speaking(게이트 OFF, pendingText 있음) + RESPONSE_END → listening, pendingText 비움', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '안녕', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.state.pendingText).toBe('');
});

it('FINAL_RESULT(게이트 ON·listening, 텍스트): confirming + pendingText, SAY 없음', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '  안녕  ' });
  expect(r.state.phase).toBe('confirming');
  expect(r.state.pendingText).toBe('안녕');
  expect(r.effects).toEqual([]);
});

it('FINAL_RESULT(게이트 ON·confirming, 추가 발화): pendingText 누적', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '잘 지냈어' });
  expect(r.state.phase).toBe('confirming');
  expect(r.state.pendingText).toBe('안녕 잘 지냈어');
});

it('FINAL_RESULT(게이트 ON, 빈 텍스트): listening 유지', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '   ' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).not.toContain('SAY');
});

it('FINAL_RESULT(게이트 ON, speaking 중): 무시', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '끼어들기' });
  expect(r.state.phase).toBe('speaking');
  expect(r.effects).not.toContain('SAY');
});

it('CONFIRM_SEND(confirming): sending + STOP_STT + SAY + START_DETECTOR + sayText', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CONFIRM_SEND' });
  expect(r.state.phase).toBe('sending');
  expect(r.state.pendingText).toBe('');
  expect(r.effects).toEqual(['STOP_STT', 'SAY', 'START_DETECTOR']);
  expect(r.sayText).toBe('안녕');
});

it('CONFIRM_SEND(pendingText 비어있음): listening 복귀, SAY 없음', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '   ', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CONFIRM_SEND' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).not.toContain('SAY');
});

it('CANCEL_SEND(confirming): listening + pendingText 폐기, effect 없음', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '안녕', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: true, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CANCEL_SEND' });
  expect(r.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 });
  expect(r.effects).toEqual([]);
});

it('CLONE_SPEAKING(sending): speaking', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CLONE_SPEAKING' });
  expect(r.state.phase).toBe('speaking');
});

it('CLONE_SPEAKING(listening 중): 무시', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CLONE_SPEAKING' });
  expect(r.state.phase).toBe('listening');
});

it('RESPONSE_END(sending, micOn): listening (응답 무음/실패 복구)', () => {
  const s = { phase: 'sending' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('RESPONSE_END(speaking, micOn): listening + STOP_DETECTOR + START_STT', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('listening');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_DETECTOR', 'START_STT']));
});

it('[방어분기·도달불가 상태] RESPONSE_END(speaking, micOff): paused, START_STT 없음', () => {
  const s = { phase: 'speaking' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
  expect(r.state.phase).toBe('paused');
  expect(r.effects).not.toContain('START_STT');
});

it('MIC_OFF(어느 상태든): paused + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'listening' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'MIC_OFF' });
  expect(r.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 });
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('MIC_ON(paused): listening + START_STT', () => {
  const s = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'MIC_ON' });
  expect(r.state).toEqual({ phase: 'listening', micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 });
  expect(r.effects).toContain('START_STT');
});

it('CALL_ENDED: idle + STOP_STT + STOP_DETECTOR', () => {
  const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state.phase).toBe('idle');
  expect(r.effects).toEqual(expect.arrayContaining(['STOP_STT', 'STOP_DETECTOR']));
});

it('CALL_ENDED: micOn 리셋(paused→idle에서 다음 통화 마이크 ON 기본)', () => {
  const s = { phase: 'paused' as const, micOn: false, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'CALL_ENDED' });
  expect(r.state).toEqual({ phase: 'idle', micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 });
});

it('MIC_OFF(confirming): paused + pendingText 폐기', () => {
  const s = { phase: 'confirming' as const, micOn: true, pendingText: '보내려던 말', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: true, pendingInterrupt: null, idleGreetCount: 0 };
  const r = handsFreeReducer(s, { type: 'MIC_OFF' });
  expect(r.state).toEqual({ phase: 'paused', micOn: false, pendingText: '', confirmGate: true, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 });
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
    const g = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
    const r = handsFreeReducer(g, { type: 'SPEECH_START' });
    expect(r.state.phase).toBe('speaking');
    expect(r.effects).toEqual([]);
  });

  it('speaking + RESPONSE_END → listening + START_STT (인사 종료)', () => {
    const s = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
    const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('greeting + GREET_TIMEOUT → greeting 유지 + SPEAK_FALLBACK', () => {
    const g = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
    const r = handsFreeReducer(g, { type: 'GREET_TIMEOUT' });
    expect(r.state.phase).toBe('greeting');
    expect(r.effects).toEqual(['SPEAK_FALLBACK']);
  });

  it('greeting + RESPONSE_END(방어: start 없이 end) → listening', () => {
    const g = { phase: 'greeting' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
    const r = handsFreeReducer(g, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('SPEECH_START는 greeting 외엔 무시(중복 인사 방지)', () => {
    const sp = { phase: 'speaking' as const, micOn: true, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
    expect(handsFreeReducer(sp, { type: 'SPEECH_START' }).state.phase).toBe('speaking');
  });

  it('greeting + GREET_TIMEOUT, micOff면 paused로 빠지지 않고 greeting 유지', () => {
    const g = { phase: 'greeting' as const, micOn: false, pendingText: '', confirmGate: false, signalGating: false, activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0 };
    const r = handsFreeReducer(g, { type: 'GREET_TIMEOUT' });
    expect(r.state.phase).toBe('greeting');
  });
});

describe('signalGating (2026-07-23 필러 갭 마이크 오재개 차단)', () => {
  const liveGated = () =>
    handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', signalGating: true }).state;
  const toSending = () =>
    handsFreeReducer(liveGated(), { type: 'FINAL_RESULT', text: '안녕' }).state; 

  it('게이팅 중 RESPONSE_END(감지기)는 무시 — sending 유지·effect 없음', () => {
    const r = handsFreeReducer(toSending(), { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('sending');
    expect(r.effects).toEqual([]);
  });
  it('게이팅 중 speaking에서도 RESPONSE_END 무시', () => {
    const speaking = handsFreeReducer(toSending(), { type: 'SPEECH_START' }).state;
    expect(speaking.phase).toBe('speaking'); 
    const r = handsFreeReducer(speaking, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('speaking');
  });
  it('RESPONSE_DONE으로만 listening 복귀(STOP_DETECTOR+START_STT)', () => {
    const r = handsFreeReducer(toSending(), { type: 'RESPONSE_DONE' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });
  it('비게이팅(기본)에서는 RESPONSE_END 기존 복귀 유지 — second 경로 회귀 0', () => {
    const st = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;
    const sending = handsFreeReducer(st, { type: 'FINAL_RESULT', text: 'x' }).state;
    expect(handsFreeReducer(sending, { type: 'RESPONSE_END' }).state.phase).toBe('listening');
  });
  it('RESPONSE_DONE은 비게이팅에서도 동작(권위 이벤트)', () => {
    const st = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;
    const sending = handsFreeReducer(st, { type: 'FINAL_RESULT', text: 'x' }).state;
    expect(handsFreeReducer(sending, { type: 'RESPONSE_DONE' }).state.phase).toBe('listening');
  });
  it('signalGating은 MIC_OFF/MIC_ON을 거쳐도 보존, CALL_ENDED에서 리셋', () => {
    let st = liveGated();
    st = handsFreeReducer(st, { type: 'MIC_OFF' }).state;
    st = handsFreeReducer(st, { type: 'MIC_ON' }).state;
    expect(st.signalGating).toBe(true);
    st = handsFreeReducer(st, { type: 'CALL_ENDED' }).state;
    expect(st.signalGating).toBe(false);
  });
});

describe('userSpeaking 플래그', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;

  it('USER_SPEECH_START 로 true, FINAL_RESULT 처리 후 false 로 내려간다', () => {
    const s0 = live();
    const s1 = handsFreeReducer(s0, { type: 'USER_SPEECH_START' }).state;
    expect(s1.userSpeaking).toBe(true);
    const s2 = handsFreeReducer(s1, { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(s2.userSpeaking).toBe(false);
  });

  it('USER_SPEECH_IDLE 로 false 가 된다', () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    expect(handsFreeReducer(s1, { type: 'USER_SPEECH_IDLE' }).state.userSpeaking).toBe(false);
  });

  it('listening 이 아닌 phase 에서는 USER_SPEECH_START 를 무시한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state; 
    expect(handsFreeReducer(s1, { type: 'USER_SPEECH_START' }).state.userSpeaking).toBe(false);
  });

  it('confirming phase 에서도 USER_SPEECH_START 로 true 가 된다', () => {
    const s0 = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', confirmGate: true }).state;
    expect(s0.phase).toBe('listening');
    const s1 = handsFreeReducer(s0, { type: 'FINAL_RESULT', text: '  테스트  ' }).state;
    expect(s1.phase).toBe('confirming');
    expect(s1.userSpeaking).toBe(false);
    const s2 = handsFreeReducer(s1, { type: 'USER_SPEECH_START' }).state;
    expect(s2.userSpeaking).toBe(true);
    expect(s2.phase).toBe('confirming');
  });
});

describe('seq 매칭', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;

  it('FINAL_RESULT(즉발) 는 activeSeq 를 발급하고 saySeq 로 알린다', () => {
    const s0 = live();
    const r = handsFreeReducer(s0, { type: 'FINAL_RESULT', text: '안녕' });
    expect(r.state.phase).toBe('sending');
    expect(r.state.activeSeq).toBe(1);
    expect(r.saySeq).toBe(1);
  });

  it('seq 가 일치하는 SPEECH_START 만 speaking 으로 전이한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(handsFreeReducer(s1, { type: 'SPEECH_START', seq: 99 }).state.phase).toBe('sending');
    expect(handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state.phase).toBe('speaking');
  });

  it('seq 가 다른 RESPONSE_DONE 은 무시된다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const s2 = handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state;
    expect(handsFreeReducer(s2, { type: 'RESPONSE_DONE', seq: 2 }).state.phase).toBe('speaking');
  });

  it('seq 없는 RESPONSE_DONE 은 강제 복구로 항상 수용한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const r = handsFreeReducer(s1, { type: 'RESPONSE_DONE' });
    expect(r.state.phase).toBe('listening');
    expect(r.state.activeSeq).toBeNull();
  });
});

describe('FACE_INTERRUPT — 적재와 즉시발화', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;
  const face = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  it('조용한 listening 이면 즉시 interrupting 으로 가고 마이크를 닫는다', () => {
    const r = handsFreeReducer(live(), face);
    expect(r.state.phase).toBe('interrupting');
    expect(r.effects).toEqual(['STOP_STT', 'SAY_INTERRUPT', 'START_DETECTOR']);
    expect(r.sayText).toBe('누구시죠?');
    expect(r.state.activeSeq).toBe(1);
    expect(r.state.pendingInterrupt).toBeNull();
  });

  it('사용자가 말하는 중이면 자르지 않고 적재만 한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    const r = handsFreeReducer(s1, face);
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual([]);
    expect(r.state.pendingInterrupt).toEqual({ text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 });
  });

  it('클론 발화 중이면 적재만 한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const s2 = handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state;
    const r = handsFreeReducer(s2, face);
    expect(r.state.phase).toBe('speaking');
    expect(r.state.pendingInterrupt?.faceKey).toBe('f1');
  });

  it('같은 faceKey 중복 이벤트는 두 번 적재하지 않는다', () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    const s2 = handsFreeReducer(s1, face).state;
    const s3 = handsFreeReducer(s2, { ...face, text: '다른문구' }).state;
    expect(s3.pendingInterrupt?.text).toBe('누구시죠?');
  });

  it('paused 에서는 적재도 하지 않는다', () => {
    const s1 = handsFreeReducer(live(), { type: 'MIC_OFF' }).state;
    expect(handsFreeReducer(s1, face).state.pendingInterrupt).toBeNull();
  });

  it('interrupting 종료 시 listening 으로 복귀한다 (RESPONSE_DONE)', () => {
    const s1 = handsFreeReducer(live(), face).state;
    const s2 = handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state;
    expect(s2.phase).toBe('interrupting');
    const r = handsFreeReducer(s2, { type: 'RESPONSE_DONE', seq: 1 });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('interrupting 종료 시 listening 으로 복귀한다 (RESPONSE_END, signalGating=false)', () => {
    const s1 = handsFreeReducer(live(), face).state;
    const s2 = handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state;
    expect(s2.phase).toBe('interrupting');
    expect(s2.signalGating).toBe(false);
    const r = handsFreeReducer(s2, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('confirming 중이면 FACE_INTERRUPT 는 즉시 발화하지 않고 적재만 한다(사용자 말을 자르지 않는다)', () => {
    const s0 = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', confirmGate: true }).state;
    const s1 = handsFreeReducer(s0, { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(s1.phase).toBe('confirming');
    const r = handsFreeReducer(s1, face);
    expect(r.state.phase).toBe('confirming');
    expect(r.effects).toEqual([]);
    expect(r.state.pendingInterrupt).toEqual({ text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 });
  });

  it('idle 에서는 FACE_INTERRUPT 를 적재조차 하지 않는다', () => {
    const r = handsFreeReducer(initHandsFreeState(), face);
    expect(r.state.phase).toBe('idle');
    expect(r.effects).toEqual([]);
    expect(r.state.pendingInterrupt).toBeNull();
  });

  it('[방어분기·도달불가 상태] RESPONSE_END 로 paused 전이 시 pendingInterrupt 를 정리한다(적재 잔존 방지)', () => {
    const s: import('../../src/realtime/handsFree').HandsFreeState = {
      phase: 'speaking', micOn: false, pendingText: '', confirmGate: false, signalGating: false,
      activeSeq: null, nextSeq: 1, userSpeaking: false, idleGreetCount: 0,
      pendingInterrupt: { text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 },
    };
    const r = handsFreeReducer(s, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('paused');
    expect(r.state.pendingInterrupt).toBeNull();
  });

  it('[방어분기·도달불가 상태] RESPONSE_DONE 으로 paused 전이 시 pendingInterrupt 를 정리한다(적재 잔존 방지)', () => {
    const s: import('../../src/realtime/handsFree').HandsFreeState = {
      phase: 'speaking', micOn: false, pendingText: '', confirmGate: false, signalGating: false,
      activeSeq: null, nextSeq: 1, userSpeaking: false, idleGreetCount: 0,
      pendingInterrupt: { text: '누구시죠?', faceKey: 'f1', deferredTurns: 0 },
    };
    const r = handsFreeReducer(s, { type: 'RESPONSE_DONE' });
    expect(r.state.phase).toBe('paused');
    expect(r.state.pendingInterrupt).toBeNull();
  });
});

describe('flush ① — 사용자 턴 뒤에 인터럽트 이어붙이기', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;
  const face = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  const runToUserResponseDone = () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    const s2 = handsFreeReducer(s1, face).state;                              
    const s3 = handsFreeReducer(s2, { type: 'FINAL_RESULT', text: '안녕' }).state; 
    const s4 = handsFreeReducer(s3, { type: 'SPEECH_START', seq: 1 }).state;  
    return handsFreeReducer(s4, { type: 'RESPONSE_DONE', seq: 1 });
  };

  it('사용자 응답 종료 시 listening 이 아니라 interrupting 으로 간다', () => {
    const r = runToUserResponseDone();
    expect(r.state.phase).toBe('interrupting');
    expect(r.sayText).toBe('누구시죠?');
    expect(r.state.pendingInterrupt).toBeNull();
  });

  it('flush 시 START_STT 를 내보내지 않는다(마이크 재개방 금지)', () => {
    const r = runToUserResponseDone();
    expect(r.effects).not.toContain('START_STT');

    expect(r.effects).toEqual(['STOP_DETECTOR', 'SAY_INTERRUPT', 'START_DETECTOR']);
  });

  it('[I1] flush 는 아바타훅 phase 정리(STOP_DETECTOR)를 반드시 선행한다 — SAY_INTERRUPT 보다 앞', () => {
    const r = runToUserResponseDone();
    expect(r.effects.indexOf('STOP_DETECTOR')).toBeGreaterThanOrEqual(0);
    expect(r.effects.indexOf('STOP_DETECTOR')).toBeLessThan(r.effects.indexOf('SAY_INTERRUPT'));
  });

  it('인터럽트가 끝나면 그제서야 사용자 턴으로 복귀한다', () => {
    const s5 = runToUserResponseDone().state;
    const r = handsFreeReducer(s5, { type: 'RESPONSE_DONE', seq: s5.activeSeq! });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('micOn=false 면 flush 하지 않고 paused 를 유지한다(적재분 폐기 + 마이크 유지)', () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    const s2 = handsFreeReducer(s1, face).state;
    const s3 = handsFreeReducer(s2, { type: 'FINAL_RESULT', text: '안녕' }).state;
    const s4 = handsFreeReducer(s3, { type: 'MIC_OFF' }).state;
    expect(s4.pendingInterrupt).toBeNull(); 
    const r = handsFreeReducer(s4, { type: 'RESPONSE_DONE' });
    expect(r.state.phase).toBe('paused');
    expect(r.state.activeSeq).toBeNull();
    expect(r.effects).not.toContain('START_STT');
    expect(r.effects).not.toContain('SAY_INTERRUPT');
  });
});

describe('2턴 폐기 규칙 (confirmGate=true 경로에서만 유기적으로 발동)', () => {

  const face = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  it('confirmGate=true: 사용자가 FINAL_RESULT 를 flush 없이 두 번(같은 confirming 턴에) 보내면 deferredTurns 가 1→2 로 올라 폐기된다', () => {
    const s0 = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', confirmGate: true }).state;
    const s1 = handsFreeReducer(s0, { type: 'USER_SPEECH_START' }).state; 
    const s2 = handsFreeReducer(s1, face).state; 
    expect(s2.pendingInterrupt?.deferredTurns).toBe(0);

    const s3 = handsFreeReducer(s2, { type: 'FINAL_RESULT', text: '첫마디' }).state;
    expect(s3.phase).toBe('confirming');
    expect(s3.pendingInterrupt?.deferredTurns).toBe(1);

    const s4 = handsFreeReducer(s3, { type: 'FINAL_RESULT', text: '둘째마디' }).state;
    expect(s4.phase).toBe('confirming');
    expect(s4.pendingInterrupt).toBeNull();
  });
});

describe('인터럽트 밀림 상한 — confirmGate=false(즉발, 프로덕션 기본값)', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state; 
  const face = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  it('즉발 모드에서는 인터럽트가 최대 1턴만 밀리고, 사용자 응답이 끝나면 곧바로 flush 된다(START_STT 없이)', () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    const s2 = handsFreeReducer(s1, face).state; 
    const s3 = handsFreeReducer(s2, { type: 'FINAL_RESULT', text: '안녕' }).state; 
    expect(s3.phase).toBe('sending');
    expect(s3.pendingInterrupt?.deferredTurns).toBe(1);

    const ignored = handsFreeReducer(s3, { type: 'FINAL_RESULT', text: '또 말함' });
    expect(ignored.state).toBe(s3);
    expect(ignored.effects).toEqual([]);

    const s4 = handsFreeReducer(s3, { type: 'SPEECH_START', seq: s3.activeSeq! }).state; 
    const r = handsFreeReducer(s4, { type: 'RESPONSE_DONE', seq: s3.activeSeq! });
    expect(r.state.phase).toBe('interrupting');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'SAY_INTERRUPT', 'START_DETECTOR']); 
    expect(r.effects).not.toContain('START_STT');
  });
});

describe('[C3] 적재 인터럽트의 시간 기반 flush·폐기 (컨트롤러가 시간을 재고 이벤트로 보낸다)', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;
  const face = { type: 'FACE_INTERRUPT' as const, text: '누구시죠?', faceKey: 'f1' };

  const loaded = () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    const s2 = handsFreeReducer(s1, face).state;
    expect(s2.pendingInterrupt).not.toBeNull();
    return s2;
  };

  it('회귀: 사용자가 말하다 침묵해 final 이 안 와도(턴 종료 이벤트 없음) INTERRUPT_FLUSH 로 발화된다', () => {

    const quiet = handsFreeReducer(loaded(), { type: 'USER_SPEECH_IDLE' }).state;
    expect(quiet.phase).toBe('listening');
    const r = handsFreeReducer(quiet, { type: 'INTERRUPT_FLUSH' });
    expect(r.state.phase).toBe('interrupting');
    expect(r.sayText).toBe('누구시죠?');
    expect(r.state.pendingInterrupt).toBeNull();
    expect(r.effects).toEqual(['STOP_STT', 'SAY_INTERRUPT', 'START_DETECTOR']);
  });

  it('겹침 금지: 사용자가 말하는 중이면 INTERRUPT_FLUSH 를 무시하고 적재를 유지한다', () => {
    const s = loaded(); 
    const r = handsFreeReducer(s, { type: 'INTERRUPT_FLUSH' });
    expect(r.state).toBe(s);
    expect(r.effects).toEqual([]);
  });

  it('겹침 금지: 재생 중(activeSeq 존재)이면 INTERRUPT_FLUSH 를 무시한다', () => {
    const quiet = handsFreeReducer(loaded(), { type: 'USER_SPEECH_IDLE' }).state;
    const s = { ...quiet, activeSeq: 7 };
    const r = handsFreeReducer(s, { type: 'INTERRUPT_FLUSH' });
    expect(r.state).toBe(s);
    expect(r.effects).toEqual([]);
  });

  it('겹침 금지: listening 이 아니면(speaking) INTERRUPT_FLUSH 를 무시한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state; 
    const s2 = handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state;           
    const s3 = handsFreeReducer(s2, face).state;                                       
    const r = handsFreeReducer(s3, { type: 'INTERRUPT_FLUSH' });
    expect(r.state).toBe(s3);
    expect(r.effects).toEqual([]);
  });

  it('겹침 금지: micOn=false 면 INTERRUPT_FLUSH 를 무시한다', () => {
    const quiet = handsFreeReducer(loaded(), { type: 'USER_SPEECH_IDLE' }).state;
    const s = { ...quiet, micOn: false };
    const r = handsFreeReducer(s, { type: 'INTERRUPT_FLUSH' });
    expect(r.state).toBe(s);
    expect(r.effects).toEqual([]);
  });

  it('적재분이 없으면 INTERRUPT_FLUSH 는 no-op(잘못된 발화 생성 금지)', () => {
    const s = live();
    const r = handsFreeReducer(s, { type: 'INTERRUPT_FLUSH' });
    expect(r.state).toBe(s);
    expect(r.effects).toEqual([]);
  });

  it('INTERRUPT_EXPIRED 는 적재분을 폐기한다(뒤늦은 인사 방지) — 발화는 하지 않는다', () => {
    const r = handsFreeReducer(loaded(), { type: 'INTERRUPT_EXPIRED', faceKey: 'f1' });
    expect(r.state.pendingInterrupt).toBeNull();
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual([]);
  });

  it('INTERRUPT_EXPIRED 의 faceKey 가 다르면(이미 교체된 적재분) 무시한다', () => {
    const s = loaded();
    const r = handsFreeReducer(s, { type: 'INTERRUPT_EXPIRED', faceKey: 'other' });
    expect(r.state).toBe(s);
    expect(r.state.pendingInterrupt?.faceKey).toBe('f1');
  });

  it('폐기된 뒤에는 턴이 끝나도 flush 되지 않는다 — 정상 listening 복귀', () => {
    const expired = handsFreeReducer(loaded(), { type: 'INTERRUPT_EXPIRED', faceKey: 'f1' }).state;
    const s3 = handsFreeReducer(expired, { type: 'FINAL_RESULT', text: '안녕' }).state;
    const r = handsFreeReducer(s3, { type: 'RESPONSE_DONE', seq: s3.activeSeq! });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('정책 상수: flush 대기(3s)는 STT endpoint(1.5s)보다 길고, 폐기(15s)는 워치독 1차(30s)보다 짧다', () => {
    expect(PENDING_INTERRUPT_FLUSH_QUIET_MS).toBe(3000);
    expect(PENDING_INTERRUPT_EXPIRE_MS).toBe(15000);
    expect(PENDING_INTERRUPT_FLUSH_QUIET_MS).toBeLessThan(PENDING_INTERRUPT_EXPIRE_MS);
    expect(PENDING_INTERRUPT_EXPIRE_MS).toBeLessThan(IDLE_GREET_DELAYS_MS[0]);
    expect(INTERRUPT_COOLDOWN_MS).toBe(10000);
  });
});

describe('[I2] MIC_ON 은 진행 중인 클론 발화 위로 마이크를 열지 않는다', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;

  const speakingTurn = () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state; 
    return handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state;               
  };

  it('MIC_OFF 는 진행 중 발화 마커(activeSeq)를 보존한다 — 클론은 계속 말하고 있다', () => {
    const paused = handsFreeReducer(speakingTurn(), { type: 'MIC_OFF' }).state;
    expect(paused.phase).toBe('paused');
    expect(paused.activeSeq).toBe(1);
    expect(paused.pendingInterrupt).toBeNull();
  });

  it('🔴회귀: 재생 중 MIC_ON 은 START_STT 를 내지 않는다(클론 음성 STT 유입 차단)', () => {
    const paused = handsFreeReducer(speakingTurn(), { type: 'MIC_OFF' }).state;
    const r = handsFreeReducer(paused, { type: 'MIC_ON' });
    expect(r.effects).not.toContain('START_STT');
    expect(r.effects).toEqual(['START_DETECTOR']);
    expect(r.state.micOn).toBe(true);
    expect(r.state.phase).toBe('speaking');
    expect(r.state.activeSeq).toBe(1); 
  });

  it('재생 중 MIC_ON 이후 그 발화가 끝나면 정상 복귀(STOP_DETECTOR+START_STT)', () => {
    const paused = handsFreeReducer(speakingTurn(), { type: 'MIC_OFF' }).state;
    const resumed = handsFreeReducer(paused, { type: 'MIC_ON' }).state;
    const r = handsFreeReducer(resumed, { type: 'RESPONSE_DONE', seq: 1 });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['STOP_DETECTOR', 'START_STT']);
  });

  it('paused 중 발화가 끝났으면(RESPONSE_DONE 수신) MIC_ON 은 기존대로 즉시 listening + START_STT', () => {
    const paused = handsFreeReducer(speakingTurn(), { type: 'MIC_OFF' }).state;
    const done = handsFreeReducer(paused, { type: 'RESPONSE_DONE', seq: 1 });
    expect(done.state.phase).toBe('paused'); 
    expect(done.state.activeSeq).toBeNull();
    expect(done.effects).toEqual([]);
    const r = handsFreeReducer(done.state, { type: 'MIC_ON' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['START_STT']);
  });

  it('paused 중 RESPONSE_END(비게이팅) 도 진행 중 마커를 걷는다', () => {
    const paused = handsFreeReducer(speakingTurn(), { type: 'MIC_OFF' }).state;
    const r = handsFreeReducer(paused, { type: 'RESPONSE_END' });
    expect(r.state.phase).toBe('paused');
    expect(r.state.activeSeq).toBeNull();
    expect(r.effects).toEqual([]);
  });

  it('paused 중 seq 가 다른 RESPONSE_DONE 은 마커를 걷지 않는다', () => {
    const paused = handsFreeReducer(speakingTurn(), { type: 'MIC_OFF' }).state;
    const r = handsFreeReducer(paused, { type: 'RESPONSE_DONE', seq: 99 });
    expect(r.state.activeSeq).toBe(1);
  });

  it('조용한 listening 에서의 MIC_OFF→MIC_ON 은 기존 동작 그대로(무회귀)', () => {
    const paused = handsFreeReducer(live(), { type: 'MIC_OFF' }).state;
    expect(paused.activeSeq).toBeNull();
    const r = handsFreeReducer(paused, { type: 'MIC_ON' });
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual(['START_STT']);
  });
});

describe('무발화 워치독', () => {
  const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;

  it('조용한 listening 에서 인삿말을 발화한다', () => {
    const r = handsFreeReducer(live(), { type: 'IDLE_TIMEOUT' });
    expect(r.state.phase).toBe('interrupting');
    expect(r.effects).toEqual(['STOP_STT', 'SAY_IDLE_GREETING', 'START_DETECTOR']);
    expect(r.state.idleGreetCount).toBe(1);
  });

  it('🔴 재생 중(activeSeq 존재)에는 발동하지 않는다 — 겹침 0', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const r = handsFreeReducer(s1, { type: 'IDLE_TIMEOUT' });
    expect(r.state.phase).toBe('sending');
    expect(r.effects).toEqual([]);
  });

  it('사용자가 말하는 중에는 발동하지 않는다', () => {
    const s1 = handsFreeReducer(live(), { type: 'USER_SPEECH_START' }).state;
    expect(handsFreeReducer(s1, { type: 'IDLE_TIMEOUT' }).effects).toEqual([]);
  });

  it('paused 에서는 발동하지 않는다', () => {
    const s1 = handsFreeReducer(live(), { type: 'MIC_OFF' }).state;
    expect(handsFreeReducer(s1, { type: 'IDLE_TIMEOUT' }).effects).toEqual([]);
  });

  it('2회까지만 발동하고 그 뒤로는 중단한다', () => {
    const s1 = { ...live(), idleGreetCount: 2 };
    expect(handsFreeReducer(s1, { type: 'IDLE_TIMEOUT' }).effects).toEqual([]);
  });

  it('사용자가 말하면 카운터가 리셋된다', () => {
    const s1 = { ...live(), idleGreetCount: 2 };
    const s2 = handsFreeReducer(s1, { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(s2.idleGreetCount).toBe(0);
  });

  it('지연 스케줄은 30초 → 60초 이다', () => {
    expect(IDLE_GREET_DELAYS_MS).toEqual([30000, 60000]);
  });

  it('격리: phase 는 listening 인데 activeSeq 만 남아있으면(진행 중 발화) 발동하지 않는다', () => {
    const s1 = { ...live(), activeSeq: 5 };
    const r = handsFreeReducer(s1, { type: 'IDLE_TIMEOUT' });
    expect(r.state).toBe(s1);
    expect(r.effects).toEqual([]);
  });

  it('격리: phase 는 listening 인데 micOn 만 false 이면 발동하지 않는다', () => {
    const s1 = { ...live(), micOn: false };
    const r = handsFreeReducer(s1, { type: 'IDLE_TIMEOUT' });
    expect(r.state).toBe(s1);
    expect(r.effects).toEqual([]);
  });

  it('연속 발동 end-to-end: 1차(0→1) → listening 복귀 → 2차(1→2) → listening 복귀 → 3차는 차단', () => {
    const r1 = handsFreeReducer(live(), { type: 'IDLE_TIMEOUT' });
    expect(r1.state.phase).toBe('interrupting');
    expect(r1.state.idleGreetCount).toBe(1);

    const s2 = handsFreeReducer(r1.state, { type: 'RESPONSE_DONE', seq: r1.state.activeSeq! }).state;
    expect(s2.phase).toBe('listening');
    expect(s2.idleGreetCount).toBe(1);

    const r2 = handsFreeReducer(s2, { type: 'IDLE_TIMEOUT' });
    expect(r2.state.phase).toBe('interrupting');
    expect(r2.state.idleGreetCount).toBe(2);

    const s3 = handsFreeReducer(r2.state, { type: 'RESPONSE_DONE', seq: r2.state.activeSeq! }).state;
    expect(s3.phase).toBe('listening');
    expect(s3.idleGreetCount).toBe(2);

    const r3 = handsFreeReducer(s3, { type: 'IDLE_TIMEOUT' });
    expect(r3.state.phase).toBe('listening');
    expect(r3.state.idleGreetCount).toBe(2);
    expect(r3.effects).toEqual([]);
  });

  it('confirmGate=true(confirming) 경로에서도 FINAL_RESULT 가 idleGreetCount 를 리셋한다', () => {
    const s0 = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE', confirmGate: true }).state;
    const s1 = { ...s0, idleGreetCount: 2 };
    const r = handsFreeReducer(s1, { type: 'FINAL_RESULT', text: '안녕' });
    expect(r.state.phase).toBe('confirming');
    expect(r.state.idleGreetCount).toBe(0);
  });
});

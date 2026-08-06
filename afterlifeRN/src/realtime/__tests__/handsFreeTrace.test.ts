import { handsFreeReducer, initHandsFreeState, type HandsFreeState } from '../handsFree';
import { traceDispatch, classifyInterrupt, head20 } from '../handsFreeTrace';
import { clearTimingEvents, getTimingEvents, __setTimingClock } from '../timingEvents';

const run = (state: HandsFreeState, ev: Parameters<typeof handsFreeReducer>[1]) => {
  const r = handsFreeReducer(state, ev);
  traceDispatch(state, r.state, ev, r.effects);
  return r;
};

describe('handsFreeTrace (관찰 전용 계측)', () => {
  beforeEach(() => { __setTimingClock(() => 0); clearTimingEvents(); });

  it('상태가 안 바뀐 dispatch 는 fsm 을 쏘지 않는다(중복 emit 금지)', () => {
    const s = initHandsFreeState(); 
    run(s, { type: 'USER_SPEECH_START' }); 
    expect(getTimingEvents()).toHaveLength(0);
  });

  it('phase 가 바뀌면 fsm 을 from/to/ev/effects 와 함께 쏜다', () => {
    run(initHandsFreeState(), { type: 'CALL_LIVE' });
    const evs = getTimingEvents();
    expect(evs).toHaveLength(1);
    expect(evs[0].type).toBe('fsm');
    expect(evs[0].detail).toMatchObject({ from: 'idle', to: 'listening', ev: 'CALL_LIVE', effects: 'START_STT' });
  });

  it('seq 불일치 신호는 seq_drop 으로 남는다(리듀서가 무시한 것 포함)', () => {
    let s = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;
    s = handsFreeReducer(s, { type: 'FINAL_RESULT', text: '안녕' }).state; 
    clearTimingEvents();
    const r = run(s, { type: 'SPEECH_START', seq: 99 });
    expect(r.state).toBe(s); 
    const drops = getTimingEvents().filter((e) => e.type === 'seq_drop');
    expect(drops).toHaveLength(1);
    expect(drops[0].detail).toMatchObject({ sig: 'speech_start', got: 99, want: 1 });
  });

  it('인터럽트 적재/즉시발화/폐기를 act 로 분류한다', () => {
    const listening = handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;

    const now = handsFreeReducer(listening, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p1' });
    expect(classifyInterrupt(listening, now.state, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p1' }, now.effects))
      .toMatchObject({ act: 'say_now' });

    const speaking = { ...listening, userSpeaking: true };
    const queued = handsFreeReducer(speaking, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p2' });
    expect(classifyInterrupt(speaking, queued.state, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p2' }, queued.effects))
      .toMatchObject({ act: 'queued', faceKey: 'p2' });

    const expired = handsFreeReducer(queued.state, { type: 'INTERRUPT_EXPIRED', faceKey: 'p2' });
    expect(classifyInterrupt(queued.state, expired.state, { type: 'INTERRUPT_EXPIRED', faceKey: 'p2' }, expired.effects))
      .toMatchObject({ act: 'expired', faceKey: 'p2' });
  });

  it('head20 은 발화 앞 20자만 남긴다', () => {
    expect(head20('a'.repeat(30))).toHaveLength(20);
    expect(head20(undefined)).toBe('');
  });

  it('__DEV__ 가 false 면 아무 것도 emit 하지 않는다', () => {
    const original = (global as any).__DEV__;
    (global as any).__DEV__ = false;
    run(initHandsFreeState(), { type: 'CALL_LIVE' });
    (global as any).__DEV__ = original;
    expect(getTimingEvents()).toHaveLength(0);
  });
});

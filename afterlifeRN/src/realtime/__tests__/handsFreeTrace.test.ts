import { v_6920f0, v_3075fa, type v_8cc739 } from '../handsFree';
import { v_6a1ed9, v_bbb49e, v_4069c9 } from '../handsFreeTrace';
import { v_8c24f4, v_08004c, v_94a663 } from '../timingEvents';

const v_d9b231 = (state: v_8cc739, ev: Parameters<typeof v_6920f0>[1]) => {
  const v_cb35cb = v_6920f0(v_b6e533, v_1d299c);
  v_6a1ed9(v_b6e533, v_cb35cb.state, v_1d299c, v_cb35cb.effects);
  return v_cb35cb;
};

describe('handsFreeTrace (관찰 전용 계측)', () => {
  beforeEach(() => { v_94a663(() => 0); v_8c24f4(); });

  it('상태가 안 바뀐 dispatch 는 fsm 을 쏘지 않는다(중복 emit 금지)', () => {
    const v_fd5f43 = v_3075fa(); 
    v_d9b231(v_fd5f43, { type: 'USER_SPEECH_START' }); 
    expect(v_08004c()).toHaveLength(0);
  });

  it('phase 가 바뀌면 fsm 을 from/to/ev/effects 와 함께 쏜다', () => {
    v_d9b231(v_3075fa(), { type: 'CALL_LIVE' });
    const v_7866ae = v_08004c();
    expect(v_7866ae).toHaveLength(1);
    expect(v_7866ae[0].type).toBe('fsm');
    expect(v_7866ae[0].detail).toMatchObject({ from: 'idle', to: 'listening', ev: 'CALL_LIVE', effects: 'START_STT' });
  });

  it('seq 불일치 신호는 seq_drop 으로 남는다(리듀서가 무시한 것 포함)', () => {
    let v_fd5f43 = v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;
    v_fd5f43 = v_6920f0(v_fd5f43, { type: 'FINAL_RESULT', text: '안녕' }).state; 
    v_8c24f4();
    const v_cb35cb = v_d9b231(v_fd5f43, { type: 'SPEECH_START', seq: 99 });
    expect(v_cb35cb.state).toBe(v_fd5f43); 
    const v_8fb8fa = v_08004c().filter((v_9e86fd) => v_9e86fd.type === 'seq_drop');
    expect(v_8fb8fa).toHaveLength(1);
    expect(v_8fb8fa[0].detail).toMatchObject({ sig: 'speech_start', got: 99, want: 1 });
  });

  it('인터럽트 적재/즉시발화/폐기를 act 로 분류한다', () => {
    const v_177ff2 = v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;

    const v_5c2f9f = v_6920f0(v_177ff2, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p1' });
    expect(v_bbb49e(v_177ff2, v_5c2f9f.state, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p1' }, v_5c2f9f.effects))
      .toMatchObject({ act: 'say_now' });

    const v_8672be = { ...v_177ff2, userSpeaking: true };
    const v_539297 = v_6920f0(v_8672be, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p2' });
    expect(v_bbb49e(v_8672be, v_539297.state, { type: 'FACE_INTERRUPT', text: '안녕', faceKey: 'p2' }, v_539297.effects))
      .toMatchObject({ act: 'queued', faceKey: 'p2' });

    const v_2699db = v_6920f0(v_539297.state, { type: 'INTERRUPT_EXPIRED', faceKey: 'p2' });
    expect(v_bbb49e(v_539297.state, v_2699db.state, { type: 'INTERRUPT_EXPIRED', faceKey: 'p2' }, v_2699db.effects))
      .toMatchObject({ act: 'expired', faceKey: 'p2' });
  });

  it('head20 은 발화 앞 20자만 남긴다', () => {
    expect(v_4069c9('a'.repeat(30))).toHaveLength(20);
    expect(v_4069c9(undefined)).toBe('');
  });

  it('__DEV__ 가 false 면 아무 것도 emit 하지 않는다', () => {
    const v_f7fd54 = (global as any).__DEV__;
    (global as any).__DEV__ = false;
    v_d9b231(v_3075fa(), { type: 'CALL_LIVE' });
    (global as any).__DEV__ = v_f7fd54;
    expect(v_08004c()).toHaveLength(0);
  });
});

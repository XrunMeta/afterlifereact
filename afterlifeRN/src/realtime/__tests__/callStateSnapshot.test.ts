import {
  v_f983f2, v_fe1d77, v_2aa637, v_cfefae, v_b952e6, v_368fda,
} from '../callStateSnapshot';
import type { v_c56f36 } from '../timingEvents';

const v_1d299c = (type: v_c56f36['type'], v_17bb72, detail?: v_c56f36['detail']): v_c56f36 =>
  (v_3cfdfc ? { type: v_3b27d9, tMs: v_17bb72, detail: v_3cfdfc } : { type: v_3b27d9, tMs: v_17bb72 });

const v_14e822 = (v_17bb72, v_a13c2e, v_257132, v_b2b35d, v_f91f33 = {}) =>
  v_1d299c('fsm', v_17bb72, {
    from: v_a13c2e, to: v_257132, ev: v_b2b35d, effects: '', micOn: true, spk: false,
    aseq: null, nseq: 1, pseq: null, pi: null, pit: 0, greet: 0, gmax: 2, ...v_f91f33,
  });

describe('callStateSnapshot fold', () => {
  it('fsm 이벤트로 스냅샷(phase/mic/seq/pending)을 갱신한다', () => {
    const v_35f85c = v_fe1d77(v_f983f2(), v_14e822(0, 'listening', 'sending', 'FINAL_RESULT', {
      effects: 'STOP_STT|SAY|START_DETECTOR', aseq: 3, nseq: 4, pi: 'p12', pit: 1, greet: 1,
    }), 1000);
    expect(v_35f85c.phase).toBe('sending');
    expect(v_35f85c.activeSeq).toBe(3);
    expect(v_35f85c.nextSeq).toBe(4);
    expect(v_35f85c.pendingFace).toBe('p12');
    expect(v_35f85c.pendingTurns).toBe(1);
    expect(v_35f85c.idleGreet).toBe(1);
    expect(v_35f85c.detector).toBe(true); 
  });

  it('tx→rx(start/end)→DONE 을 같은 seq 로 묶고 경과 ms 를 붙인다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('tx', 0, { mode: 'speak', seq: 3, text: '안녕하세요, 듣고', eff: 'SAY_INTERRUPT' }), 0);
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('rx', 142, { sig: 'speech_start', seq: 3, srvSeq: 3 }), 142);
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('rx', 1830, { sig: 'speech_end', seq: 3, srvSeq: 3, remainingMs: 340 }), 1830);
    v_35f85c = v_fe1d77(v_35f85c, v_14e822(2210, 'speaking', 'listening', 'RESPONSE_DONE', { pseq: 3 }), 2210);

    const v_8adfb8 = v_35f85c.rows.map((v_cb35cb) => v_cb35cb.text);
    expect(v_8adfb8[0]).toContain('→speak#3');
    expect(v_8adfb8[1]).toContain('←start#3');
    expect(v_8adfb8[1]).toContain('+142');
    expect(v_8adfb8[2]).toContain('←end#3');
    expect(v_8adfb8[2]).toContain('rem:340');
    expect(v_8adfb8[3]).toContain('⇒DONE#3');

    expect(v_35f85c.rows[1].indent).toBe(true);
    expect(v_35f85c.rows[0].indent).toBe(false);

    expect(v_35f85c.lastTx).toMatchObject({ seq: 3, startMs: 142, endMs: 1830, doneMs: 2210 });
  });

  it('seq_drop 은 warn 톤 행 + 카운터로 남는다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('seq_drop', 10, { sig: 'speech_start', got: 3, want: 4 }), 10);
    expect(v_35f85c.seqDrops).toBe(1);
    expect(v_35f85c.rows[0].tone).toBe('warn');
    expect(v_35f85c.rows[0].text).toContain('✗drop start#3(want:4)');
  });

  it('타이머 set 은 스냅샷 잔여만, fire 는 타임라인 행까지 남긴다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('timer', 0, { name: 'watchdog', action: 'set', ms: 30000 }), 1_000_000);
    expect(v_35f85c.timers.watchdog).toBe(1_030_000);
    expect(v_35f85c.rows).toHaveLength(0); 
    expect(v_b952e6(v_35f85c.timers.watchdog, 1_017_600)).toBe('12.4s');

    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('timer', 100, { name: 'watchdog', action: 'fire' }), 1_030_000);
    expect(v_35f85c.timers.watchdog).toBeNull();
    expect(v_35f85c.rows[0].text).toContain('⏰wd fired');

    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('timer', 200, { name: 'nope', action: 'set', ms: 5 }), 1_030_100);
    expect(v_35f85c.rows).toHaveLength(1); 
  });

  it('avatar phase 는 스냅샷만, busy_throw 는 경고 행을 남긴다', () => {
    let v_35f85c = v_fe1d77(v_f983f2(), v_1d299c('avatar', 0, { phase: 'speaking' }), 0);
    expect(v_35f85c.avatarPhase).toBe('speaking');
    expect(v_35f85c.rows).toHaveLength(0);
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('avatar', 5, { phase: 'speaking', act: 'busy_throw' }), 5);
    expect(v_35f85c.avatarBusy).toBe(1);
    expect(v_35f85c.rows[0].tone).toBe('warn');
  });

  it('오디오 축 이벤트(stt_open 등)는 모델을 바꾸지 않는다(동일 참조)', () => {
    const v_35f85c = v_f983f2();
    expect(v_fe1d77(v_35f85c, v_1d299c('stt_open', 0), 0)).toBe(v_35f85c);
  });

  it('formatStateLines 는 phase·타이머 잔여·왕복 요약을 노출한다', () => {
    let v_35f85c = v_2aa637(v_f983f2(), [
      v_14e822(0, 'idle', 'listening', 'CALL_LIVE', { aseq: null, nseq: 4, effects: 'START_STT' }),
      v_1d299c('timer', 0, { name: 'interruptExpire', action: 'set', ms: 15000 }),
      v_1d299c('tx', 0, { mode: 'say', seq: 4, text: '오늘 날씨가', eff: 'SAY' }),
    ], 1_000_000);
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('avatar', 1, { phase: 'sending' }), 1_000_000);
    const v_a52412 = v_cfefae(v_35f85c, 1_006_900);
    expect(v_a52412[0]).toContain('listening');
    expect(v_a52412.join('\n')).toContain('ex:8.1s');
    expect(v_a52412.join('\n')).toContain('tx#4 say s:— e:—');
    expect(v_a52412.join('\n')).toContain('avt  sending');
  });

  it('clipText 는 긴 발화를 잘라 준다', () => {
    expect(v_368fda('12345678901234', 10)).toBe('1234567890…');
    expect(v_368fda('짧다')).toBe('짧다');
  });
});

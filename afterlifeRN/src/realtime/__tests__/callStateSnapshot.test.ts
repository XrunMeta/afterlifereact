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

  it('seq 가 양쪽 다 null 이면 tx/rx/DONE 을 짝짓지 않는다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('tx', 0, { mode: 'greet', seq: null, text: '', eff: 'GREET' }), 0);
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('rx', 900, { sig: 'speech_start', seq: null, srvSeq: 2 }), 900);
    v_35f85c = v_fe1d77(v_35f85c, v_14e822(3000, 'speaking', 'listening', 'RESPONSE_DONE', { pseq: null }), 3000);
    expect(v_35f85c.lastTx).toMatchObject({ seq: null, startMs: null, endMs: null, doneMs: null });
    expect(v_cfefae(v_35f85c, 3000).join('\n')).toContain('tx#? greet s:— e:— d:—');
    expect(v_35f85c.rows[1].text).toContain('←start#?'); 
  });

  it('clipText 는 긴 발화를 잘라 준다', () => {
    expect(v_368fda('12345678901234', 10)).toBe('1234567890…');
    expect(v_368fda('짧다')).toBe('짧다');
  });
});

describe('stage fold(단계별 소요시간)', () => {
  const v_2ae4e7 = (v_17bb72, v_1833e7, v_662e68, v_1923e2 = 5, v_34d5e3 = '') =>
    v_1d299c('stage', v_17bb72, { stage: v_1833e7, seq: v_1923e2, tMs: v_662e68, info: v_34d5e3 });

  it('단계별 소요시간(직전 단계로부터의 델타)을 행으로 남긴다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('tx', 0, { mode: 'say', seq: 5, text: '그러니까 내가 궁금', eff: 'SAY' }), 0);
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(8420, 'llm_done', 8420, 5, 'chars:142'), 8420);
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(8430, 'tts_start', 8420, 5), 8430);
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(11540, 'tts_done', 11530, 5, 'audio:9200'), 11540);
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(11550, 'render_start', 11530, 5), 11550);
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(21420, 'render_done', 21410, 5, 'frames:248'), 21420);
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('rx', 21750, { sig: 'speech_start', seq: 5, srvSeq: 5 }), 21750);

    const v_8adfb8 = v_35f85c.rows.map((v_cb35cb) => v_cb35cb.text);

    expect(v_8adfb8[1]).toBe(' ⚙llm_done +8420ms chars:142'); 
    expect(v_8adfb8[2]).toBe(' ⚙tts +3110ms audio:9200');     
    expect(v_8adfb8[3]).toBe(' ⚙render +9880ms frames:248');  
    expect(v_8adfb8[4]).toContain('←start#5');
    expect(v_35f85c.rows[1].indent).toBe(true);
  });

  it('stream_start/stream_end 도 같은 규칙(_end 접미사)으로 묶인다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(0, 'stream_start', 21410), 0);
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(240, 'stream_end', 21650, 5, 'queued:12000'), 240);
    expect(v_35f85c.rows[0].text).toBe(' ⚙stream +240ms queued:12000');
  });

  it('모르는 stage 이름도 직전 단계 기준 델타로 그냥 한 줄 남긴다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(0, 'llm_done', 100), 0);
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(10, 'brand_new_step', 350, 5, 'x:1'), 10);
    expect(v_35f85c.rows[1].text).toBe(' ⚙brand_new_step +250ms x:1');
  });

  it('tMs 가 없으면 델타를 "?" 로 표기하고 깨지지 않는다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('stage', 0, { stage: 'llm_done', seq: null, tMs: null, info: '' }), 0);
    expect(v_35f85c.rows[0].text).toBe(' ⚙llm_done +?ms');
  });

  it('stage 이름이 비면 무시(모델 불변)', () => {
    const v_9bea57 = v_f983f2();
    expect(v_fe1d77(v_9bea57, v_1d299c('stage', 0, { stage: '', seq: 1, tMs: 1, info: '' }), 0)).toBe(v_9bea57);
  });

  it('턴이 바뀌면(서버 seq 변화·새 tx) 누적 기준이 리셋된다', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(0, 'llm_done', 8000, 5), 0);

    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(10, 'llm_done', 900, 6), 10);
    expect(v_35f85c.rows[1].text).toBe(' ⚙llm_done +900ms');

    v_35f85c = v_fe1d77(v_35f85c, v_1d299c('tx', 20, { mode: 'say', seq: 7, text: '', eff: 'SAY' }), 20);
    expect(v_35f85c.stageAtMs).toBeNull();
    expect(v_35f85c.lastStage).toBeNull();
  });

  it('stage 는 상태머신 스냅샷(phase/seq/타이머)을 건드리지 않는다 — 관측 전용', () => {
    let v_35f85c = v_fe1d77(v_f983f2(), v_14e822(0, 'sending', 'speaking', 'SPEECH_START', { aseq: 5 }), 0);
    const v_e98932 = { phase: v_35f85c.phase, activeSeq: v_35f85c.activeSeq, timers: v_35f85c.timers, seqDrops: v_35f85c.seqDrops };
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(10, 'render_done', 900, 5, 'frames:10'), 10);
    expect({ phase: v_35f85c.phase, activeSeq: v_35f85c.activeSeq, timers: v_35f85c.timers, seqDrops: v_35f85c.seqDrops }).toEqual(v_e98932);
  });

  it('스냅샷 stg 줄에 마지막 단계와 턴 경과가 보인다(어디서 멈췄나)', () => {
    let v_35f85c = v_f983f2();
    v_35f85c = v_fe1d77(v_35f85c, v_2ae4e7(0, 'render_start', 11530), 0);
    expect(v_cfefae(v_35f85c, 0).join('\n')).toContain('stg  render_start @11530ms');
    expect(v_cfefae(v_f983f2(), 0).join('\n')).toContain('stg  —');
  });
});

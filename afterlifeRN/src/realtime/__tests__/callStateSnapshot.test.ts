import {
  initCallStateModel, foldTimingEvent, foldAll, formatStateLines, formatRemain, clipText,
} from '../callStateSnapshot';
import type { TimingEvent } from '../timingEvents';

const ev = (type: TimingEvent['type'], tMs: number, detail?: TimingEvent['detail']): TimingEvent =>
  (detail ? { type, tMs, detail } : { type, tMs });

const fsm = (tMs: number, from: string, to: string, evName: string, extra: Record<string, any> = {}) =>
  ev('fsm', tMs, {
    from, to, ev: evName, effects: '', micOn: true, spk: false,
    aseq: null, nseq: 1, pseq: null, pi: null, pit: 0, greet: 0, gmax: 2, ...extra,
  });

describe('callStateSnapshot fold', () => {
  it('fsm 이벤트로 스냅샷(phase/mic/seq/pending)을 갱신한다', () => {
    const m = foldTimingEvent(initCallStateModel(), fsm(0, 'listening', 'sending', 'FINAL_RESULT', {
      effects: 'STOP_STT|SAY|START_DETECTOR', aseq: 3, nseq: 4, pi: 'p12', pit: 1, greet: 1,
    }), 1000);
    expect(m.phase).toBe('sending');
    expect(m.activeSeq).toBe(3);
    expect(m.nextSeq).toBe(4);
    expect(m.pendingFace).toBe('p12');
    expect(m.pendingTurns).toBe(1);
    expect(m.idleGreet).toBe(1);
    expect(m.detector).toBe(true); 
  });

  it('tx→rx(start/end)→DONE 을 같은 seq 로 묶고 경과 ms 를 붙인다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, ev('tx', 0, { mode: 'speak', seq: 3, text: '안녕하세요, 듣고', eff: 'SAY_INTERRUPT' }), 0);
    m = foldTimingEvent(m, ev('rx', 142, { sig: 'speech_start', seq: 3, srvSeq: 3 }), 142);
    m = foldTimingEvent(m, ev('rx', 1830, { sig: 'speech_end', seq: 3, srvSeq: 3, remainingMs: 340 }), 1830);
    m = foldTimingEvent(m, fsm(2210, 'speaking', 'listening', 'RESPONSE_DONE', { pseq: 3 }), 2210);

    const texts = m.rows.map((r) => r.text);
    expect(texts[0]).toContain('→speak#3');
    expect(texts[1]).toContain('←start#3');
    expect(texts[1]).toContain('+142');
    expect(texts[2]).toContain('←end#3');
    expect(texts[2]).toContain('rem:340');
    expect(texts[3]).toContain('⇒DONE#3');

    expect(m.rows[1].indent).toBe(true);
    expect(m.rows[0].indent).toBe(false);

    expect(m.lastTx).toMatchObject({ seq: 3, startMs: 142, endMs: 1830, doneMs: 2210 });
  });

  it('seq_drop 은 warn 톤 행 + 카운터로 남는다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, ev('seq_drop', 10, { sig: 'speech_start', got: 3, want: 4 }), 10);
    expect(m.seqDrops).toBe(1);
    expect(m.rows[0].tone).toBe('warn');
    expect(m.rows[0].text).toContain('✗drop start#3(want:4)');
  });

  it('타이머 set 은 스냅샷 잔여만, fire 는 타임라인 행까지 남긴다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, ev('timer', 0, { name: 'watchdog', action: 'set', ms: 30000 }), 1_000_000);
    expect(m.timers.watchdog).toBe(1_030_000);
    expect(m.rows).toHaveLength(0); 
    expect(formatRemain(m.timers.watchdog, 1_017_600)).toBe('12.4s');

    m = foldTimingEvent(m, ev('timer', 100, { name: 'watchdog', action: 'fire' }), 1_030_000);
    expect(m.timers.watchdog).toBeNull();
    expect(m.rows[0].text).toContain('⏰wd fired');

    m = foldTimingEvent(m, ev('timer', 200, { name: 'nope', action: 'set', ms: 5 }), 1_030_100);
    expect(m.rows).toHaveLength(1); 
  });

  it('avatar phase 는 스냅샷만, busy_throw 는 경고 행을 남긴다', () => {
    let m = foldTimingEvent(initCallStateModel(), ev('avatar', 0, { phase: 'speaking' }), 0);
    expect(m.avatarPhase).toBe('speaking');
    expect(m.rows).toHaveLength(0);
    m = foldTimingEvent(m, ev('avatar', 5, { phase: 'speaking', act: 'busy_throw' }), 5);
    expect(m.avatarBusy).toBe(1);
    expect(m.rows[0].tone).toBe('warn');
  });

  it('오디오 축 이벤트(stt_open 등)는 모델을 바꾸지 않는다(동일 참조)', () => {
    const m = initCallStateModel();
    expect(foldTimingEvent(m, ev('stt_open', 0), 0)).toBe(m);
  });

  it('formatStateLines 는 phase·타이머 잔여·왕복 요약을 노출한다', () => {
    let m = foldAll(initCallStateModel(), [
      fsm(0, 'idle', 'listening', 'CALL_LIVE', { aseq: null, nseq: 4, effects: 'START_STT' }),
      ev('timer', 0, { name: 'interruptExpire', action: 'set', ms: 15000 }),
      ev('tx', 0, { mode: 'say', seq: 4, text: '오늘 날씨가', eff: 'SAY' }),
    ], 1_000_000);
    m = foldTimingEvent(m, ev('avatar', 1, { phase: 'sending' }), 1_000_000);
    const lines = formatStateLines(m, 1_006_900);
    expect(lines[0]).toContain('listening');
    expect(lines.join('\n')).toContain('ex:8.1s');
    expect(lines.join('\n')).toContain('tx#4 say s:— e:—');
    expect(lines.join('\n')).toContain('avt  sending');
  });

  it('seq 가 양쪽 다 null 이면 tx/rx/DONE 을 짝짓지 않는다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, ev('tx', 0, { mode: 'greet', seq: null, text: '', eff: 'GREET' }), 0);
    m = foldTimingEvent(m, ev('rx', 900, { sig: 'speech_start', seq: null, srvSeq: 2 }), 900);
    m = foldTimingEvent(m, fsm(3000, 'speaking', 'listening', 'RESPONSE_DONE', { pseq: null }), 3000);
    expect(m.lastTx).toMatchObject({ seq: null, startMs: null, endMs: null, doneMs: null });
    expect(formatStateLines(m, 3000).join('\n')).toContain('tx#? greet s:— e:— d:—');
    expect(m.rows[1].text).toContain('←start#?'); 
  });

  it('clipText 는 긴 발화를 잘라 준다', () => {
    expect(clipText('12345678901234', 10)).toBe('1234567890…');
    expect(clipText('짧다')).toBe('짧다');
  });
});

describe('stage fold(단계별 소요시간)', () => {
  const stage = (tMs: number, name: string, srvTMs: number, seq: number | null = 5, info = '') =>
    ev('stage', tMs, { stage: name, seq, tMs: srvTMs, info });

  it('단계별 소요시간(직전 단계로부터의 델타)을 행으로 남긴다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, ev('tx', 0, { mode: 'say', seq: 5, text: '그러니까 내가 궁금', eff: 'SAY' }), 0);
    m = foldTimingEvent(m, stage(8420, 'llm_done', 8420, 5, 'chars:142'), 8420);
    m = foldTimingEvent(m, stage(8430, 'tts_start', 8420, 5), 8430);
    m = foldTimingEvent(m, stage(11540, 'tts_done', 11530, 5, 'audio:9200'), 11540);
    m = foldTimingEvent(m, stage(11550, 'render_start', 11530, 5), 11550);
    m = foldTimingEvent(m, stage(21420, 'render_done', 21410, 5, 'frames:248'), 21420);
    m = foldTimingEvent(m, ev('rx', 21750, { sig: 'speech_start', seq: 5, srvSeq: 5 }), 21750);

    const texts = m.rows.map((r) => r.text);

    expect(texts[1]).toBe(' ⚙llm_done +8420ms chars:142'); 
    expect(texts[2]).toBe(' ⚙tts +3110ms audio:9200');     
    expect(texts[3]).toBe(' ⚙render +9880ms frames:248');  
    expect(texts[4]).toContain('←start#5');
    expect(m.rows[1].indent).toBe(true);
  });

  it('stream_start/stream_end 도 같은 규칙(_end 접미사)으로 묶인다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, stage(0, 'stream_start', 21410), 0);
    m = foldTimingEvent(m, stage(240, 'stream_end', 21650, 5, 'queued:12000'), 240);
    expect(m.rows[0].text).toBe(' ⚙stream +240ms queued:12000');
  });

  it('모르는 stage 이름도 직전 단계 기준 델타로 그냥 한 줄 남긴다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, stage(0, 'llm_done', 100), 0);
    m = foldTimingEvent(m, stage(10, 'brand_new_step', 350, 5, 'x:1'), 10);
    expect(m.rows[1].text).toBe(' ⚙brand_new_step +250ms x:1');
  });

  it('tMs 가 없으면 델타를 "?" 로 표기하고 깨지지 않는다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, ev('stage', 0, { stage: 'llm_done', seq: null, tMs: null, info: '' }), 0);
    expect(m.rows[0].text).toBe(' ⚙llm_done +?ms');
  });

  it('stage 이름이 비면 무시(모델 불변)', () => {
    const m0 = initCallStateModel();
    expect(foldTimingEvent(m0, ev('stage', 0, { stage: '', seq: 1, tMs: 1, info: '' }), 0)).toBe(m0);
  });

  it('턴이 바뀌면(서버 seq 변화·새 tx) 누적 기준이 리셋된다', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, stage(0, 'llm_done', 8000, 5), 0);

    m = foldTimingEvent(m, stage(10, 'llm_done', 900, 6), 10);
    expect(m.rows[1].text).toBe(' ⚙llm_done +900ms');

    m = foldTimingEvent(m, ev('tx', 20, { mode: 'say', seq: 7, text: '', eff: 'SAY' }), 20);
    expect(m.stageAtMs).toBeNull();
    expect(m.lastStage).toBeNull();
  });

  it('stage 는 상태머신 스냅샷(phase/seq/타이머)을 건드리지 않는다 — 관측 전용', () => {
    let m = foldTimingEvent(initCallStateModel(), fsm(0, 'sending', 'speaking', 'SPEECH_START', { aseq: 5 }), 0);
    const before = { phase: m.phase, activeSeq: m.activeSeq, timers: m.timers, seqDrops: m.seqDrops };
    m = foldTimingEvent(m, stage(10, 'render_done', 900, 5, 'frames:10'), 10);
    expect({ phase: m.phase, activeSeq: m.activeSeq, timers: m.timers, seqDrops: m.seqDrops }).toEqual(before);
  });

  it('스냅샷 stg 줄에 마지막 단계와 턴 경과가 보인다(어디서 멈췄나)', () => {
    let m = initCallStateModel();
    m = foldTimingEvent(m, stage(0, 'render_start', 11530), 0);
    expect(formatStateLines(m, 0).join('\n')).toContain('stg  render_start @11530ms');
    expect(formatStateLines(initCallStateModel(), 0).join('\n')).toContain('stg  —');
  });
});

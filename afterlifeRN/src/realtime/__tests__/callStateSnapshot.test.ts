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

  it('clipText 는 긴 발화를 잘라 준다', () => {
    expect(clipText('12345678901234', 10)).toBe('1234567890…');
    expect(clipText('짧다')).toBe('짧다');
  });
});

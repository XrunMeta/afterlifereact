import {
  extractCloneAudioLevel,
  cloneSilenceStep,
  initCloneSilenceState,
  DEFAULT_CLONE_SILENCE_CONFIG as CFG,
} from '../../src/realtime/cloneSilence';

function report(stats: Array<Record<string, unknown>>): Iterable<[string, Record<string, unknown>]> {
  return stats.map((s, i) => [String(i), s] as [string, Record<string, unknown>]);
}

describe('extractCloneAudioLevel', () => {
  it('inbound-rtp audio의 audioLevel을 반환', () => {
    const r = report([
      { type: 'inbound-rtp', kind: 'video', framesDecoded: 10 },
      { type: 'inbound-rtp', kind: 'audio', audioLevel: 0.42 },
    ]);
    expect(extractCloneAudioLevel(r)).toBe(0.42);
  });
  it('audio inbound 있으나 audioLevel 미노출 → undefined', () => {
    expect(extractCloneAudioLevel(report([{ type: 'inbound-rtp', kind: 'audio' }]))).toBeUndefined();
  });
  it('audio inbound 자체 없음 → undefined', () => {
    expect(extractCloneAudioLevel(report([{ type: 'inbound-rtp', kind: 'video' }]))).toBeUndefined();
  });
  it('null report → undefined', () => {
    expect(extractCloneAudioLevel(null)).toBeUndefined();
  });
});

describe('cloneSilenceStep', () => {
  it('awaiting: 소리 들리면 active로, 무음 카운터 0', () => {
    const s0 = initCloneSilenceState();
    const s1 = cloneSilenceStep(s0, 0.5, 200, CFG);
    expect(s1.phase).toBe('active');
  });

  it('active: 무음이 silenceHoldMs 연속 → ended', () => {
    let s = initCloneSilenceState();
    s = cloneSilenceStep(s, 0.5, 200, CFG); 
    for (let i = 0; i < 6; i++) s = cloneSilenceStep(s, 0.0, 200, CFG);
    expect(s.phase).toBe('ended');
  });

  it('active: 무음 도중 소리 재개 → 무음 카운터 리셋, ended 안 됨', () => {
    let s = initCloneSilenceState();
    s = cloneSilenceStep(s, 0.5, 200, CFG); 
    for (let i = 0; i < 5; i++) s = cloneSilenceStep(s, 0.0, 200, CFG); 
    s = cloneSilenceStep(s, 0.5, 200, CFG); 
    expect(s.phase).toBe('active');
    expect(s.silenceMs).toBe(0);
  });

  it('awaiting: awaitingTimeoutMs 내 소리 없으면 ended(응답 없음)', () => {
    let s = initCloneSilenceState();
    const ticks = Math.ceil(CFG.awaitingTimeoutMs / 200);
    for (let i = 0; i < ticks; i++) s = cloneSilenceStep(s, 0.0, 200, CFG);
    expect(s.phase).toBe('ended');
  });

  it('fallback: level=undefined면 fallbackWaitMs 후 ended', () => {
    let s = initCloneSilenceState();
    const ticks = Math.ceil(CFG.fallbackWaitMs / 200);
    for (let i = 0; i < ticks; i++) s = cloneSilenceStep(s, undefined, 200, CFG);
    expect(s.phase).toBe('ended');
    expect(s.fallback).toBe(true);
  });

  it('maxWaitMs 안전망: active로 길게 떠들어도 maxWait 초과 시 ended', () => {
    let s = initCloneSilenceState();
    s = cloneSilenceStep(s, 0.5, 200, CFG);
    const ticks = Math.ceil(CFG.maxWaitMs / 200);
    for (let i = 0; i < ticks; i++) s = cloneSilenceStep(s, 0.5, 200, CFG);
    expect(s.phase).toBe('ended');
  });

  it('ended 상태는 멱등(추가 step에도 ended 유지)', () => {
    let s = initCloneSilenceState();
    s = cloneSilenceStep(s, 0.5, 200, CFG);
    for (let i = 0; i < 6; i++) s = cloneSilenceStep(s, 0.0, 200, CFG);
    const ended = s;
    s = cloneSilenceStep(s, 0.5, 200, CFG);
    expect(s).toBe(ended);
  });
});

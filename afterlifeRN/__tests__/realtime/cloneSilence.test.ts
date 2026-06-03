import {
  v_7be8d9,
  v_c506a5,
  v_396b87,
  v_ccce9c as v_45b7fa,
} from '../../src/realtime/cloneSilence';

function v_2888b4(v_62676b): Iterable<[string, Record<string, unknown>]> {
  return v_62676b.map((v_fd5f43, v_ebec57) => [String(v_ebec57), v_fd5f43] as [string, Record<string, unknown>]);
}

describe('extractCloneAudioLevel', () => {
  it('inbound-rtp audio의 audioLevel을 반환', () => {
    const v_cb35cb = v_2888b4([
      { type: 'inbound-rtp', kind: 'video', framesDecoded: 10 },
      { type: 'inbound-rtp', kind: 'audio', audioLevel: 0.42 },
    ]);
    expect(v_7be8d9(v_cb35cb)).toBe(0.42);
  });
  it('audio inbound 있으나 audioLevel 미노출 → undefined', () => {
    expect(v_7be8d9(v_2888b4([{ type: 'inbound-rtp', kind: 'audio' }]))).toBeUndefined();
  });
  it('audio inbound 자체 없음 → undefined', () => {
    expect(v_7be8d9(v_2888b4([{ type: 'inbound-rtp', kind: 'video' }]))).toBeUndefined();
  });
  it('null report → undefined', () => {
    expect(v_7be8d9(null)).toBeUndefined();
  });
});

describe('cloneSilenceStep', () => {
  it('awaiting: 소리 들리면 active로, 무음 카운터 0', () => {
    const v_ca01e0 = v_396b87();
    const v_3f6eae = v_c506a5(v_ca01e0, 0.5, 200, v_45b7fa);
    expect(v_3f6eae.phase).toBe('active');
  });

  it('active: 무음이 silenceHoldMs 연속 → ended', () => {
    let v_fd5f43 = v_396b87();
    v_fd5f43 = v_c506a5(v_fd5f43, 0.5, 200, v_45b7fa); 
    for (let v_ebec57 = 0; v_ebec57 < 6; v_ebec57++) v_fd5f43 = v_c506a5(v_fd5f43, 0.0, 200, v_45b7fa);
    expect(v_fd5f43.phase).toBe('ended');
  });

  it('active: 무음 도중 소리 재개 → 무음 카운터 리셋, ended 안 됨', () => {
    let v_fd5f43 = v_396b87();
    v_fd5f43 = v_c506a5(v_fd5f43, 0.5, 200, v_45b7fa); 
    for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) v_fd5f43 = v_c506a5(v_fd5f43, 0.0, 200, v_45b7fa); 
    v_fd5f43 = v_c506a5(v_fd5f43, 0.5, 200, v_45b7fa); 
    expect(v_fd5f43.phase).toBe('active');
    expect(v_fd5f43.silenceMs).toBe(0);
  });

  it('awaiting: awaitingTimeoutMs 내 소리 없으면 ended(응답 없음)', () => {
    let v_fd5f43 = v_396b87();
    const v_6faf4b = Math.ceil(v_45b7fa.awaitingTimeoutMs / 200);
    for (let v_ebec57 = 0; v_ebec57 < v_6faf4b; v_ebec57++) v_fd5f43 = v_c506a5(v_fd5f43, 0.0, 200, v_45b7fa);
    expect(v_fd5f43.phase).toBe('ended');
  });

  it('fallback: level=undefined면 fallbackWaitMs 후 ended', () => {
    let v_fd5f43 = v_396b87();
    const v_6faf4b = Math.ceil(v_45b7fa.fallbackWaitMs / 200);
    for (let v_ebec57 = 0; v_ebec57 < v_6faf4b; v_ebec57++) v_fd5f43 = v_c506a5(v_fd5f43, undefined, 200, v_45b7fa);
    expect(v_fd5f43.phase).toBe('ended');
    expect(v_fd5f43.fallback).toBe(true);
  });

  it('maxWaitMs 안전망: active로 길게 떠들어도 maxWait 초과 시 ended', () => {
    let v_fd5f43 = v_396b87();
    v_fd5f43 = v_c506a5(v_fd5f43, 0.5, 200, v_45b7fa);
    const v_6faf4b = Math.ceil(v_45b7fa.maxWaitMs / 200);
    for (let v_ebec57 = 0; v_ebec57 < v_6faf4b; v_ebec57++) v_fd5f43 = v_c506a5(v_fd5f43, 0.5, 200, v_45b7fa);
    expect(v_fd5f43.phase).toBe('ended');
  });

  it('ended 상태는 멱등(추가 step에도 ended 유지)', () => {
    let v_fd5f43 = v_396b87();
    v_fd5f43 = v_c506a5(v_fd5f43, 0.5, 200, v_45b7fa);
    for (let v_ebec57 = 0; v_ebec57 < 6; v_ebec57++) v_fd5f43 = v_c506a5(v_fd5f43, 0.0, 200, v_45b7fa);
    const v_eb62d7 = v_fd5f43;
    v_fd5f43 = v_c506a5(v_fd5f43, 0.5, 200, v_45b7fa);
    expect(v_fd5f43).toBe(v_eb62d7);
  });
});

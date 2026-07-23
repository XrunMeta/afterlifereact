import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePrethirdAvatar } from '../../src/realtime/usePrethirdAvatar';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function makeMockDc() {
  const listeners: Record<string, Array<(p?: unknown) => void>> = {};
  const sent: string[] = [];
  return {
    readyState: 'open',
    sent,
    send: jest.fn((data: string) => { sent.push(data); }),
    addEventListener: (ev: string, cb: (p?: unknown) => void) => { (listeners[ev] ||= []).push(cb); },
    emit: (ev: string, p?: unknown) => (listeners[ev] || []).forEach((cb) => cb(p)),
    emitMessage: (data: string) => (listeners['message'] || []).forEach((cb) => cb({ data })),
  };
}

function makeMockPc(dc: ReturnType<typeof makeMockDc>, overrides: { iceGatheringState?: string } = {}) {
  const listeners: Record<string, Array<(p?: unknown) => void>> = {};
  const pc = {
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: overrides.iceGatheringState ?? 'complete', 
    localDescription: { type: 'offer', sdp: 'OFFER_SDP' },
    addEventListener: (ev: string, cb: (p?: unknown) => void) => { (listeners[ev] ||= []).push(cb); },
    removeEventListener: (ev: string, cb: (p?: unknown) => void) => {
      if (listeners[ev]) { listeners[ev] = listeners[ev].filter((f) => f !== cb); }
    },
    addTransceiver: jest.fn(),
    createDataChannel: jest.fn().mockReturnValue(dc),
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'OFFER_SDP' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (ev: string, p?: unknown) => (listeners[ev] || []).forEach((cb) => cb(p)),
  };
  return pc;
}

function mockOfferFetch() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true, status: 200,
    text: async () => JSON.stringify({ session_id: 's1', type: 'answer', sdp: 'ANSWER_SDP' }),
  }) as unknown as typeof fetch;
}

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

function deps(pc: unknown, audioSession = { activate: jest.fn(), deactivate: jest.fn() }) {
  return { createPeerConnection: jest.fn().mockReturnValue(pc), audioSession };
}

it('start: offer 생성 → /prethird/offer POST(clone_id 포함) → answer 적용 → live', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const d = deps(pc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: d as never }));

  await act(async () => { await result.current.start(); });

  expect(pc.createDataChannel).toHaveBeenCalledWith('control');
  expect(pc.createOffer).toHaveBeenCalled();
  expect(pc.setRemoteDescription).toHaveBeenCalled();
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0];

  expect(String(url)).toBe('https://rtc.example.invalid/prethird/offer');
  expect(JSON.parse(init.body)).toMatchObject({ type: 'offer', sdp: 'OFFER_SDP', clone_id: 7 });

  act(() => { pc.connectionState = 'connected'; pc.emit('connectionstatechange'); });
  await waitFor(() => expect(result.current.state).toBe('live'));
});

it('say: datachannel 로 {type:"say"} 전송', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('안녕'); });
  expect(dc.send).toHaveBeenCalledWith(expect.stringContaining('"type":"say"'));
  expect(dc.send).toHaveBeenCalledWith(expect.stringContaining('"text":"안녕"'));
});

it('start: ontrack video → remoteStream 세팅', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  const vstream = { getVideoTracks: () => [{}] };
  act(() => { pc.emit('track', { streams: [vstream], track: { kind: 'video' } }); });
  await waitFor(() => expect(result.current.remoteStream).toBe(vstream));
});

it('/offer HTTP 실패(500) → state=error, prethird_offer_http_500', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false, status: 500,
    text: async () => '',
  }) as unknown as typeof fetch;
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  expect(result.current.state).toBe('error');
  expect(result.current.error).toBeTruthy();
  expect(result.current.error?.message).toContain('prethird_offer_http_500');
});

it('/offer HTTP 424 → state=error, clone_bundle_unavailable (500과 다른 분기)', async () => {

  global.fetch = jest.fn().mockResolvedValue({
    ok: false, status: 424,
    text: async () => JSON.stringify({ error: 'clone_bundle_unavailable', clone_id: 7 }),
  }) as unknown as typeof fetch;
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  expect(result.current.state).toBe('error');
  expect(result.current.error?.message).toBe('clone_bundle_unavailable');

  expect(result.current.error?.message).not.toContain('prethird_offer_http_');
});

it('answer SDP 누락 → state=error', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true, status: 200,
    text: async () => JSON.stringify({ session_id: 's1' }), 
  }) as unknown as typeof fetch;
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  expect(result.current.state).toBe('error');
  expect(result.current.error?.message).toBe('prethird_offer_no_answer');
});

it('fetch throw → state=error, pc.close 호출', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('net')) as unknown as typeof fetch;
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  expect(result.current.state).toBe('error');
  expect(result.current.error?.message).toBe('net');
  expect(pc.close).toHaveBeenCalled();
});

it('say: dc.readyState!=="open" → error 세팅, send 미호출', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  dc.readyState = 'connecting'; 
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('안녕'); });
  expect(dc.send).not.toHaveBeenCalled();
  expect(result.current.error).toBeTruthy();
  expect(result.current.error?.message).toBe('datachannel_not_open');
});

it('say 중복 가드: speaking 중 두 번째 say 무시(dc.send 1회만)', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('안녕'); }); 
  await act(async () => { await result.current.say('또'); });   
  expect(dc.send).toHaveBeenCalledTimes(1);
});

it('start 재진입 가드: 두 번 연속 호출 → createPeerConnection 1회만', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const d = deps(pc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: d as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.start(); });
  expect(d.createPeerConnection).toHaveBeenCalledTimes(1);
});

it('start: /offer body에 access_token 포함', async () => {
  mockOfferFetch();
  const dc = makeMockDc(); const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 'tok-123', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(JSON.parse(init.body)).toMatchObject({ clone_id: 7, access_token: 'tok-123' });
});

function makeConnectedPc() {
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  return { dc, pc };
}

function depsFor(pc: ReturnType<typeof makeMockPc>) {
  return { createPeerConnection: jest.fn().mockReturnValue(pc), audioSession: { activate: jest.fn(), deactivate: jest.fn() } };
}

describe('greet/speak/lastSignal', () => {
  beforeEach(() => { mockOfferFetch(); });

  it('greet() 는 datachannel 로 {type:"greet", seq} 전송', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    await act(async () => { await result.current.greet!(); });
    const sent = dc.sent.map((s: string) => JSON.parse(s));
    expect(sent[0].type).toBe('greet');
    expect(typeof sent[0].seq).toBe('number');
  });

  it('speak(text) 는 {type:"speak", text, seq} 전송', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    await act(async () => { await result.current.speak!('여보세요?'); });
    const sent = dc.sent.map((s: string) => JSON.parse(s));
    expect(sent[0]).toMatchObject({ type: 'speak', text: '여보세요?' });
    expect(typeof sent[0].seq).toBe('number');
  });

  it('datachannel speech_start 수신 → lastSignal 갱신', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    act(() => { dc.emitMessage(JSON.stringify({ type: 'speech_start', seq: 5 })); });
    expect(result.current.lastSignal?.type).toBe('speech_start');
    expect(result.current.lastSignal?.seq).toBe(5);
  });

  it('speech_text 수신 → lastSignal { type, text } 노출·notifySpeechEnd 미호출', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });

    await act(async () => { await result.current.say('안녕'); });
    expect(result.current.phase).toBe('speaking');
    act(() => { dc.emitMessage(JSON.stringify({ type: 'speech_text', text: '안녕하세요', seq: 1 })); });
    expect(result.current.lastSignal?.type).toBe('speech_text');
    expect(result.current.lastSignal?.text).toBe('안녕하세요');
    expect(result.current.lastSignal?.seq).toBe(1);

    expect(result.current.phase).toBe('speaking');
  });

  it('speech_text 수신 시 text 비문자열/빈문자열이면 lastSignal 무시', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    act(() => { dc.emitMessage(JSON.stringify({ type: 'speech_text', seq: 1 })); }); 
    expect(result.current.lastSignal).toBeNull();
    act(() => { dc.emitMessage(JSON.stringify({ type: 'speech_text', text: '', seq: 2 })); }); 
    expect(result.current.lastSignal).toBeNull();
  });

  it('연속 동일 타입 신호도 ts 로 구분(새 객체)', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    act(() => { dc.emitMessage(JSON.stringify({ type: 'speech_end', seq: 1 })); });
    const first = result.current.lastSignal;
    act(() => { dc.emitMessage(JSON.stringify({ type: 'speech_end', seq: 2 })); });
    expect(result.current.lastSignal).not.toBe(first);
    expect(result.current.lastSignal?.seq).toBe(2);
  });
});

it('greet(): dc가 connecting 상태면 open 이벤트 후에 send 호출', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  dc.readyState = 'connecting'; 
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
  await act(async () => { await result.current.start(); });

  let greetDone = false;
  act(() => {
    result.current.greet!().then(() => { greetDone = true; });
  });

  expect(dc.send).not.toHaveBeenCalled();

  await act(async () => {
    dc.readyState = 'open';
    dc.emit('open');
  });

  await waitFor(() => expect(greetDone).toBe(true));
  expect(dc.send).toHaveBeenCalledTimes(1);
  const sent = JSON.parse(dc.sent[0]);
  expect(sent.type).toBe('greet');
  expect(typeof sent.seq).toBe('number');
});

describe('sendFaceEvent', () => {
  beforeEach(() => { mockOfferFetch(); });

  it('speaker_confirmed → {type:"face_event", event:"speaker_confirmed", personId, displayName, seq} 전송', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    act(() => { result.current.sendFaceEvent!({ event: 'speaker_confirmed', personId: 3, displayName: '철수' }); });
    const sent = dc.sent.map((s: string) => JSON.parse(s));
    expect(sent[0]).toMatchObject({ type: 'face_event', event: 'speaker_confirmed', personId: 3, displayName: '철수' });
    expect(typeof sent[0].seq).toBe('number');
  });

  it('unknown_face/multi_face 도 그대로 event 필드 전달', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    act(() => { result.current.sendFaceEvent!({ event: 'unknown_face' }); });
    act(() => { result.current.sendFaceEvent!({ event: 'multi_face' }); });
    const sent = dc.sent.map((s: string) => JSON.parse(s));
    expect(sent[0].event).toBe('unknown_face');
    expect(sent[1].event).toBe('multi_face');
  });

  it('dc readyState !== "open" → 조용히 스킵(send 미호출, error 세팅 없음)', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    dc.readyState = 'connecting';
    act(() => { result.current.sendFaceEvent!({ event: 'unknown_face' }); });
    expect(dc.send).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('start 전(dc 없음) 호출해도 크래시 없음', async () => {
    const { pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    expect(() => result.current.sendFaceEvent!({ event: 'unknown_face' })).not.toThrow();
  });
});

describe('enroll_suggest 수신 → onEnrollSuggest 콜백', () => {
  beforeEach(() => { mockOfferFetch(); });

  it('datachannel {type:"enroll_suggest", name} 수신 → onEnrollSuggest(name, undefined) 호출', async () => {
    const { dc, pc } = makeConnectedPc();
    const onEnrollSuggest = jest.fn();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never, onEnrollSuggest }));
    await act(async () => { await result.current.start(); });
    act(() => { dc.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지' })); });
    expect(onEnrollSuggest).toHaveBeenCalledWith('민지', undefined);
  });

  it('name 빈 문자열(수동 입력 폴백)도 그대로 전달', async () => {
    const { dc, pc } = makeConnectedPc();
    const onEnrollSuggest = jest.fn();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never, onEnrollSuggest }));
    await act(async () => { await result.current.start(); });
    act(() => { dc.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '' })); });
    expect(onEnrollSuggest).toHaveBeenCalledWith('', undefined);
  });

  it('T-126 Task7 — personId(number) 포함 시 그대로 전달(이름 반영 시나리오)', async () => {
    const { dc, pc } = makeConnectedPc();
    const onEnrollSuggest = jest.fn();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never, onEnrollSuggest }));
    await act(async () => { await result.current.start(); });
    act(() => { dc.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지', personId: 42 })); });
    expect(onEnrollSuggest).toHaveBeenCalledWith('민지', 42);
  });

  it('T-126 Task7 — personId 가 number 가 아니면(문자열/null) undefined 로 폴백', async () => {
    const { dc, pc } = makeConnectedPc();
    const onEnrollSuggest = jest.fn();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never, onEnrollSuggest }));
    await act(async () => { await result.current.start(); });
    act(() => { dc.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지', personId: '42' })); });
    expect(onEnrollSuggest).toHaveBeenCalledWith('민지', undefined);
  });

  it('onEnrollSuggest 미제공이어도 크래시 없음(speech_start 등 기존 분기 무영향)', async () => {
    const { dc, pc } = makeConnectedPc();
    const { result } = renderHook(() =>
      usePrethirdAvatar({ cloneId: 1, accessToken: 't', deps: depsFor(pc) as never }));
    await act(async () => { await result.current.start(); });
    expect(() => {
      dc.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지' }));
    }).not.toThrow();
    act(() => { dc.emitMessage(JSON.stringify({ type: 'speech_start', seq: 1 })); });
    expect(result.current.lastSignal?.type).toBe('speech_start');
  });
});

it('ICE 대기 분기(타임아웃 아님): gathering→complete emit → fetch 호출', async () => {

  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc, { iceGatheringState: 'gathering' }); 
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));

  let startDone = false;
  act(() => {
    result.current.start().then(() => { startDone = true; });
  });

  await act(async () => {
    pc.iceGatheringState = 'complete';
    pc.emit('icegatheringstatechange');
  });

  await waitFor(() => expect(startDone).toBe(true));
  expect(global.fetch).toHaveBeenCalled();
  const [url] = (global.fetch as jest.Mock).mock.calls[0];
  expect(String(url)).toContain('/prethird/offer');
});

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePrethirdAvatar } from '../../src/realtime/usePrethirdAvatar';

function makeMockDc() {
  const listeners: Record<string, Array<(p?: unknown) => void>> = {};
  return {
    readyState: 'open',
    send: jest.fn(),
    addEventListener: (ev: string, cb: (p?: unknown) => void) => { (listeners[ev] ||= []).push(cb); },
    emit: (ev: string, p?: unknown) => (listeners[ev] || []).forEach((cb) => cb(p)),
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
  expect(String(url)).toBe('https://memorial.example.invalid/prethird/offer');
  expect(JSON.parse(init.body)).toMatchObject({ type: 'offer', sdp: 'OFFER_SDP', clone_id: 7 });

  act(() => { pc.connectionState = 'connected'; pc.emit('connectionstatechange'); });
  await waitFor(() => expect(result.current.state).toBe('live'));
});

it('say: datachannel 로 {type:"say", seq} 전송', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('안녕'); });
  const sent = JSON.parse(dc.send.mock.calls[0][0]);
  expect(sent).toMatchObject({ type: 'say', text: '안녕', seq: 1 });
});

it('say는 seq를 증가시켜 전송한다', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('하나'); });

  act(() => { result.current.notifySpeechEnd(); });
  await act(async () => { await result.current.say('둘'); });
  const sent = dc.send.mock.calls.map((c: string[]) => JSON.parse(c[0]));
  expect(sent[0]).toMatchObject({ type: 'say', text: '하나', seq: 1 });
  expect(sent[1]).toMatchObject({ type: 'say', text: '둘', seq: 2 });
});

it('speech_end(seq 일치) → subscribeSpeechEnd 콜백 호출, 불일치는 무시', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });

  const cb = jest.fn();
  act(() => { result.current.subscribeSpeechEnd(cb); });
  await act(async () => { await result.current.say('안녕'); }); 

  act(() => { dc.emit('message', { data: JSON.stringify({ type: 'speech_end', seq: 99 }) }); });
  expect(cb).not.toHaveBeenCalled();

  act(() => { dc.emit('message', { data: JSON.stringify({ type: 'speech_end', seq: 1 }) }); });
  expect(cb).toHaveBeenCalledTimes(1);
});

it('speech_end(seq 일치) → speakTimer 정리 + phase=idle (soft timeout 발동 안 함)', async () => {
  jest.useFakeTimers();
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('안녕'); }); 
  expect(result.current.phase).toBe('speaking');

  act(() => { dc.emit('message', { data: JSON.stringify({ type: 'speech_end', seq: 1 }) }); });
  await waitFor(() => expect(result.current.phase).toBe('idle'));

  act(() => { jest.advanceTimersByTime(30_000); });
  expect(result.current.phase).toBe('idle'); 

  jest.useRealTimers();
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

it('/offer HTTP 실패 → state=error, error 세팅', async () => {
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

it('say 중복 가드: speaking 중 두 번째 say 무시(dc.send 1회만, seq=1)', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('안녕'); }); 
  await act(async () => { await result.current.say('또'); });   
  expect(dc.send).toHaveBeenCalledTimes(1);
  expect(JSON.parse(dc.send.mock.calls[0][0])).toMatchObject({ seq: 1 });
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

it('speech_end(seq 없음) → 무시(구버전/누락 방어)', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });

  const cb = jest.fn();
  act(() => { result.current.subscribeSpeechEnd(cb); });
  await act(async () => { await result.current.say('안녕'); }); 

  act(() => { dc.emit('message', { data: JSON.stringify({ type: 'speech_end' }) }); });
  expect(cb).not.toHaveBeenCalled();
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

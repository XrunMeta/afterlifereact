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

function makeMockPc(dc: ReturnType<typeof makeMockDc>) {
  const listeners: Record<string, Array<(p?: unknown) => void>> = {};
  return {
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'complete', 
    localDescription: { type: 'offer', sdp: 'OFFER_SDP' },
    addEventListener: (ev: string, cb: (p?: unknown) => void) => { (listeners[ev] ||= []).push(cb); },
    addTransceiver: jest.fn(),
    createDataChannel: jest.fn().mockReturnValue(dc),
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'OFFER_SDP' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (ev: string, p?: unknown) => (listeners[ev] || []).forEach((cb) => cb(p)),
  };
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

it('say: datachannel 로 {type:"say"} 전송', async () => {
  mockOfferFetch();
  const dc = makeMockDc();
  const pc = makeMockPc(dc);
  const { result } = renderHook(() =>
    usePrethirdAvatar({ cloneId: 7, accessToken: 't', deps: deps(pc) as never }));
  await act(async () => { await result.current.start(); });
  await act(async () => { await result.current.say('안녕'); });
  expect(dc.send).toHaveBeenCalledWith(JSON.stringify({ type: 'say', text: '안녕' }));
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

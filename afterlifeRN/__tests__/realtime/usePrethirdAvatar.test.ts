import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_3d8d48 } from '../../src/realtime/usePrethirdAvatar';

function v_9051ce() {
  const v_9fde29 = {};
  return {
    readyState: 'open',
    send: jest.fn(),
    addEventListener: (v_1d299c, v_16dbdb) => { (v_9fde29[v_1d299c] ||= []).push(v_16dbdb); },
    emit: (v_1d299c, v_e2a85c) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_e2a85c)),
  };
}

function v_e6273b(dc: ReturnType<typeof v_9051ce>) {
  const v_9fde29 = {};
  return {
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'complete', 
    localDescription: { type: 'offer', sdp: 'OFFER_SDP' },
    addEventListener: (v_1d299c, v_16dbdb) => { (v_9fde29[v_1d299c] ||= []).push(v_16dbdb); },
    addTransceiver: jest.fn(),
    createDataChannel: jest.fn().mockReturnValue(v_32dc97),
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'OFFER_SDP' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (v_1d299c, v_e2a85c) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_e2a85c)),
  };
}

function v_897bd0() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true, status: 200,
    text: async () => JSON.stringify({ session_id: 's1', type: 'answer', sdp: 'ANSWER_SDP' }),
  }) as unknown as typeof fetch;
}

const v_ec9084 = global.fetch;
afterEach(() => { global.fetch = v_ec9084; });

function v_84b93d(v_12cd99, v_cec4d7 = { activate: jest.fn(), deactivate: jest.fn() }) {
  return { createPeerConnection: jest.fn().mockReturnValue(v_12cd99), audioSession: v_cec4d7 };
}

it('start: offer 생성 → /prethird/offer POST(clone_id 포함) → answer 적용 → live', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const v_d5dda0 = v_84b93d(v_12cd99);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_d5dda0 as never }));

  await v_be73a0(async () => { await v_43c42e.current.start(); });

  expect(v_12cd99.createDataChannel).toHaveBeenCalledWith('control');
  expect(v_12cd99.createOffer).toHaveBeenCalled();
  expect(v_12cd99.setRemoteDescription).toHaveBeenCalled();
  const [v_f71b56, v_00cfc6] = (global.fetch as jest.Mock).mock.calls[0];
  expect(String(v_f71b56)).toBe('https://memorial.example.invalid/prethird/offer');
  expect(JSON.parse(v_00cfc6.body)).toMatchObject({ type: 'offer', sdp: 'OFFER_SDP', clone_id: 7 });

  v_be73a0(() => { v_12cd99.connectionState = 'connected'; v_12cd99.emit('connectionstatechange'); });
  await v_81e49f(() => expect(v_43c42e.current.state).toBe('live'));
});

it('say: datachannel 로 {type:"say"} 전송', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  await v_be73a0(async () => { await v_43c42e.current.say('안녕'); });
  expect(v_32dc97.send).toHaveBeenCalledWith(JSON.stringify({ type: 'say', text: '안녕' }));
});

it('start: ontrack video → remoteStream 세팅', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  const v_a11fde = { getVideoTracks: () => [{}] };
  v_be73a0(() => { v_12cd99.emit('track', { streams: [v_a11fde], track: { kind: 'video' } }); });
  await v_81e49f(() => expect(v_43c42e.current.remoteStream).toBe(v_a11fde));
});

import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_3d8d48 } from '../../src/realtime/usePrethirdAvatar';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

function v_9051ce() {
  const v_9fde29 = {};
  const v_f966e3 = [];
  return {
    readyState: 'open',
    sent: v_f966e3,
    send: jest.fn((v_9390e8) => { v_f966e3.push(v_9390e8); }),
    addEventListener: (v_1d299c, v_16dbdb) => { (v_9fde29[v_1d299c] ||= []).push(v_16dbdb); },
    emit: (v_1d299c, v_e2a85c) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_e2a85c)),
    emitMessage: (v_9390e8) => (v_9fde29['message'] || []).forEach((v_16dbdb) => v_16dbdb({ data: v_9390e8 })),
  };
}

function v_e6273b(dc: ReturnType<typeof v_9051ce>, v_11ea7b = {}) {
  const v_9fde29 = {};
  const v_12cd99 = {
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: v_11ea7b.iceGatheringState ?? 'complete', 
    localDescription: { type: 'offer', sdp: 'OFFER_SDP' },
    addEventListener: (v_1d299c, v_16dbdb) => { (v_9fde29[v_1d299c] ||= []).push(v_16dbdb); },
    removeEventListener: (v_1d299c, v_16dbdb) => {
      if (v_9fde29[v_1d299c]) { v_9fde29[v_1d299c] = v_9fde29[v_1d299c].filter((v_8b5cd8) => v_8b5cd8 !== v_16dbdb); }
    },
    addTransceiver: jest.fn(),
    createDataChannel: jest.fn().mockReturnValue(v_32dc97),
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'OFFER_SDP' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (v_1d299c, v_e2a85c) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_e2a85c)),
  };
  return v_12cd99;
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

  expect(String(v_f71b56)).toBe('https://rtc.example.invalid/prethird/offer');
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
  expect(v_32dc97.send).toHaveBeenCalledWith(expect.stringContaining('"type":"say"'));
  expect(v_32dc97.send).toHaveBeenCalledWith(expect.stringContaining('"text":"안녕"'));
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

it('/offer HTTP 실패(500) → state=error, prethird_offer_http_500', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false, status: 500,
    text: async () => '',
  }) as unknown as typeof fetch;
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  expect(v_43c42e.current.state).toBe('error');
  expect(v_43c42e.current.error).toBeTruthy();
  expect(v_43c42e.current.error?.message).toContain('prethird_offer_http_500');
});

it('/offer HTTP 424 → state=error, clone_bundle_unavailable (500과 다른 분기)', async () => {

  global.fetch = jest.fn().mockResolvedValue({
    ok: false, status: 424,
    text: async () => JSON.stringify({ error: 'clone_bundle_unavailable', clone_id: 7 }),
  }) as unknown as typeof fetch;
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  expect(v_43c42e.current.state).toBe('error');
  expect(v_43c42e.current.error?.message).toBe('clone_bundle_unavailable');

  expect(v_43c42e.current.error?.message).not.toContain('prethird_offer_http_');
});

it('answer SDP 누락 → state=error', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true, status: 200,
    text: async () => JSON.stringify({ session_id: 's1' }), 
  }) as unknown as typeof fetch;
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  expect(v_43c42e.current.state).toBe('error');
  expect(v_43c42e.current.error?.message).toBe('prethird_offer_no_answer');
});

it('fetch throw → state=error, pc.close 호출', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('net')) as unknown as typeof fetch;
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  expect(v_43c42e.current.state).toBe('error');
  expect(v_43c42e.current.error?.message).toBe('net');
  expect(v_12cd99.close).toHaveBeenCalled();
});

it('say: dc.readyState!=="open" → error 세팅, send 미호출', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce();
  v_32dc97.readyState = 'connecting'; 
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  await v_be73a0(async () => { await v_43c42e.current.say('안녕'); });
  expect(v_32dc97.send).not.toHaveBeenCalled();
  expect(v_43c42e.current.error).toBeTruthy();
  expect(v_43c42e.current.error?.message).toBe('datachannel_not_open');
});

it('say 중복 가드: speaking 중 두 번째 say 는 거부(reject)되고 dc.send 는 1회만', async () => {

  v_897bd0();
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  await v_be73a0(async () => { await v_43c42e.current.say('안녕'); }); 
  await v_be73a0(async () => {
    await expect(v_43c42e.current.say('또')).rejects.toThrow('prethird: busy'); 
  });
  expect(v_32dc97.send).toHaveBeenCalledTimes(1);
});

it('start 재진입 가드: 두 번 연속 호출 → createPeerConnection 1회만', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  const v_d5dda0 = v_84b93d(v_12cd99);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_d5dda0 as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  expect(v_d5dda0.createPeerConnection).toHaveBeenCalledTimes(1);
});

it('start: /offer body에 access_token 포함', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce(); const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 'tok-123', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  const [, v_00cfc6] = (global.fetch as jest.Mock).mock.calls[0];
  expect(JSON.parse(v_00cfc6.body)).toMatchObject({ clone_id: 7, access_token: 'tok-123' });
});

it.each([[false], [true]])('start: usesBridge=%s 이면 /offer body 에 bridge 로 실린다', async (v_2aa951) => {
  v_897bd0();
  const v_32dc97 = v_9051ce(); const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', usesBridge: v_2aa951, deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  const [, v_00cfc6] = (global.fetch as jest.Mock).mock.calls[0];
  expect(JSON.parse(v_00cfc6.body).bridge).toBe(v_2aa951);
});

it('start: usesBridge 미지정이면 bridge 를 싣지 않는다(서버는 기존 대기 유지)', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce(); const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  const [, v_00cfc6] = (global.fetch as jest.Mock).mock.calls[0];
  expect('bridge' in JSON.parse(v_00cfc6.body)).toBe(false);
});

it.each([[true, true], [false, false]])('start: usesBridge=%s → bridge_signal 포함=%s', async (v_2aa951, v_505a6d) => {
  v_897bd0();
  const v_32dc97 = v_9051ce(); const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', usesBridge: v_2aa951, deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  const [, v_00cfc6] = (global.fetch as jest.Mock).mock.calls[0];
  expect(JSON.parse(v_00cfc6.body).bridge_signal === true).toBe(v_505a6d);
});

it('sendBridgeEnd: 열린 datachannel 로 {type:bridge,state:end} 를 보낸다', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce(); const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', usesBridge: true, deps: v_84b93d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });
  v_be73a0(() => { v_43c42e.current.sendBridgeEnd(); });
  expect(v_32dc97.sent.map((v_62c214) => JSON.parse(v_62c214))).toContainEqual({ type: 'bridge', state: 'end' });
});

function v_1d3fbb() {
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97);
  return { dc: v_32dc97, pc: v_12cd99 };
}

function v_3a122d(pc: ReturnType<typeof v_e6273b>) {
  return { createPeerConnection: jest.fn().mockReturnValue(v_12cd99), audioSession: { activate: jest.fn(), deactivate: jest.fn() } };
}

describe('greet/speak/lastSignal', () => {
  beforeEach(() => { v_897bd0(); });

  it('greet() 는 datachannel 로 {type:"greet", seq} 전송', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    await v_be73a0(async () => { await v_43c42e.current.greet!(); });
    const v_f966e3 = v_32dc97.sent.map((v_fd5f43) => JSON.parse(v_fd5f43));
    expect(v_f966e3[0].type).toBe('greet');
    expect(typeof v_f966e3[0].seq).toBe('number');
  });

  it('speak(text) 는 {type:"speak", text, seq} 전송', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    await v_be73a0(async () => { await v_43c42e.current.speak!('여보세요?'); });
    const v_f966e3 = v_32dc97.sent.map((v_fd5f43) => JSON.parse(v_fd5f43));
    expect(v_f966e3[0]).toMatchObject({ type: 'speak', text: '여보세요?' });
    expect(typeof v_f966e3[0].seq).toBe('number');
  });

  it('datachannel speech_start 수신 → lastSignal 갱신', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'speech_start', seq: 5 })); });
    expect(v_43c42e.current.lastSignal?.type).toBe('speech_start');
    expect(v_43c42e.current.lastSignal?.seq).toBe(5);
  });

  it('speech_text 수신 → lastSignal { type, text } 노출·notifySpeechEnd 미호출', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });

    await v_be73a0(async () => { await v_43c42e.current.say('안녕'); });
    expect(v_43c42e.current.phase).toBe('speaking');
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'speech_text', text: '안녕하세요', seq: 1 })); });
    expect(v_43c42e.current.lastSignal?.type).toBe('speech_text');
    expect(v_43c42e.current.lastSignal?.text).toBe('안녕하세요');
    expect(v_43c42e.current.lastSignal?.seq).toBe(1);

    expect(v_43c42e.current.phase).toBe('speaking');
  });

  it('speech_text 수신 시 text 비문자열/빈문자열이면 lastSignal 무시', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'speech_text', seq: 1 })); }); 
    expect(v_43c42e.current.lastSignal).toBeNull();
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'speech_text', text: '', seq: 2 })); }); 
    expect(v_43c42e.current.lastSignal).toBeNull();
  });

  it('연속 동일 타입 신호도 ts 로 구분(새 객체)', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'speech_end', seq: 1 })); });
    const v_ea719c = v_43c42e.current.lastSignal;
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'speech_end', seq: 2 })); });
    expect(v_43c42e.current.lastSignal).not.toBe(v_ea719c);
    expect(v_43c42e.current.lastSignal?.seq).toBe(2);
  });
});

it('greet(): dc가 connecting 상태면 open 이벤트 후에 send 호출', async () => {
  v_897bd0();
  const v_32dc97 = v_9051ce();
  v_32dc97.readyState = 'connecting'; 
  const v_12cd99 = v_e6273b(v_32dc97);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
  await v_be73a0(async () => { await v_43c42e.current.start(); });

  let v_6172f3 = false;
  v_be73a0(() => {
    v_43c42e.current.greet!().then(() => { v_6172f3 = true; });
  });

  expect(v_32dc97.send).not.toHaveBeenCalled();

  await v_be73a0(async () => {
    v_32dc97.readyState = 'open';
    v_32dc97.emit('open');
  });

  await v_81e49f(() => expect(v_6172f3).toBe(true));
  expect(v_32dc97.send).toHaveBeenCalledTimes(1);
  const v_f966e3 = JSON.parse(v_32dc97.sent[0]);
  expect(v_f966e3.type).toBe('greet');
  expect(typeof v_f966e3.seq).toBe('number');
});

describe('sendFaceEvent', () => {
  beforeEach(() => { v_897bd0(); });

  it('speaker_confirmed → {type:"face_event", event:"speaker_confirmed", personId, displayName, seq} 전송', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_43c42e.current.sendFaceEvent!({ event: 'speaker_confirmed', personId: 3, displayName: '철수' }); });
    const v_f966e3 = v_32dc97.sent.map((v_fd5f43) => JSON.parse(v_fd5f43));
    expect(v_f966e3[0]).toMatchObject({ type: 'face_event', event: 'speaker_confirmed', personId: 3, displayName: '철수' });
    expect(typeof v_f966e3[0].seq).toBe('number');
  });

  it('unknown_face/multi_face 도 그대로 event 필드 전달', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_43c42e.current.sendFaceEvent!({ event: 'unknown_face' }); });
    v_be73a0(() => { v_43c42e.current.sendFaceEvent!({ event: 'multi_face' }); });
    const v_f966e3 = v_32dc97.sent.map((v_fd5f43) => JSON.parse(v_fd5f43));
    expect(v_f966e3[0].event).toBe('unknown_face');
    expect(v_f966e3[1].event).toBe('multi_face');
  });

  it('dc readyState !== "open" → 조용히 스킵(send 미호출, error 세팅 없음)', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_32dc97.readyState = 'connecting';
    v_be73a0(() => { v_43c42e.current.sendFaceEvent!({ event: 'unknown_face' }); });
    expect(v_32dc97.send).not.toHaveBeenCalled();
    expect(v_43c42e.current.error).toBeNull();
  });

  it('start 전(dc 없음) 호출해도 크래시 없음', async () => {
    const { pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    expect(() => v_43c42e.current.sendFaceEvent!({ event: 'unknown_face' })).not.toThrow();
  });
});

describe('enroll_suggest 수신 → onEnrollSuggest 콜백', () => {
  beforeEach(() => { v_897bd0(); });

  it('datachannel {type:"enroll_suggest", name} 수신 → onEnrollSuggest(name, undefined) 호출', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const v_46947d = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never, onEnrollSuggest: v_46947d }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지' })); });
    expect(v_46947d).toHaveBeenCalledWith('민지', undefined);
  });

  it('name 빈 문자열(수동 입력 폴백)도 그대로 전달', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const v_46947d = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never, onEnrollSuggest: v_46947d }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '' })); });
    expect(v_46947d).toHaveBeenCalledWith('', undefined);
  });

  it('T-126 Task7 — personId(number) 포함 시 그대로 전달(이름 반영 시나리오)', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const v_46947d = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never, onEnrollSuggest: v_46947d }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지', personId: 42 })); });
    expect(v_46947d).toHaveBeenCalledWith('민지', 42);
  });

  it('T-126 Task7 — personId 가 number 가 아니면(문자열/null) undefined 로 폴백', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const v_46947d = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never, onEnrollSuggest: v_46947d }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지', personId: '42' })); });
    expect(v_46947d).toHaveBeenCalledWith('민지', undefined);
  });

  it('onEnrollSuggest 미제공이어도 크래시 없음(speech_start 등 기존 분기 무영향)', async () => {
    const { dc: v_32dc97, pc: v_12cd99 } = v_1d3fbb();
    const { result: v_43c42e } = v_0da18b(() =>
      v_3d8d48({ cloneId: 1, accessToken: 't', deps: v_3a122d(v_12cd99) as never }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    expect(() => {
      v_32dc97.emitMessage(JSON.stringify({ type: 'enroll_suggest', name: '민지' }));
    }).not.toThrow();
    v_be73a0(() => { v_32dc97.emitMessage(JSON.stringify({ type: 'speech_start', seq: 1 })); });
    expect(v_43c42e.current.lastSignal?.type).toBe('speech_start');
  });
});

it('ICE 대기 분기(타임아웃 아님): gathering→complete emit → fetch 호출', async () => {

  v_897bd0();
  const v_32dc97 = v_9051ce();
  const v_12cd99 = v_e6273b(v_32dc97, { iceGatheringState: 'gathering' }); 
  const { result: v_43c42e } = v_0da18b(() =>
    v_3d8d48({ cloneId: 7, accessToken: 't', deps: v_84b93d(v_12cd99) as never }));

  let v_895aa9 = false;
  v_be73a0(() => {
    v_43c42e.current.start().then(() => { v_895aa9 = true; });
  });

  await v_be73a0(async () => {
    v_12cd99.iceGatheringState = 'complete';
    v_12cd99.emit('icegatheringstatechange');
  });

  await v_81e49f(() => expect(v_895aa9).toBe(true));
  expect(global.fetch).toHaveBeenCalled();
  const [v_f71b56] = (global.fetch as jest.Mock).mock.calls[0];
  expect(String(v_f71b56)).toContain('/prethird/offer');
});

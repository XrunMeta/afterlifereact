import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_b38a7e } from '../../src/realtime/useLiveAvatar';

const v_c9c6be = {
  callId: 'c1',
  subscribeUrl: 'https://o/oth-path',
  renegotiateUrl: 'https://o/oth-path',
  subscribeToken: 'tok',
  tracks: { video: 'v', audio: 'a' },
  expiresAt: 'x',
};

function v_e6273b() {
  const v_9fde29 = {};
  return {
    connectionState: 'new',
    iceConnectionState: 'new',
    addEventListener: (v_1d299c, v_16dbdb) => {
      (v_9fde29[v_1d299c] ||= []).push(v_16dbdb);
    },
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'ANSWER' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (v_1d299c, v_931bf0) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_931bf0)),
  };
}

function v_57d229() {
  global.fetch = jest.fn().mockImplementation(async (v_f71b56) => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify(
        String(v_f71b56).endsWith('/subscribe')
          ? { subscriber_session_id: 'sub1', offer_sdp: 'OFFER' }
          : { ok: true },
      ),
  })) as unknown as typeof fetch;
}

const v_ec9084 = global.fetch;
afterEach(() => {
  global.fetch = v_ec9084;
});

function v_b49c15() {
  return {
    activate: jest.fn(),
    deactivate: jest.fn(),
  };
}

function v_84b93d(pc: ReturnType<typeof v_e6273b>, v_cec4d7 = v_b49c15()) {
  return {
    startCall: jest.fn().mockResolvedValue(v_c9c6be),
    endCall: jest.fn().mockResolvedValue({ ok: true }),
    sayInCall: jest.fn().mockResolvedValue({ ok: true }),
    createPeerConnection: jest.fn().mockReturnValue(v_12cd99),
    audioSession: v_cec4d7,
  };
}

describe('useLiveAvatar', () => {
  it('start: 티켓→pc→subscribe(토큰)→offer→answer→renegotiate(토큰) 순서', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    expect(v_d5dda0.startCall).toHaveBeenCalledWith('AT', 7);
    expect(v_d5dda0.createPeerConnection).toHaveBeenCalled();
    const v_20e160 = (global.fetch as jest.Mock).mock.calls;
    const v_1ae212 = v_20e160.find(([v_ceb55a]) => String(v_ceb55a).endsWith('/subscribe'));
    const v_c7b9cd = v_20e160.find(([v_ceb55a]) => String(v_ceb55a).endsWith('/renegotiate'));
    expect(v_1ae212[1].headers.Authorization).toBe('Bearer tok');
    expect(v_12cd99.setRemoteDescription).toHaveBeenCalled();
    expect(v_12cd99.createAnswer).toHaveBeenCalled();
    expect(v_c7b9cd[1].headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(v_c7b9cd[1].body)).toEqual({
      subscriber_session_id: 'sub1',
      answer_sdp: 'ANSWER',
    });
  });

  it('ontrack→remoteStream, ICE connected→state=live', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    v_be73a0(() => {
      v_12cd99.emit('track', { streams: [{ toURL: () => 'mock://s' }], track: { kind: 'video' } });
      v_12cd99.iceConnectionState = 'connected';
      v_12cd99.emit('iceconnectionstatechange');
    });
    await v_81e49f(() => expect(v_43c42e.current.state).toBe('live'));
    expect(v_43c42e.current.remoteStream).toBeTruthy();
  });

  it('video/audio 별도 stream — audio ontrack 이 video remoteStream 을 덮어쓰지 않고, remoteStream 은 video stream 유지(RTCView 검은화면 방지)', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    v_be73a0(() => {

      v_12cd99.emit('track', {
        streams: [{ id: 'vid', toURL: () => 'v', getVideoTracks: () => [{}], getAudioTracks: () => [] }],
        track: { kind: 'video' },
      });
      v_12cd99.emit('track', {
        streams: [{ id: 'aud', toURL: () => 'a', getVideoTracks: () => [], getAudioTracks: () => [{}] }],
        track: { kind: 'audio' },
      });
    });
    await v_81e49f(() => expect(v_43c42e.current.remoteStream).toBeTruthy());

    expect((v_43c42e.current.remoteStream as unknown as { id: string }).id).toBe('vid');
  });

  it('audio-only ontrack(audio stream) 이 도착해도 video 없이 remoteStream=null 유지', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    v_be73a0(() => {

      v_12cd99.emit('track', {
        streams: [{ id: 'aud', toURL: () => 'a', getVideoTracks: () => [], getAudioTracks: () => [{}] }],
        track: { kind: 'audio' },
      });
    });

    expect(v_43c42e.current.remoteStream).toBeNull();
  });

  it('startCall 실패 → state=error, pc 미생성', async () => {
    const v_d5dda0 = {
      startCall: jest.fn().mockRejectedValue(new Error('boom')),
      endCall: jest.fn(),
      sayInCall: jest.fn(),
      createPeerConnection: jest.fn(),
      audioSession: v_b49c15(),
    };
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    expect(v_43c42e.current.state).toBe('error');
    expect(v_d5dda0.createPeerConnection).not.toHaveBeenCalled();
  });

  it('subscribe 실패 → state=error + pc.close', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'invalid_subscribe_token' }),
    }) as unknown as typeof fetch;
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    expect(v_43c42e.current.state).toBe('error');
    expect(v_12cd99.close).toHaveBeenCalled();
  });

  it('stop: pc.close + endCall + state=ended', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    await v_be73a0(async () => {
      await v_43c42e.current.stop();
    });
    expect(v_12cd99.close).toHaveBeenCalled();
    expect(v_d5dda0.endCall).toHaveBeenCalledWith('AT', 7, 'c1');
    expect(v_43c42e.current.state).toBe('ended');
  });

  it('재진입 가드: 통화 활성 중 start 재호출 → pc/startCall 1회만', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    expect(v_d5dda0.startCall).toHaveBeenCalledTimes(1);
    expect(v_d5dda0.createPeerConnection).toHaveBeenCalledTimes(1);
  });

  it('start 진행 중 언마운트 → 취소(pc 미생성, 잔류 setState 없음)', async () => {
    let v_267e3f = () => {};
    const v_d5dda0 = {
      startCall: jest.fn().mockReturnValue(
        new Promise((v_cb35cb) => {
          v_267e3f = v_cb35cb;
        }),
      ),
      endCall: jest.fn().mockResolvedValue({ ok: true }),
      sayInCall: jest.fn().mockResolvedValue({ ok: true }),
      createPeerConnection: jest.fn().mockReturnValue(v_e6273b()),
      audioSession: v_b49c15(),
    };
    v_57d229();
    const { result: v_43c42e, unmount: v_67a0e6 } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    let v_a48ba1 = Promise.resolve();
    v_be73a0(() => {
      v_a48ba1 = v_43c42e.current.start();
    });
    v_67a0e6();
    await v_be73a0(async () => {
      v_267e3f(v_c9c6be);
      await v_a48ba1;
    });

    expect(v_d5dda0.createPeerConnection).not.toHaveBeenCalled();
  });

  it('say: phase idle→sending→speaking, sayInCall 호출', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = { ...v_84b93d(v_12cd99), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
    const { result: v_43c42e } = v_0da18b(() => v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    await v_be73a0(async () => { await v_43c42e.current.say('안녕'); });
    expect(v_d5dda0.sayInCall).toHaveBeenCalledWith('AT', 7, 'c1', '안녕');
    expect(v_43c42e.current.phase).toBe('speaking');
  });

  it('say 중복 가드: speaking 중 say 무시', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = { ...v_84b93d(v_12cd99), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
    const { result: v_43c42e } = v_0da18b(() => v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }));
    await v_be73a0(async () => { await v_43c42e.current.start(); });
    await v_be73a0(async () => { await v_43c42e.current.say('a'); });
    await v_be73a0(async () => { await v_43c42e.current.say('b'); });
    expect(v_d5dda0.sayInCall).toHaveBeenCalledTimes(1);
  });

  it('say: 통화 미시작(pc 없음) → no-op', async () => {
    const v_d5dda0 = { ...v_84b93d(v_e6273b()), sayInCall: jest.fn() };
    const { result: v_43c42e } = v_0da18b(() => v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }));
    await v_be73a0(async () => { await v_43c42e.current.say('x'); });
    expect(v_d5dda0.sayInCall).not.toHaveBeenCalled();
  });

  describe('soft timeout (fake timer)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('say→speaking 후 30s soft timeout → phase idle 복귀', async () => {
      v_57d229();
      const v_12cd99 = v_e6273b();
      const v_d5dda0 = { ...v_84b93d(v_12cd99), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
      const { result: v_43c42e } = v_0da18b(() => v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }));
      await v_be73a0(async () => { await v_43c42e.current.start(); });

      jest.useFakeTimers();
      await v_be73a0(async () => { await v_43c42e.current.say('타임아웃 테스트'); });
      expect(v_43c42e.current.phase).toBe('speaking');

      v_be73a0(() => { jest.advanceTimersByTime(30_000); });
      await v_81e49f(() => expect(v_43c42e.current.phase).toBe('idle'));
    });

    it('say(speaking) → stop → 타이머 advance 후에도 dead setState 없음 (phase는 stop이 idle로)', async () => {
      v_57d229();
      const v_12cd99 = v_e6273b();
      const v_d5dda0 = { ...v_84b93d(v_12cd99), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
      const { result: v_43c42e } = v_0da18b(() => v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }));
      await v_be73a0(async () => { await v_43c42e.current.start(); });

      jest.useFakeTimers();
      await v_be73a0(async () => { await v_43c42e.current.say('타이머 클리어 테스트'); });
      expect(v_43c42e.current.phase).toBe('speaking');

      await v_be73a0(async () => { await v_43c42e.current.stop(); });
      expect(v_43c42e.current.phase).toBe('idle');

      v_be73a0(() => { jest.advanceTimersByTime(30_000); });
      expect(v_43c42e.current.phase).toBe('idle');
    });
  });

  describe('audioSession lifecycle', () => {
    it('start 핸드셰이크 완료(renegotiate) 후 audioSession.activate 1회 호출', async () => {
      v_57d229();
      const v_12cd99 = v_e6273b();
      const v_cec4d7 = v_b49c15();
      const v_d5dda0 = v_84b93d(v_12cd99, v_cec4d7);
      const { result: v_43c42e } = v_0da18b(() =>
        v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
      );
      await v_be73a0(async () => {
        await v_43c42e.current.start();
      });
      expect(v_cec4d7.activate).toHaveBeenCalledTimes(1);
      expect(v_cec4d7.deactivate).not.toHaveBeenCalled();
    });

    it('stop 호출 시 audioSession.deactivate 1회 호출', async () => {
      v_57d229();
      const v_12cd99 = v_e6273b();
      const v_cec4d7 = v_b49c15();
      const v_d5dda0 = v_84b93d(v_12cd99, v_cec4d7);
      const { result: v_43c42e } = v_0da18b(() =>
        v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
      );
      await v_be73a0(async () => {
        await v_43c42e.current.start();
      });
      await v_be73a0(async () => {
        await v_43c42e.current.stop();
      });
      expect(v_cec4d7.deactivate).toHaveBeenCalledTimes(1);
    });

    it('startCall 실패 시 audioSession.activate 미호출', async () => {
      const v_cec4d7 = v_b49c15();
      const v_d5dda0 = {
        startCall: jest.fn().mockRejectedValue(new Error('boom')),
        endCall: jest.fn(),
        sayInCall: jest.fn(),
        createPeerConnection: jest.fn(),
        audioSession: v_cec4d7,
      };
      const { result: v_43c42e } = v_0da18b(() =>
        v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
      );
      await v_be73a0(async () => {
        await v_43c42e.current.start();
      });
      expect(v_cec4d7.activate).not.toHaveBeenCalled();
    });
  });

  describe('say 실패 후 재시도', () => {
    it('sayInCall reject → phase idle + error 세팅, 이후 정상 say → speaking', async () => {
      v_57d229();
      const v_12cd99 = v_e6273b();
      const v_9595ba = jest.fn().mockRejectedValue(new Error('say_fail'));
      const v_d5dda0 = { ...v_84b93d(v_12cd99), sayInCall: v_9595ba };
      const { result: v_43c42e } = v_0da18b(() => v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }));
      await v_be73a0(async () => { await v_43c42e.current.start(); });

      await v_be73a0(async () => { await v_43c42e.current.say('실패 테스트'); });
      expect(v_43c42e.current.phase).toBe('idle');
      expect(v_43c42e.current.error).toBeTruthy();
      expect(v_43c42e.current.error?.message).toBe('say_fail');

      v_9595ba.mockResolvedValue({ ok: true });
      await v_be73a0(async () => { await v_43c42e.current.say('재시도 테스트'); });
      expect(v_43c42e.current.phase).toBe('speaking');
    });
  });
});

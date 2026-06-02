import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLiveAvatar } from '../../src/realtime/useLiveAvatar';

const ticket = {
  callId: 'c1',
  subscribeUrl: 'https://o/oth-path',
  renegotiateUrl: 'https://o/oth-path',
  subscribeToken: 'tok',
  tracks: { video: 'v', audio: 'a' },
  expiresAt: 'x',
};

function makeMockPc() {
  const listeners: Record<string, Array<(p?: unknown) => void>> = {};
  return {
    connectionState: 'new',
    iceConnectionState: 'new',
    addEventListener: (ev: string, cb: (p?: unknown) => void) => {
      (listeners[ev] ||= []).push(cb);
    },
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'ANSWER' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (ev: string, payload?: unknown) => (listeners[ev] || []).forEach((cb) => cb(payload)),
  };
}

function mockSubscribeFetch() {
  global.fetch = jest.fn().mockImplementation(async (url: string) => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify(
        String(url).endsWith('/subscribe')
          ? { subscriber_session_id: 'sub1', offer_sdp: 'OFFER' }
          : { ok: true },
      ),
  })) as unknown as typeof fetch;
}

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

function makeMockAudioSession() {
  return {
    activate: jest.fn(),
    deactivate: jest.fn(),
  };
}

type DepsOverrides = {
  sayInCall?: jest.Mock;
};

function deps(
  pc: ReturnType<typeof makeMockPc>,
  audioSession = makeMockAudioSession(),
  overrides: DepsOverrides = {},
) {
  return {
    startCall: jest.fn().mockResolvedValue(ticket),
    endCall: jest.fn().mockResolvedValue({ ok: true }),
    sayInCall: jest.fn().mockResolvedValue({ ok: true }),
    createPeerConnection: jest.fn().mockReturnValue(pc),
    audioSession,
    ...overrides,
  };
}

describe('useLiveAvatar', () => {
  it('start: 티켓→pc→subscribe(토큰)→offer→answer→renegotiate(토큰) 순서', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(d.startCall).toHaveBeenCalledWith('AT', 7);
    expect(d.createPeerConnection).toHaveBeenCalled();
    const calls = (global.fetch as jest.Mock).mock.calls;
    const sub = calls.find(([u]) => String(u).endsWith('/subscribe'));
    const rng = calls.find(([u]) => String(u).endsWith('/renegotiate'));
    expect(sub[1].headers.Authorization).toBe('Bearer tok');
    expect(pc.setRemoteDescription).toHaveBeenCalled();
    expect(pc.createAnswer).toHaveBeenCalled();
    expect(rng[1].headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(rng[1].body)).toEqual({
      subscriber_session_id: 'sub1',
      answer_sdp: 'ANSWER',
    });
  });

  it('ontrack→remoteStream, ICE connected→state=live', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      pc.emit('track', { streams: [{ toURL: () => 'mock://s' }], track: { kind: 'video' } });
      pc.iceConnectionState = 'connected';
      pc.emit('iceconnectionstatechange');
    });
    await waitFor(() => expect(result.current.state).toBe('live'));
    expect(result.current.remoteStream).toBeTruthy();
  });

  it('video/audio 별도 stream — audio ontrack 이 video remoteStream 을 덮어쓰지 않고, remoteStream 은 video stream 유지(RTCView 검은화면 방지)', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    act(() => {

      pc.emit('track', {
        streams: [{ id: 'vid', toURL: () => 'v', getVideoTracks: () => [{}], getAudioTracks: () => [] }],
        track: { kind: 'video' },
      });
      pc.emit('track', {
        streams: [{ id: 'aud', toURL: () => 'a', getVideoTracks: () => [], getAudioTracks: () => [{}] }],
        track: { kind: 'audio' },
      });
    });
    await waitFor(() => expect(result.current.remoteStream).toBeTruthy());

    expect((result.current.remoteStream as unknown as { id: string }).id).toBe('vid');
  });

  it('audio-only ontrack(audio stream) 이 도착해도 video 없이 remoteStream=null 유지', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    act(() => {

      pc.emit('track', {
        streams: [{ id: 'aud', toURL: () => 'a', getVideoTracks: () => [], getAudioTracks: () => [{}] }],
        track: { kind: 'audio' },
      });
    });

    expect(result.current.remoteStream).toBeNull();
  });

  it('startCall 실패 → state=error, pc 미생성', async () => {
    const d = {
      startCall: jest.fn().mockRejectedValue(new Error('boom')),
      endCall: jest.fn(),
      sayInCall: jest.fn(),
      createPeerConnection: jest.fn(),
      audioSession: makeMockAudioSession(),
    };
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe('error');
    expect(d.createPeerConnection).not.toHaveBeenCalled();
  });

  it('subscribe 실패 → state=error + pc.close', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'invalid_subscribe_token' }),
    }) as unknown as typeof fetch;
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe('error');
    expect(pc.close).toHaveBeenCalled();
  });

  it('stop: pc.close + endCall + state=ended', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });
    expect(pc.close).toHaveBeenCalled();
    expect(d.endCall).toHaveBeenCalledWith('AT', 7, 'c1');
    expect(result.current.state).toBe('ended');
  });

  it('재진입 가드: 통화 활성 중 start 재호출 → pc/startCall 1회만', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.start();
    });
    expect(d.startCall).toHaveBeenCalledTimes(1);
    expect(d.createPeerConnection).toHaveBeenCalledTimes(1);
  });

  it('start 진행 중 언마운트 → 취소(pc 미생성, 잔류 setState 없음)', async () => {
    let resolveTicket: (v: unknown) => void = () => {};
    const d = {
      startCall: jest.fn().mockReturnValue(
        new Promise((r) => {
          resolveTicket = r;
        }),
      ),
      endCall: jest.fn().mockResolvedValue({ ok: true }),
      sayInCall: jest.fn().mockResolvedValue({ ok: true }),
      createPeerConnection: jest.fn().mockReturnValue(makeMockPc()),
      audioSession: makeMockAudioSession(),
    };
    mockSubscribeFetch();
    const { result, unmount } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    let startP: Promise<void> = Promise.resolve();
    act(() => {
      startP = result.current.start();
    });
    unmount();
    await act(async () => {
      resolveTicket(ticket);
      await startP;
    });

    expect(d.createPeerConnection).not.toHaveBeenCalled();
  });

  it('say: phase idle→sending→speaking, sayInCall 호출', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = { ...deps(pc), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
    const { result } = renderHook(() => useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }));
    await act(async () => { await result.current.start(); });
    await act(async () => { await result.current.say('안녕'); });
    expect(d.sayInCall).toHaveBeenCalledWith('AT', 7, 'c1', '안녕');
    expect(result.current.phase).toBe('speaking');
  });

  it('say 중복 가드: speaking 중 say 무시', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = { ...deps(pc), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
    const { result } = renderHook(() => useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }));
    await act(async () => { await result.current.start(); });
    await act(async () => { await result.current.say('a'); });
    await act(async () => { await result.current.say('b'); });
    expect(d.sayInCall).toHaveBeenCalledTimes(1);
  });

  it('say: 통화 미시작(pc 없음) → no-op', async () => {
    const d = { ...deps(makeMockPc()), sayInCall: jest.fn() };
    const { result } = renderHook(() => useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }));
    await act(async () => { await result.current.say('x'); });
    expect(d.sayInCall).not.toHaveBeenCalled();
  });

  describe('soft timeout (fake timer)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('say→speaking 후 30s soft timeout → phase idle 복귀', async () => {
      mockSubscribeFetch();
      const pc = makeMockPc();
      const d = { ...deps(pc), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
      const { result } = renderHook(() => useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }));
      await act(async () => { await result.current.start(); });

      jest.useFakeTimers();
      await act(async () => { await result.current.say('타임아웃 테스트'); });
      expect(result.current.phase).toBe('speaking');

      act(() => { jest.advanceTimersByTime(30_000); });
      await waitFor(() => expect(result.current.phase).toBe('idle'));
    });

    it('say(speaking) → stop → 타이머 advance 후에도 dead setState 없음 (phase는 stop이 idle로)', async () => {
      mockSubscribeFetch();
      const pc = makeMockPc();
      const d = { ...deps(pc), sayInCall: jest.fn().mockResolvedValue({ ok: true }) };
      const { result } = renderHook(() => useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }));
      await act(async () => { await result.current.start(); });

      jest.useFakeTimers();
      await act(async () => { await result.current.say('타이머 클리어 테스트'); });
      expect(result.current.phase).toBe('speaking');

      await act(async () => { await result.current.stop(); });
      expect(result.current.phase).toBe('idle');

      act(() => { jest.advanceTimersByTime(30_000); });
      expect(result.current.phase).toBe('idle');
    });
  });

  describe('audioSession lifecycle', () => {
    it('start 핸드셰이크 완료(renegotiate) 후 audioSession.activate 1회 호출', async () => {
      mockSubscribeFetch();
      const pc = makeMockPc();
      const audioSession = makeMockAudioSession();
      const d = deps(pc, audioSession);
      const { result } = renderHook(() =>
        useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
      );
      await act(async () => {
        await result.current.start();
      });
      expect(audioSession.activate).toHaveBeenCalledTimes(1);
      expect(audioSession.deactivate).not.toHaveBeenCalled();
    });

    it('stop 호출 시 audioSession.deactivate 1회 호출', async () => {
      mockSubscribeFetch();
      const pc = makeMockPc();
      const audioSession = makeMockAudioSession();
      const d = deps(pc, audioSession);
      const { result } = renderHook(() =>
        useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
      );
      await act(async () => {
        await result.current.start();
      });
      await act(async () => {
        await result.current.stop();
      });
      expect(audioSession.deactivate).toHaveBeenCalledTimes(1);
    });

    it('startCall 실패 시 audioSession.activate 미호출', async () => {
      const audioSession = makeMockAudioSession();
      const d = {
        startCall: jest.fn().mockRejectedValue(new Error('boom')),
        endCall: jest.fn(),
        sayInCall: jest.fn(),
        createPeerConnection: jest.fn(),
        audioSession,
      };
      const { result } = renderHook(() =>
        useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
      );
      await act(async () => {
        await result.current.start();
      });
      expect(audioSession.activate).not.toHaveBeenCalled();
    });
  });

  describe('say 실패 후 재시도', () => {
    it('sayInCall reject → phase idle + error 세팅, 이후 정상 say → speaking', async () => {
      mockSubscribeFetch();
      const pc = makeMockPc();
      const sayInCallMock = jest.fn().mockRejectedValue(new Error('say_fail'));
      const d = { ...deps(pc), sayInCall: sayInCallMock };
      const { result } = renderHook(() => useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }));
      await act(async () => { await result.current.start(); });

      await act(async () => { await result.current.say('실패 테스트'); });
      expect(result.current.phase).toBe('idle');
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('say_fail');

      sayInCallMock.mockResolvedValue({ ok: true });
      await act(async () => { await result.current.say('재시도 테스트'); });
      expect(result.current.phase).toBe('speaking');
    });
  });

  describe('VAD 확장 (notifySpeechEnd / getStatsReport)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('notifySpeechEnd: say 후 speaking → notifySpeechEnd 호출 시 phase=idle', async () => {
      jest.useFakeTimers();
      mockSubscribeFetch();
      const pc = makeMockPc();
      const sayInCall = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useLiveAvatar({ cloneId: 1, accessToken: 't', deps: deps(pc, undefined, { sayInCall }) }),
      );
      await act(async () => { await result.current.start(); });
      await act(async () => { await result.current.say('안녕'); });
      expect(result.current.phase).toBe('speaking');
      act(() => { result.current.notifySpeechEnd(); });
      expect(result.current.phase).toBe('idle');
    });

    it('getStatsReport: pc.getStats를 위임 호출, 통화 없으면 null', async () => {
      mockSubscribeFetch();
      const pc = makeMockPc();
      const fakeReport: Array<[string, Record<string, unknown>]> = [
        ['a', { type: 'inbound-rtp', kind: 'audio', audioLevel: 0.3 }],
      ];
      (pc as unknown as { getStats: jest.Mock }).getStats = jest.fn().mockResolvedValue(fakeReport);
      const { result } = renderHook(() =>
        useLiveAvatar({ cloneId: 1, accessToken: 't', deps: deps(pc) }),
      );
      expect(result.current.getStatsReport()).toBeNull();
      await act(async () => { await result.current.start(); });
      const p = result.current.getStatsReport();
      expect(p).not.toBeNull();
      await expect(p as Promise<unknown>).resolves.toBe(fakeReport);
    });
  });
});

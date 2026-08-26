

import {
  v_0e643a,
  v_9b9e9c,
  type v_f2c1af,
} from '../videoStats';

function v_2888b4(v_1e6eca): Iterable<[string, Record<string, unknown>]> {
  return v_1e6eca.map((v_9e86fd, v_ebec57) => [String(v_9e86fd['id'] ?? `s${v_ebec57}`), v_9e86fd] as [string, Record<string, unknown>]);
}

describe('extractInboundVideoStats', () => {
  it('inbound-rtp video 엔트리를 추출한다', () => {
    const v_cb35cb = v_2888b4([
      { type: 'inbound-rtp', kind: 'audio', audioLevel: 0.1 },
      { type: 'outbound-rtp', kind: 'video', framesSent: 100 },
      {
        type: 'inbound-rtp',
        kind: 'video',
        framesReceived: 250,
        framesDecoded: 240,
        framesDropped: 3,
        framesPerSecond: 24,
        freezeCount: 2,
        totalFreezesDuration: 1.5,
        packetsReceived: 5000,
        packetsLost: 4,
        jitterBufferDelay: 12.3,
        timestamp: 10000,
      },
    ]);
    const v_fd5f43 = v_0e643a(v_cb35cb);
    expect(v_fd5f43).not.toBeNull();
    expect(v_fd5f43!.framesReceived).toBe(250);
    expect(v_fd5f43!.framesDecoded).toBe(240);
    expect(v_fd5f43!.framesDropped).toBe(3);
    expect(v_fd5f43!.framesPerSecond).toBe(24);
    expect(v_fd5f43!.freezeCount).toBe(2);
    expect(v_fd5f43!.ts).toBe(10000);
  });

  it('inbound video가 없으면 null', () => {
    const v_cb35cb = v_2888b4([{ type: 'inbound-rtp', kind: 'audio', audioLevel: 0.2 }]);
    expect(v_0e643a(v_cb35cb)).toBeNull();
  });

  it('누락 필드는 0으로 기본값', () => {
    const v_cb35cb = v_2888b4([{ type: 'inbound-rtp', kind: 'video', framesReceived: 30, timestamp: 5000 }]);
    const v_fd5f43 = v_0e643a(v_cb35cb)!;
    expect(v_fd5f43.framesReceived).toBe(30);
    expect(v_fd5f43.framesDecoded).toBe(0);
    expect(v_fd5f43.framesDropped).toBe(0);
    expect(v_fd5f43.freezeCount).toBe(0);
  });

  it('report가 null이면 null', () => {
    expect(v_0e643a(null)).toBeNull();
  });
});

function v_55172c(over: Partial<v_f2c1af>): v_f2c1af {
  return {
    framesReceived: 0,
    framesDecoded: 0,
    framesDropped: 0,
    framesPerSecond: 0,
    freezeCount: 0,
    totalFreezesDuration: 0,
    packetsReceived: 0,
    packetsLost: 0,
    jitterBufferDelay: 0,
    ts: 0,

    frameWidth: 0,
    frameHeight: 0,
    ...v_b71f86,
  };
}

describe('diffInboundVideoStats', () => {
  it('프레임 델타와 디코드 fps를 계산한다', () => {
    const v_ba2215 = v_55172c({ framesReceived: 100, framesDecoded: 100, ts: 0 });
    const v_c3bc75 = v_55172c({ framesReceived: 150, framesDecoded: 149, ts: 2000 }); 
    const v_d5dda0 = v_9b9e9c(v_ba2215, v_c3bc75)!;
    expect(v_d5dda0.dtMs).toBe(2000);
    expect(v_d5dda0.receivedDelta).toBe(50);
    expect(v_d5dda0.decodedDelta).toBe(49);
    expect(v_d5dda0.decodeFps).toBeCloseTo(24.5, 1);
    expect(v_d5dda0.verdict).toBe('ok');
  });

  it('수신은 오르는데 디코드가 정체 → client-decode-stall', () => {

    const v_ba2215 = v_55172c({ framesReceived: 200, framesDecoded: 190, ts: 0 });
    const v_c3bc75 = v_55172c({ framesReceived: 245, framesDecoded: 192, ts: 2000 });
    const v_d5dda0 = v_9b9e9c(v_ba2215, v_c3bc75)!;
    expect(v_d5dda0.verdict).toBe('client-decode-stall');
  });

  it('수신 자체가 정체 → transport-stall', () => {

    const v_ba2215 = v_55172c({ framesReceived: 300, framesDecoded: 300, ts: 0 });
    const v_c3bc75 = v_55172c({ framesReceived: 301, framesDecoded: 301, ts: 2000 });
    const v_d5dda0 = v_9b9e9c(v_ba2215, v_c3bc75)!;
    expect(v_d5dda0.verdict).toBe('transport-stall');
  });

  it('건강한 재생 → ok', () => {
    const v_ba2215 = v_55172c({ framesReceived: 0, framesDecoded: 0, ts: 0 });
    const v_c3bc75 = v_55172c({ framesReceived: 50, framesDecoded: 50, ts: 2000 });
    const v_d5dda0 = v_9b9e9c(v_ba2215, v_c3bc75)!;
    expect(v_d5dda0.verdict).toBe('ok');
  });

  it('dt가 0 이하이면 null(중복/역행 샘플 방어)', () => {
    const v_ba2215 = v_55172c({ ts: 2000 });
    const v_c3bc75 = v_55172c({ ts: 2000 });
    expect(v_9b9e9c(v_ba2215, v_c3bc75)).toBeNull();
  });
});

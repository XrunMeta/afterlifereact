

import {
  extractInboundVideoStats,
  diffInboundVideoStats,
  type InboundVideoStats,
} from '../videoStats';

function report(entries: Record<string, unknown>[]): Iterable<[string, Record<string, unknown>]> {
  return entries.map((e, i) => [String(e['id'] ?? `s${i}`), e] as [string, Record<string, unknown>]);
}

describe('extractInboundVideoStats', () => {
  it('inbound-rtp video 엔트리를 추출한다', () => {
    const r = report([
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
    const s = extractInboundVideoStats(r);
    expect(s).not.toBeNull();
    expect(s!.framesReceived).toBe(250);
    expect(s!.framesDecoded).toBe(240);
    expect(s!.framesDropped).toBe(3);
    expect(s!.framesPerSecond).toBe(24);
    expect(s!.freezeCount).toBe(2);
    expect(s!.ts).toBe(10000);
  });

  it('inbound video가 없으면 null', () => {
    const r = report([{ type: 'inbound-rtp', kind: 'audio', audioLevel: 0.2 }]);
    expect(extractInboundVideoStats(r)).toBeNull();
  });

  it('누락 필드는 0으로 기본값', () => {
    const r = report([{ type: 'inbound-rtp', kind: 'video', framesReceived: 30, timestamp: 5000 }]);
    const s = extractInboundVideoStats(r)!;
    expect(s.framesReceived).toBe(30);
    expect(s.framesDecoded).toBe(0);
    expect(s.framesDropped).toBe(0);
    expect(s.freezeCount).toBe(0);
  });

  it('report가 null이면 null', () => {
    expect(extractInboundVideoStats(null)).toBeNull();
  });
});

function stat(over: Partial<InboundVideoStats>): InboundVideoStats {
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
    ...over,
  };
}

describe('diffInboundVideoStats', () => {
  it('프레임 델타와 디코드 fps를 계산한다', () => {
    const prev = stat({ framesReceived: 100, framesDecoded: 100, ts: 0 });
    const cur = stat({ framesReceived: 150, framesDecoded: 149, ts: 2000 }); 
    const d = diffInboundVideoStats(prev, cur)!;
    expect(d.dtMs).toBe(2000);
    expect(d.receivedDelta).toBe(50);
    expect(d.decodedDelta).toBe(49);
    expect(d.decodeFps).toBeCloseTo(24.5, 1);
    expect(d.verdict).toBe('ok');
  });

  it('수신은 오르는데 디코드가 정체 → client-decode-stall', () => {

    const prev = stat({ framesReceived: 200, framesDecoded: 190, ts: 0 });
    const cur = stat({ framesReceived: 245, framesDecoded: 192, ts: 2000 });
    const d = diffInboundVideoStats(prev, cur)!;
    expect(d.verdict).toBe('client-decode-stall');
  });

  it('수신 자체가 정체 → transport-stall', () => {

    const prev = stat({ framesReceived: 300, framesDecoded: 300, ts: 0 });
    const cur = stat({ framesReceived: 301, framesDecoded: 301, ts: 2000 });
    const d = diffInboundVideoStats(prev, cur)!;
    expect(d.verdict).toBe('transport-stall');
  });

  it('건강한 재생 → ok', () => {
    const prev = stat({ framesReceived: 0, framesDecoded: 0, ts: 0 });
    const cur = stat({ framesReceived: 50, framesDecoded: 50, ts: 2000 });
    const d = diffInboundVideoStats(prev, cur)!;
    expect(d.verdict).toBe('ok');
  });

  it('dt가 0 이하이면 null(중복/역행 샘플 방어)', () => {
    const prev = stat({ ts: 2000 });
    const cur = stat({ ts: 2000 });
    expect(diffInboundVideoStats(prev, cur)).toBeNull();
  });
});

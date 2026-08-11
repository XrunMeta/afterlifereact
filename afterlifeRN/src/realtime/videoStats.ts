

export interface InboundVideoStats {
  framesReceived: number;
  framesDecoded: number;
  framesDropped: number;
  framesPerSecond: number; 
  freezeCount: number;
  totalFreezesDuration: number; 
  packetsReceived: number;
  packetsLost: number;
  jitterBufferDelay: number;
  ts: number; 

  frameWidth: number;
  frameHeight: number;
}

export type VideoStallVerdict = 'ok' | 'client-decode-stall' | 'transport-stall';

export interface VideoStatsDelta {
  dtMs: number;
  receivedDelta: number;
  decodedDelta: number;
  droppedDelta: number;
  freezeDelta: number;
  receiveFps: number;
  decodeFps: number;
  verdict: VideoStallVerdict;
}

const v_27e9ea = 3;

const v_3b42e3 = 5;

function v_0ad8c5(v_81e2ef): number {
  return typeof v_81e2ef === 'number' && Number.isFinite(v_81e2ef) ? v_81e2ef : 0;
}

export function v_0e643a(
  v_2888b4,
): InboundVideoStats | null {
  if (!v_2888b4) return null;
  for (const [, v_55172c] of v_2888b4) {
    if (v_55172c['type'] === 'inbound-rtp' && v_55172c['kind'] === 'video') {
      return {
        framesReceived: v_0ad8c5(v_55172c['framesReceived']),
        framesDecoded: v_0ad8c5(v_55172c['framesDecoded']),
        framesDropped: v_0ad8c5(v_55172c['framesDropped']),
        framesPerSecond: v_0ad8c5(v_55172c['framesPerSecond']),
        freezeCount: v_0ad8c5(v_55172c['freezeCount']),
        totalFreezesDuration: v_0ad8c5(v_55172c['totalFreezesDuration']),
        packetsReceived: v_0ad8c5(v_55172c['packetsReceived']),
        packetsLost: v_0ad8c5(v_55172c['packetsLost']),
        jitterBufferDelay: v_0ad8c5(v_55172c['jitterBufferDelay']),
        ts: v_0ad8c5(v_55172c['timestamp']),
        frameWidth: v_0ad8c5(v_55172c['frameWidth']),
        frameHeight: v_0ad8c5(v_55172c['frameHeight']),
      };
    }
  }
  return null;
}

export function v_9b9e9c(
  v_ba2215,
  v_c3bc75,
): VideoStatsDelta | null {
  const v_414ae9 = v_c3bc75.ts - v_ba2215.ts;
  if (v_414ae9 <= 0) return null;
  const v_7c649e = v_414ae9 / 1000;
  const v_3ee03c = v_c3bc75.framesReceived - v_ba2215.framesReceived;
  const v_8d67af = v_c3bc75.framesDecoded - v_ba2215.framesDecoded;
  const v_c9e497 = v_c3bc75.framesDropped - v_ba2215.framesDropped;
  const v_31579f = v_c3bc75.freezeCount - v_ba2215.freezeCount;
  const v_2d825a = v_3ee03c / v_7c649e;
  const v_10ed96 = v_8d67af / v_7c649e;

  let v_1b0e1d;
  if (v_2d825a < v_27e9ea) {
    v_1b0e1d = 'transport-stall';
  } else if (v_10ed96 < v_3b42e3) {
    v_1b0e1d = 'client-decode-stall';
  } else {
    v_1b0e1d = 'ok';
  }

  return {
    dtMs: v_414ae9,
    receivedDelta: v_3ee03c,
    decodedDelta: v_8d67af,
    droppedDelta: v_c9e497,
    freezeDelta: v_31579f,
    receiveFps: v_2d825a,
    decodeFps: v_10ed96,
    verdict: v_1b0e1d,
  };
}

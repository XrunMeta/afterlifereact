

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

const RECEIVE_STALL_FPS = 3;

const DECODE_STALL_FPS = 5;

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export function extractInboundVideoStats(
  report: Iterable<[string, Record<string, unknown>]> | null | undefined,
): InboundVideoStats | null {
  if (!report) return null;
  for (const [, stat] of report) {
    if (stat['type'] === 'inbound-rtp' && stat['kind'] === 'video') {
      return {
        framesReceived: num(stat['framesReceived']),
        framesDecoded: num(stat['framesDecoded']),
        framesDropped: num(stat['framesDropped']),
        framesPerSecond: num(stat['framesPerSecond']),
        freezeCount: num(stat['freezeCount']),
        totalFreezesDuration: num(stat['totalFreezesDuration']),
        packetsReceived: num(stat['packetsReceived']),
        packetsLost: num(stat['packetsLost']),
        jitterBufferDelay: num(stat['jitterBufferDelay']),
        ts: num(stat['timestamp']),
      };
    }
  }
  return null;
}

export function diffInboundVideoStats(
  prev: InboundVideoStats,
  cur: InboundVideoStats,
): VideoStatsDelta | null {
  const dtMs = cur.ts - prev.ts;
  if (dtMs <= 0) return null;
  const dtSec = dtMs / 1000;
  const receivedDelta = cur.framesReceived - prev.framesReceived;
  const decodedDelta = cur.framesDecoded - prev.framesDecoded;
  const droppedDelta = cur.framesDropped - prev.framesDropped;
  const freezeDelta = cur.freezeCount - prev.freezeCount;
  const receiveFps = receivedDelta / dtSec;
  const decodeFps = decodedDelta / dtSec;

  let verdict: VideoStallVerdict;
  if (receiveFps < RECEIVE_STALL_FPS) {
    verdict = 'transport-stall';
  } else if (decodeFps < DECODE_STALL_FPS) {
    verdict = 'client-decode-stall';
  } else {
    verdict = 'ok';
  }

  return {
    dtMs,
    receivedDelta,
    decodedDelta,
    droppedDelta,
    freezeDelta,
    receiveFps,
    decodeFps,
    verdict,
  };
}

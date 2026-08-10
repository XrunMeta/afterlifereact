

import { useEffect, useRef } from 'react';
import {
  extractInboundVideoStats,
  diffInboundVideoStats,
  type InboundVideoStats,
} from './videoStats';

const POLL_MS = 5000; 

export function useVideoStatsDiag(opts: {

  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;

  enabled: boolean;

  pollMs?: number;
}) {
  const getStatsRef = useRef(opts.getStatsReport);
  useEffect(() => {
    getStatsRef.current = opts.getStatsReport;
  });

  const pollMs = opts.pollMs ?? POLL_MS;
  const enabled = opts.enabled;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let prev: InboundVideoStats | null = null;

    const timer = setInterval(() => {
      void (async () => {
        try {
          const p = getStatsRef.current();
          const report = p ? await p : null;
          if (!active) return;
          const cur = extractInboundVideoStats(report);
          if (!cur) {

            return;
          }
          if (prev) {
            const d = diffInboundVideoStats(prev, cur);
            if (d) {

              console.log(
                `[Call][vstat] recvΔ=${d.receivedDelta} decΔ=${d.decodedDelta} ` +
                  `dropΔ=${d.droppedDelta} freezeΔ=${d.freezeDelta} ` +
                  `recvFps=${d.receiveFps.toFixed(1)} decFps=${d.decodeFps.toFixed(1)} ` +
                  `fps(rep)=${cur.framesPerSecond} freezeTot=${cur.totalFreezesDuration.toFixed(2)}s ` +
                  `pktLost=${cur.packetsLost} dim=${cur.frameWidth}x${cur.frameHeight} → ${d.verdict}`,
              );
            }
          } else {

            console.log(
              `[Call][vstat] baseline recv=${cur.framesReceived} dec=${cur.framesDecoded} ` +
                `dropped=${cur.framesDropped} freeze=${cur.freezeCount} ` +
                `dim=${cur.frameWidth}x${cur.frameHeight}`,
            );
          }
          prev = cur;
        } catch (e) {

        }
      })();
    }, pollMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled, pollMs]);
}



import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  cloneSilenceStep,
  extractCloneAudioLevel,
  initCloneSilenceState,
  DEFAULT_CLONE_SILENCE_CONFIG,
  type CloneSilenceConfig,
} from './cloneSilence';

const POLL_MS = 200; 

export function useCloneSilenceDetector(opts: {

  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;

  onResponseEnd: () => void;
  config?: Partial<CloneSilenceConfig>;
}) {
  const cfg = useMemo<CloneSilenceConfig>(
    () => ({ ...DEFAULT_CLONE_SILENCE_CONFIG, ...opts.config }),

    [],
  );
  const onEndRef = useRef(opts.onResponseEnd);
  useEffect(() => { onEndRef.current = opts.onResponseEnd; });
  const getStatsRef = useRef(opts.getStatsReport);
  useEffect(() => { getStatsRef.current = opts.getStatsReport; });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(initCloneSilenceState());

  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    activeRef.current = true;
    stateRef.current = initCloneSilenceState();
    timerRef.current = setInterval(() => {
      void (async () => {
        let level: number | undefined;
        try {
          const p = getStatsRef.current();
          const report = p ? await p : null;
          level = extractCloneAudioLevel(report);
        } catch {
          level = undefined;
        }

        if (!activeRef.current) return;
        const next = cloneSilenceStep(stateRef.current, level, POLL_MS, cfg);
        stateRef.current = next;
        if (next.phase === 'ended') {
          stop();
          onEndRef.current();
        }
      })();
    }, POLL_MS);
  }, [stop, cfg]);

  useEffect(() => stop, [stop]);

  return { start, stop };
}

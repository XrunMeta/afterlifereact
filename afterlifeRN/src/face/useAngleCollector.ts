

import { useCallback, useEffect, useRef } from "react";
import { enrollFaces } from "../api/persons";

const ANGLE_DIVERSITY_MIN_L2 = 0.15;

const FLUSH_INTERVAL_MS = 30_000;

const FLUSH_BATCH_SIZE = 3;

const MAX_PER_SESSION = 20;

interface PersonBuffer {

  enrolled: number[][];

  pending: number[][];

  flushInFlight: boolean;
}

function l2distance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  return Math.sqrt(sum);
}

function minL2(vec: number[], pool: number[][]): number {
  if (pool.length === 0) return Infinity;
  let m = Infinity;
  for (const p of pool) {
    const d = l2distance(vec, p);
    if (d < m) m = d;
  }
  return m;
}

export interface UseAngleCollectorOptions {
  accessToken: string | null;
  cloneId: number;
  enabled: boolean;
}

export interface UseAngleCollectorResult {

  observe: (personId: number, vector: number[]) => void;

  reset: () => void;
}

export function useAngleCollector(opts: UseAngleCollectorOptions): UseAngleCollectorResult {
  const { accessToken, cloneId, enabled } = opts;
  const buffersRef = useRef<Map<number, PersonBuffer>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flushOne = useCallback(
    async (personId: number, buf: PersonBuffer) => {
      if (!accessToken || buf.pending.length === 0 || buf.flushInFlight) return;
      if (buf.enrolled.length >= MAX_PER_SESSION) {

        buf.pending = [];
        return;
      }
      const room = MAX_PER_SESSION - buf.enrolled.length;
      const batch = buf.pending.slice(0, Math.min(5, room)); 
      buf.pending = buf.pending.slice(batch.length);
      buf.flushInFlight = true;
      try {
        console.log(`[AngleCollector] flushOne START person=${personId} batch=${batch.length} enrolled=${buf.enrolled.length}`);

        await enrollFaces(accessToken, personId, batch, cloneId);

        buf.enrolled.push(...batch);
        console.log(
          `[AngleCollector] flushOne SUCCESS person=${personId} added=${batch.length} total=${buf.enrolled.length}`,
        );
      } catch (err) {

        console.warn(`[AngleCollector] flushOne FAILED person=${personId}:`, err);
      } finally {
        buf.flushInFlight = false;
      }
    },
    [accessToken, cloneId],
  );

  useEffect(() => {
    if (!enabled) return;
    flushTimerRef.current = setInterval(() => {
      for (const [personId, buf] of buffersRef.current) {
        if (buf.pending.length > 0) void flushOne(personId, buf);
      }
    }, FLUSH_INTERVAL_MS);
    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [enabled, flushOne]);

  const observe = useCallback(
    (personId: number, vector: number[]) => {
      if (!enabled || !accessToken) {
        console.log(`[AngleCollector] observe SKIP enabled=${enabled} hasToken=${!!accessToken}`);
        return;
      }
      let buf = buffersRef.current.get(personId);
      if (!buf) {
        buf = { enrolled: [], pending: [], flushInFlight: false };
        buffersRef.current.set(personId, buf);

        buf.pending.push(vector);
        console.log(`[AngleCollector] FIRST observe person=${personId}, queued 1`);
        return;
      }
      if (buf.enrolled.length >= MAX_PER_SESSION) {
        console.log(`[AngleCollector] observe CAP person=${personId} enrolled=${buf.enrolled.length}`);
        return;
      }

      const pool = [...buf.enrolled, ...buf.pending];
      const minDist = minL2(vector, pool);
      if (minDist < ANGLE_DIVERSITY_MIN_L2) {
        console.log(`[AngleCollector] observe SKIP person=${personId} minL2=${minDist.toFixed(3)} < ${ANGLE_DIVERSITY_MIN_L2}`);
        return; 
      }
      buf.pending.push(vector);
      console.log(`[AngleCollector] observe QUEUE person=${personId} minL2=${minDist.toFixed(3)} pending=${buf.pending.length}`);
      if (buf.pending.length >= FLUSH_BATCH_SIZE) {
        console.log(`[AngleCollector] observe → flush trigger person=${personId}`);
        void flushOne(personId, buf);
      }
    },
    [enabled, accessToken, flushOne],
  );

  const reset = useCallback(() => {

    for (const [personId, buf] of buffersRef.current) {
      if (buf.pending.length > 0) void flushOne(personId, buf);
    }
    buffersRef.current.clear();
  }, [flushOne]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return { observe, reset };
}

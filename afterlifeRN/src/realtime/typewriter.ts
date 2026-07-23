

import { useEffect, useRef, useState } from 'react';

export const TYPEWRITER_MS_PER_CHAR = 45;

export function advanceReveal(revealed: number, targetLength: number): number {
  if (targetLength <= 0) return 0;
  return revealed < targetLength ? revealed + 1 : revealed;
}

const HIGH_SURROGATE_MIN = 0xd800;
const HIGH_SURROGATE_MAX = 0xdbff;

export function revealedText(target: string, revealed: number): string {
  if (!target) return '';
  let n = Math.min(Math.max(revealed, 0), target.length);
  if (n > 0) {
    const lastCode = target.charCodeAt(n - 1);
    if (lastCode >= HIGH_SURROGATE_MIN && lastCode <= HIGH_SURROGATE_MAX) {
      n -= 1;
    }
  }
  return target.slice(0, n);
}

export function useTypewriter(target: string, msPerChar: number = TYPEWRITER_MS_PER_CHAR): string {
  const [revealed, setRevealed] = useState(0);
  const targetRef = useRef(target);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    if (!target) {

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRevealed(0);
      return undefined;
    }
    if (timerRef.current) {

      return undefined;
    }
    timerRef.current = setInterval(() => {
      setRevealed((prev) => advanceReveal(prev, targetRef.current.length));
    }, msPerChar);
    return undefined;

  }, [target, msPerChar]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return revealedText(target, revealed);
}

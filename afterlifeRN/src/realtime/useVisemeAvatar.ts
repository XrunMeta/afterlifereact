

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../config/apiBase";
import { ensureFreshAccessToken } from "../lib/authFetch";
import { type AvatarCall, type LiveAvatarState, type CallPhase, type SpeechSignal } from "./avatarCall";
import { type VisemeSynthResponse } from "../components/viseme/VisemePlayer";

export interface UseVisemeAvatarResult extends AvatarCall {

  synthResponse: VisemeSynthResponse | null;
}

export function useVisemeAvatar(opts: {
  cloneId: number;
  accessToken: string;
}): UseVisemeAvatarResult {
  const { cloneId, accessToken } = opts;
  const [state, setState] = useState<LiveAvatarState>("idle");
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [synthResponse, setSynthResponse] = useState<VisemeSynthResponse | null>(null);
  const [lastSignal, setLastSignal] = useState<SpeechSignal | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  const start = useCallback(async () => {
    if (!aliveRef.current) return;
    setState("connecting");

    setState("live");
    setPhase("listening");
    if (__DEV__) console.log(`[CALL-ROUTE] viseme_playback: start cloneId=${cloneId}`);
  }, [cloneId]);

  const stop = useCallback(async () => {
    setPhase("idle");
    setState("ended");
    setSynthResponse(null);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!aliveRef.current) return;
    const t = (text ?? "").trim();
    if (!t) return;
    setPhase("speaking");
    setLastSignal({ type: "speech_start", ts: Date.now() });
    try {
      const freshToken = await ensureFreshAccessToken(accessToken);
      const url = `${API_BASE}/oth-path`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ text: t }),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`viseme_synth_http_${r.status}: ${body.slice(0, 200)}`);
      }
      const data = (await r.json()) as VisemeSynthResponse;
      if (!aliveRef.current) return;
      setSynthResponse({ ...data }); 

      setLastSignal({ type: "speech_end", ts: Date.now(), remainingMs: data.duration_ms });
    } catch (e) {
      if (aliveRef.current) {
        setError(e as Error);
        console.warn("[useVisemeAvatar] speak failed:", e);
      }
    } finally {
      if (aliveRef.current) setPhase("listening");
    }
  }, [accessToken]);

  const say = speak;

  const greet = useCallback(async () => {
    await speak("안녕하세요");
  }, [speak]);

  const notifySpeechEnd = useCallback(() => {

  }, []);

  const getStatsReport = useCallback(() => {

    return null;
  }, []);

  return {
    state,
    remoteStream: null, 
    error,
    start,
    stop,
    phase,
    say,
    notifySpeechEnd,
    getStatsReport,
    greet,
    speak,
    lastSignal,
    synthResponse,
  };
}

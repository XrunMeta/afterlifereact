

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../config/apiBase";
import { ensureFreshAccessToken } from "../lib/authFetch";
import { type AvatarCall, type LiveAvatarState, type CallPhase, type SpeechSignal } from "./avatarCall";
import { type VisemeSynthResponse } from "../components/viseme/VisemePlayer";

export interface UseVisemeAvatarResult extends AvatarCall {

  synthResponse: VisemeSynthResponse | null;

  speakWithOpts: (text: string, opts?: { seKey?: string }) => Promise<void>;
}

export function useVisemeAvatar(opts: {
  cloneId: number;
  accessToken: string;
  onEnrollSuggest?: (name: string, personId?: number) => void;
  onRememberMe?: () => void;
  pipeline?: string | null;
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

  const speakWithOpts = useCallback(async (text: string, opts?: { seKey?: string }) => {
    if (!aliveRef.current) return;
    const t = (text ?? "").trim();
    if (!t) return;
    setPhase("speaking");
    setLastSignal({ type: "speech_start", ts: Date.now() });
    try {
      const freshToken = await ensureFreshAccessToken(accessToken);
      const url = `${API_BASE}/oth-path`;
      const body: { text: string; se_key?: string } = { text: t };
      if (opts?.seKey) body.se_key = opts.seKey;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        throw new Error(`viseme_synth_http_${r.status}: ${errBody.slice(0, 200)}`);
      }
      const data = (await r.json()) as VisemeSynthResponse;
      if (!aliveRef.current) return;
      setSynthResponse({ ...data }); 

      setLastSignal({ type: "speech_end", ts: Date.now(), remainingMs: data.duration_ms });
      setError(null);
    } catch (e) {
      if (aliveRef.current) {
        setError(e as Error);
        console.warn("[useVisemeAvatar] speak failed:", e);
      }
    } finally {
      if (aliveRef.current) setPhase("listening");
    }
  }, [accessToken]);

  const speak = useCallback(async (text: string) => { await speakWithOpts(text); }, [speakWithOpts]);

  const chatSeqRef = useRef(0);
  const chat = useCallback(async (userText: string) => {
    if (!aliveRef.current) return;
    const t = (userText ?? "").trim();
    if (!t) return;
    const mySeq = ++chatSeqRef.current;
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
        body: JSON.stringify({ text: t, clone_id: cloneId }),
      });
      if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        throw new Error(`viseme_chat_http_${r.status}: ${errBody.slice(0, 200)}`);
      }
      const data = (await r.json()) as {
        response_text?: string;
        sentences?: Array<VisemeSynthResponse & { text?: string }>;
      };
      if (!aliveRef.current || chatSeqRef.current !== mySeq) return;
      const sentences = Array.isArray(data.sentences) ? data.sentences : [];
      if (sentences.length === 0) {

        console.warn("[useVisemeAvatar] chat: empty sentences · text=", t);
        setLastSignal({ type: "speech_end", ts: Date.now(), remainingMs: 0 });
        setError(null);
        return;
      }

      let cursor = 0;
      const playNext = () => {
        if (!aliveRef.current || chatSeqRef.current !== mySeq) return;
        const seg = sentences[cursor];
        setSynthResponse({ ...seg });
        if (seg.text) {
          setLastSignal({ type: "speech_text", ts: Date.now(), text: seg.text });
        }
        const dur = seg.duration_ms ?? 0;
        cursor += 1;
        if (cursor >= sentences.length) {

          setLastSignal({ type: "speech_end", ts: Date.now(), remainingMs: dur });
          return;
        }
        setTimeout(playNext, dur);
      };
      playNext();
      setError(null);
    } catch (e) {
      if (aliveRef.current && chatSeqRef.current === mySeq) {
        setError(e as Error);
        console.warn("[useVisemeAvatar] chat failed:", e);

        setLastSignal({ type: "speech_end", ts: Date.now(), remainingMs: 0 });
      }
    } finally {
      if (aliveRef.current && chatSeqRef.current === mySeq) setPhase("listening");
    }
  }, [accessToken, cloneId]);

  const say = chat;

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

    visemeResponse: synthResponse,
    speakWithOpts,
  };
}



import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_cc9198 } from "../config/apiBase";
import { v_335e37 } from "../lib/authFetch";
import { type v_b01667, type v_d20273, type v_b190e4, type v_9d43cd } from "./avatarCall";
import { type v_2a0baf } from "../components/viseme/VisemePlayer";

export interface UseVisemeAvatarResult extends v_b01667 {

  synthResponse: v_2a0baf | null;
}

export function v_e52b18(v_328259): UseVisemeAvatarResult {
  const { cloneId: v_6e0fd3, accessToken: v_2ca7e0 } = v_328259;
  const [v_b6e533, v_1fa668] = v_5ab095<v_d20273>("idle");
  const [v_ab4803, v_ae4844] = v_5ab095<v_b190e4>("idle");
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const [v_194cc6, v_88fed0] = v_5ab095<v_2a0baf | null>(null);
  const [v_88c591, v_8c8005] = v_5ab095<v_9d43cd | null>(null);
  const v_62d405 = v_e662ae(true);

  v_c4deb2(() => {
    v_62d405.current = true;
    return () => { v_62d405.current = false; };
  }, []);

  const v_965edf = v_de06a3(async () => {
    if (!v_62d405.current) return;
    v_1fa668("connecting");

    v_1fa668("live");
    v_ae4844("listening");
    if (__DEV__) console.log(`[CALL-ROUTE] viseme_playback: start cloneId=${v_6e0fd3}`);
  }, [v_6e0fd3]);

  const v_3e54f8 = v_de06a3(async () => {
    v_ae4844("idle");
    v_1fa668("ended");
    v_88fed0(null);
  }, []);

  const v_a1d9db = v_de06a3(async (v_9b6134) => {
    if (!v_62d405.current) return;
    const v_8d41d7 = (v_9b6134 ?? "").trim();
    if (!v_8d41d7) return;
    v_ae4844("speaking");
    v_8c8005({ type: "speech_start", ts: Date.now() });
    try {
      const v_f915d0 = await v_335e37(v_2ca7e0);
      const v_f71b56 = `${v_cc9198}/oth-path`;
      const v_cb35cb = await fetch(v_f71b56, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${v_f915d0}`,
        },
        body: JSON.stringify({ text: v_8d41d7 }),
      });
      if (!v_cb35cb.ok) {
        const v_4d33b2 = await v_cb35cb.text().catch(() => "");
        throw new Error(`viseme_synth_http_${v_cb35cb.status}: ${v_4d33b2.slice(0, 200)}`);
      }
      const v_9390e8 = (await v_cb35cb.json()) as v_2a0baf;
      if (!v_62d405.current) return;
      v_88fed0({ ...v_9390e8 }); 

      v_8c8005({ type: "speech_end", ts: Date.now(), remainingMs: v_9390e8.duration_ms });
    } catch (v_9e86fd) {
      if (v_62d405.current) {
        v_3a7d09(v_9e86fd as Error);
        console.warn("[useVisemeAvatar] speak failed:", v_9e86fd);
      }
    } finally {
      if (v_62d405.current) v_ae4844("listening");
    }
  }, [v_2ca7e0]);

  const v_3e2c87 = v_a1d9db;

  const v_009e58 = v_de06a3(async () => {
    await v_a1d9db("안녕하세요");
  }, [v_a1d9db]);

  const v_811f30 = v_de06a3(() => {

  }, []);

  const v_791152 = v_de06a3(() => {

    return null;
  }, []);

  return {
    state: v_b6e533,
    remoteStream: null, 
    error: v_5e9bfe,
    start: v_965edf,
    stop: v_3e54f8,
    phase: v_ab4803,
    say: v_3e2c87,
    notifySpeechEnd: v_811f30,
    getStatsReport: v_791152,
    greet: v_009e58,
    speak: v_a1d9db,
    lastSignal: v_88c591,
    synthResponse: v_194cc6,
  };
}

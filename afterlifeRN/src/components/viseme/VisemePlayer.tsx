

import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, StyleSheet, Animated, Easing } from "react-native";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

export type Viseme =
  | "REST" | "A" | "E" | "I" | "O" | "U" | "EO" | "EU" | "BILAB" | "DENT";

export interface VisemeEvent {
  v: Viseme;
  dur_ms: number;
}

export interface VisemeSynthResponse {
  audio_wav_b64: string;
  duration_ms: number;
  visemes: VisemeEvent[];
}

interface Props {

  response: VisemeSynthResponse | null;

  visemePrefix: string | null;

  style?: object;

  onComplete?: () => void;
}

const VISEME_ORDER: Viseme[] = [
  "REST", "A", "E", "I", "O", "U", "EO", "EU", "BILAB", "DENT",
];

function visemeImgUrl(prefix: string, v: Viseme): string {

  const base = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return `${base}viseme_${v.toLowerCase()}.png`;
}

export default function VisemePlayer({
  response,
  visemePrefix,
  style,
  onComplete,
}: Props) {
  const [currentViseme, setCurrentViseme] = useState<Viseme>("REST");
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visemeUris = useMemo(() => {
    if (!visemePrefix) return null;
    const urls: Record<Viseme, string> = {} as Record<Viseme, string>;
    for (const v of VISEME_ORDER) {
      urls[v] = visemeImgUrl(visemePrefix, v);
    }
    return urls;
  }, [visemePrefix]);

  const [dataUris, setDataUris] = useState<Record<Viseme, string> | null>(null);
  useEffect(() => {
    if (!visemeUris) { setDataUris(null); return; }
    let cancelled = false;
    (async () => {
      const out: Record<Viseme, string> = {} as Record<Viseme, string>;
      await Promise.all(VISEME_ORDER.map(async (v) => {
        try {
          const res = await fetch(visemeUris[v]);
          const blob = await res.blob();
          const reader = new FileReader();
          const dataUri = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          out[v] = dataUri;
        } catch (e) {
          if (__DEV__) console.warn(`[VisemePlayer] preload ${v} fail:`, e);
          out[v] = visemeUris[v]; 
        }
      }));
      if (!cancelled) {
        if (__DEV__) console.log(`[VisemePlayer] preload done · 10 dataUris ready`);
        setDataUris(out);
      }
    })();
    return () => { cancelled = true; };
  }, [visemeUris]);

  useEffect(() => {
    if (!response) {
      setCurrentViseme("REST");
      return;
    }
    let cancelled = false;
    const cleanup = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      if (playerRef.current) {
        try { playerRef.current.remove(); } catch {  }
        playerRef.current = null;
      }
    };

    try {

      if (__DEV__) console.log(`[VisemePlayer] create · b64_len=${response.audio_wav_b64.length} · dur=${response.duration_ms}ms · visemes=${response.visemes.length}`);
      const player = createAudioPlayer({
        uri: `data:audio/wav;base64,${response.audio_wav_b64}`,
      });
      playerRef.current = player;
      if (__DEV__) console.log(`[VisemePlayer] player created OK`);

      const events = response.visemes;
      let cumulative = 0;
      const startAt = Date.now();

      const step = (idx: number) => {
        if (cancelled) return;
        if (idx >= events.length) {
          setCurrentViseme("REST");
          if (__DEV__) console.log(`[VisemePlayer] STEP end → REST`);
          onComplete?.();
          return;
        }
        const ev = events[idx];
        setCurrentViseme(ev.v);
        if (__DEV__) console.log(`[VisemePlayer] STEP ${idx} → ${ev.v} · dur=${ev.dur_ms}ms`);
        cumulative += ev.dur_ms;
        const target = startAt + cumulative;
        const delay = Math.max(0, target - Date.now());
        timerRef.current = setTimeout(() => step(idx + 1), delay);
      };

      try {
        player.play();
        if (__DEV__) console.log(`[VisemePlayer] player.play() invoked`);
      } catch (playErr) {
        console.warn("[VisemePlayer] player.play() threw:", playErr);
      }
      step(0);
    } catch (e) {
      console.warn("[VisemePlayer] play failed:", e);
      setCurrentViseme("REST");
    }

    return () => { cancelled = true; cleanup(); };
  }, [response, onComplete]);

  return (
    <View style={[styles.container, style]}>
      {dataUris ? (

        <FadeStack dataUris={dataUris} currentViseme={currentViseme} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
    </View>
  );
}

function FadeStack({
  dataUris,
  currentViseme,
}: {
  dataUris: Record<Viseme, string>;
  currentViseme: Viseme;
}) {

  const opsRef = useRef<Record<Viseme, Animated.Value> | null>(null);
  if (!opsRef.current) {
    const map: Record<Viseme, Animated.Value> = {} as Record<Viseme, Animated.Value>;
    for (const v of VISEME_ORDER) map[v] = new Animated.Value(v === "REST" ? 1 : 0);
    opsRef.current = map;
  }
  const ops = opsRef.current;

  useEffect(() => {

    VISEME_ORDER.forEach((v) => {
      Animated.timing(ops[v], {
        toValue: v === currentViseme ? 1 : 0,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
  }, [currentViseme, ops]);

  return (
    <>
      {VISEME_ORDER.map((v) => (
        <Animated.Image
          key={v}
          source={{ uri: dataUris[v] }}
          style={[styles.image, styles.overlayImage, { opacity: ops[v] }]}
          resizeMode="cover"
          fadeDuration={0}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({

  container: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  overlayImage: { position: "absolute", top: 0, left: 0 },
  placeholder: { backgroundColor: "#222" },
});

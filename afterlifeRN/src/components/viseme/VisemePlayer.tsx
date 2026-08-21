

import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
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

  useEffect(() => {
    if (!visemeUris) return;
    Object.values(visemeUris).forEach((u) => {
      Image.prefetch(u).catch(() => {  });
    });
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

      const player = createAudioPlayer({
        uri: `data:audio/wav;base64,${response.audio_wav_b64}`,
      });
      playerRef.current = player;

      const events = response.visemes;
      let cumulative = 0;
      const startAt = Date.now();

      const step = (idx: number) => {
        if (cancelled) return;
        if (idx >= events.length) {
          setCurrentViseme("REST");
          onComplete?.();
          return;
        }
        const ev = events[idx];
        setCurrentViseme(ev.v);
        cumulative += ev.dur_ms;
        const target = startAt + cumulative;
        const delay = Math.max(0, target - Date.now());
        timerRef.current = setTimeout(() => step(idx + 1), delay);
      };

      player.play();
      step(0);
    } catch (e) {
      console.warn("[VisemePlayer] play failed:", e);
      setCurrentViseme("REST");
    }

    return () => { cancelled = true; cleanup(); };
  }, [response, onComplete]);

  const currentUri = visemeUris ? visemeUris[currentViseme] : null;

  return (
    <View style={[styles.container, style]}>
      {currentUri ? (
        <Image
          source={{ uri: currentUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", aspectRatio: 1 },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "#222" },
});

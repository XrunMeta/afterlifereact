

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import VisemePlayer from "../../components/viseme/VisemePlayer";
import { useAuthStore } from "../../stores/authStore";
import { listMyClones, type MyClone } from "../../api/clones";
import { useVisemeAvatar } from "../../realtime/useVisemeAvatar";

const DEFAULT_PREFIX = process.env.EXPO_PUBLIC_VISEME_PREFIX ?? "";

const PRESET_KEYS = ["preset-9519", "preset-9520", "preset-9521", "preset-9522"];

export default function VisemeTestScreen() {
  const [text, setText] = useState("안녕하세요, 오늘 날씨 좋네요");
  const [seKey, setSeKey] = useState<string>(PRESET_KEYS[0]);
  const [prefix, setPrefix] = useState<string>(DEFAULT_PREFIX);

  const [myClones, setMyClones] = useState<MyClone[]>([]);
  const [pickedCloneId, setPickedCloneId] = useState<number | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);

  const avatar = useVisemeAvatar({ cloneId: pickedCloneId ?? 0, accessToken: accessToken ?? "" });

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    listMyClones(accessToken)
      .then((r) => {
        if (cancelled) return;
        const withPrefix = r.items.filter((c) => c.visemePrefix);
        setMyClones(withPrefix);
      })
      .catch((e) => console.warn("[VisemeTest] listMyClones fail:", e));
    return () => { cancelled = true; };
  }, [accessToken]);

  const pickClone = (id: number) => {
    const c = myClones.find((x) => x.id === id);
    if (!c) return;
    setPickedCloneId(id);
    setPrefix(c.visemePrefix ?? "");
  };

  const synth = async () => {
    if (!text.trim()) return;
    if (!accessToken) return;
    await avatar.speakWithOpts(text, { seKey });
  };

  const loading = avatar.phase === "speaking";
  const errorMsg = avatar.error ? String(avatar.error.message ?? avatar.error) : null;
  const meta = useMemo(() => {
    const r = avatar.synthResponse;
    if (!r) return "";
    return `${r.duration_ms}ms · ${r.visemes.length} events · audio ${r.audio_wav_b64.length}b`;
  }, [avatar.synthResponse]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Viseme 파이프라인 테스트 (T-545/T-625)</Text>

      <Text style={styles.label}>text</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        multiline
      />

      <Text style={styles.label}>se_key (프리셋 목소리)</Text>
      <View style={styles.row}>
        {PRESET_KEYS.map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setSeKey(k)}
            style={[styles.presetBtn, seKey === k && styles.presetBtnActive]}
          >
            <Text style={[styles.presetText, seKey === k && styles.presetTextActive]}>
              {k}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        내 페르소나 (viseme_prefix 있는 것만 · admin 에서 E-2 저장 후 표시)
      </Text>
      {myClones.length === 0 ? (
        <Text style={{ color: "#a1a1aa", fontSize: 12 }}>
          없음. 어드민 CloneDetail 에서 '10 viseme 미리 렌더 → R2 저장' 후 여기 나타남.
        </Text>
      ) : (
        <View style={styles.row}>
          {myClones.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => pickClone(c.id)}
              style={[styles.presetBtn, pickedCloneId === c.id && styles.presetBtnActive]}
            >
              <Text style={[styles.presetText, pickedCloneId === c.id && styles.presetTextActive]}>
                {c.name} · #{c.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>viseme_prefix (R2 URL prefix)</Text>
      <TextInput
        style={styles.input}
        value={prefix}
        onChangeText={setPrefix}
        placeholder="https://.../oth-paths/9126/  (empty = placeholder)"
        placeholderTextColor="#999"
        autoCapitalize="none"
      />

      <TouchableOpacity onPress={synth} disabled={loading} style={styles.button}>
        <Text style={styles.buttonText}>{loading ? "생성 중…" : "합성 + 재생"}</Text>
      </TouchableOpacity>

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}

      <View style={styles.playerBox}>
        <VisemePlayer
          response={avatar.synthResponse}
          visemePrefix={prefix || null}
          style={{ width: "100%", height: 300 }}
        />
      </View>

      {avatar.synthResponse && (
        <View style={styles.seqBox}>
          <Text style={styles.seqTitle}>viseme sequence</Text>
          {avatar.synthResponse.visemes.map((ev, i) => (
            <Text key={i} style={styles.seqRow}>
              {i.toString().padStart(2, " ")} {ev.v.padEnd(6, " ")} {ev.dur_ms}ms
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  title: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 16 },
  label: { fontSize: 12, color: "#a1a1aa", marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: "#18181b",
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 6,
    color: "#e5e7eb",
    padding: 10,
    minHeight: 40,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  presetBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  presetText: { color: "#a1a1aa", fontSize: 12 },
  presetTextActive: { color: "#fff" },
  button: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#f87171", marginTop: 12, fontSize: 12 },
  meta: { color: "#a1a1aa", marginTop: 12, fontSize: 12 },
  playerBox: { marginTop: 16, backgroundColor: "#18181b", borderRadius: 8, overflow: "hidden" },
  seqBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#18181b",
    borderRadius: 6,
  },
  seqTitle: { color: "#e5e7eb", fontWeight: "600", marginBottom: 6, fontSize: 12 },
  seqRow: { color: "#a1a1aa", fontFamily: "monospace", fontSize: 11 },
});

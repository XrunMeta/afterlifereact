

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import VisemePlayer, { type VisemeSynthResponse } from "../../components/viseme/VisemePlayer";
import { API_BASE } from "../../config/apiBase";
import { useAuthStore } from "../../stores/authStore";

const DEFAULT_PREFIX = process.env.EXPO_PUBLIC_VISEME_PREFIX ?? "";

const PRESET_KEYS = ["preset-9519", "preset-9520", "preset-9521", "preset-9522"];

export default function VisemeTestScreen() {
  const [text, setText] = useState("안녕하세요, 오늘 날씨 좋네요");
  const [seKey, setSeKey] = useState<string>(PRESET_KEYS[0]);
  const [prefix, setPrefix] = useState<string>(DEFAULT_PREFIX);
  const [response, setResponse] = useState<VisemeSynthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<string>("");

  const accessToken = useAuthStore((s) => s.accessToken);
  const synth = async () => {
    if (!text.trim()) return;
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const url = `${API_BASE}/oth-path`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text, se_key: seKey }),
      });
      if (!r.ok) {
        setError(`HTTP ${r.status}: ${await r.text().catch(() => "")}`);
        return;
      }
      const data = (await r.json()) as VisemeSynthResponse;
      setResponse(data);
      setMeta(`${data.duration_ms}ms · ${data.visemes.length} events · audio ${data.audio_wav_b64.length}b`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Viseme 파이프라인 테스트 (T-545)</Text>

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

      {error && <Text style={styles.error}>{error}</Text>}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}

      <View style={styles.playerBox}>
        <VisemePlayer
          response={response}
          visemePrefix={prefix || null}
          style={{ width: "100%", height: 300 }}
        />
      </View>

      {response && (
        <View style={styles.seqBox}>
          <Text style={styles.seqTitle}>viseme sequence</Text>
          {response.visemes.map((ev, i) => (
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

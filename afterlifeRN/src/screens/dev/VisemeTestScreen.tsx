

import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_79c4f2, v_4623af, v_472849, v_122070 } from "rcmrninabrnb";
import v_d4f200, { type v_2a0baf } from "../../components/viseme/VisemePlayer";
import { v_cc9198 } from "../../config/apiBase";
import { v_1ed7d9 } from "../../stores/authStore";

const v_236191 = process.env.EXPO_PUBLIC_VISEME_PREFIX ?? "";

const v_c08994 = ["preset-9519", "preset-9520", "preset-9521", "preset-9522"];

export default function v_38f630() {
  const [v_9b6134, v_43d2ef] = v_5ab095("안녕하세요, 오늘 날씨 좋네요");
  const [v_2f693a, v_f20c3b] = v_5ab095<string>(v_c08994[0]);
  const [v_cd931c, v_006d3b] = v_5ab095<string>(v_236191);
  const [v_3393e3, v_0f0593] = v_5ab095<v_2a0baf | null>(null);
  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const [v_ab4c96, v_cd0eff] = v_5ab095<string>("");

  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_fd3a92 = async () => {
    if (!v_9b6134.trim()) return;
    if (!v_2ca7e0) {
      v_3a7d09("로그인이 필요합니다.");
      return;
    }
    v_34a50a(true);
    v_3a7d09(null);
    v_0f0593(null);
    try {
      const v_f71b56 = `${v_cc9198}/oth-path`;
      const v_cb35cb = await fetch(v_f71b56, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${v_2ca7e0}`,
        },
        body: JSON.stringify({ text: v_9b6134, se_key: v_2f693a }),
      });
      if (!v_cb35cb.ok) {
        v_3a7d09(`HTTP ${v_cb35cb.status}: ${await v_cb35cb.text().catch(() => "")}`);
        return;
      }
      const v_9390e8 = (await v_cb35cb.json()) as v_2a0baf;
      v_0f0593(v_9390e8);
      v_cd0eff(`${v_9390e8.duration_ms}ms · ${v_9390e8.visemes.length} events · audio ${v_9390e8.audio_wav_b64.length}b`);
    } catch (v_9e86fd) {
      v_3a7d09(String(v_9e86fd));
    } finally {
      v_34a50a(false);
    }
  };

  return (
    <ScrollView style={v_d81136.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={v_d81136.title}>Viseme 파이프라인 테스트 (T-545)</Text>

      <Text style={v_d81136.label}>text</Text>
      <TextInput
        style={v_d81136.input}
        value={v_9b6134}
        onChangeText={v_43d2ef}
        multiline
      />

      <Text style={v_d81136.label}>se_key (프리셋 목소리)</Text>
      <View style={v_d81136.row}>
        {v_c08994.map((v_0eb677) => (
          <TouchableOpacity
            key={v_0eb677}
            onPress={() => v_f20c3b(v_0eb677)}
            style={[v_d81136.presetBtn, v_2f693a === v_0eb677 && v_d81136.presetBtnActive]}
          >
            <Text style={[v_d81136.presetText, v_2f693a === v_0eb677 && v_d81136.presetTextActive]}>
              {v_0eb677}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={v_d81136.label}>viseme_prefix (R2 URL prefix)</Text>
      <TextInput
        style={v_d81136.input}
        value={v_cd931c}
        onChangeText={v_006d3b}
        placeholder="https://.../oth-paths/9126/  (empty = placeholder)"
        placeholderTextColor="#999"
        autoCapitalize="none"
      />

      <TouchableOpacity onPress={v_fd3a92} disabled={v_683210} style={v_d81136.button}>
        <Text style={v_d81136.buttonText}>{v_683210 ? "생성 중…" : "합성 + 재생"}</Text>
      </TouchableOpacity>

      {v_5e9bfe && <Text style={v_d81136.error}>{v_5e9bfe}</Text>}
      {v_ab4c96 ? <Text style={v_d81136.meta}>{v_ab4c96}</Text> : null}

      <View style={v_d81136.playerBox}>
        <VisemePlayer
          response={v_3393e3}
          visemePrefix={v_cd931c || null}
          style={{ width: "100%", height: 300 }}
        />
      </View>

      {v_3393e3 && (
        <View style={v_d81136.seqBox}>
          <Text style={v_d81136.seqTitle}>viseme sequence</Text>
          {v_3393e3.visemes.map((v_1d299c, v_ebec57) => (
            <Text key={v_ebec57} style={v_d81136.seqRow}>
              {v_ebec57.toString().padStart(2, " ")} {v_1d299c.v.padEnd(6, " ")} {v_1d299c.dur_ms}ms
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const v_d81136 = v_472849.create({
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



import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_4623af, v_122070, v_39a996, v_cf9c33 } from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";
import * as v_3c288d from "bxoplsnixpmvnirxbbkstg";
import { v_b24f74 } from "hpkstesipoootxeqkajlxyxt";
import * as v_4decc2 from "pubobne";
import { v_c8d567 } from "gbpmiu";
import { v_a64bce } from "../../face/l2normalize";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_865d38, v_afc2e6 } from "../../api/persons";
import { v_889fad } from "../../stores/dialogStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import v_258c1c from "../../components/common/PageHeader";

interface Person {
  id: number;
  cloneId: number | null;
  displayName: string | null;
}
interface Match { personId: number; displayName: string | null; score: number }
interface Result { matches: Match[]; matchThreshold: number; autoEnrollThreshold: number }

const v_13450a = 112;

export default function v_30f4d7() {
  const v_3c9f12 = v_ada615();
  const v_033e14 = v_e0068c();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);

  const v_2ce97f = v_b24f74(require("../../../assets/models/w600k_mbf.tflite"));
  const v_768389 = v_2ce97f.state === "loaded" ? v_2ce97f.model : null;

  const [v_74f4a3, v_54e4fb] = v_5ab095<string | null>(null);
  const [v_fded81, v_1b22c3] = v_5ab095<Person[]>([]);
  const [v_75d7fc, v_13fb8b] = v_5ab095<number | null>(null);
  const [v_3f8465, v_b4f1d2] = v_5ab095(false);
  const [v_43c42e, v_47323f] = v_5ab095<Result | null>(null);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    void (async () => {
      if (!v_2ca7e0) return;
      try {
        const v_cb35cb = await v_865d38(v_2ca7e0);
        v_1b22c3(
          v_cb35cb.items.map((v_e2a85c) => ({
            id: v_e2a85c.id,
            cloneId: v_e2a85c.cloneId ?? null,
            displayName: v_e2a85c.displayName ?? null,
          })),
        );
      } catch (v_9e86fd) {
        console.warn("[FaceTest] listPersons 실패:", v_9e86fd);
      }
    })();
  }, [v_2ca7e0]);

  const v_2e22e6 = v_de06a3(async () => {
    v_8a5996(null);
    v_47323f(null);
    const v_d60769 = await v_d05ab5.requestMediaLibraryPermissionsAsync();
    if (!v_d60769.granted) {
      v_889fad("권한 필요", "갤러리 접근 권한을 허용해 주세요.");
      return;
    }
    const v_cb35cb = await v_d05ab5.launchImageLibraryAsync({ mediaTypes: v_d05ab5.MediaTypeOptions.Images, quality: 1 });
    if (v_cb35cb.canceled || v_cb35cb.assets.length === 0) return;
    v_54e4fb(v_cb35cb.assets[0].uri);
  }, []);

  const v_62a304 = v_df9f57(() => v_fded81.find((v_e2a85c) => v_e2a85c.id === v_75d7fc) ?? null, [v_fded81, v_75d7fc]);

  const v_5a7c0f = v_de06a3(async () => {
    if (!v_74f4a3) { v_8a5996("이미지를 먼저 선택해 주세요."); return; }
    if (!v_62a304 || v_62a304.cloneId == null) { v_8a5996("person 을 선택해 주세요."); return; }
    if (!v_768389) { v_8a5996("모델 로딩 중입니다."); return; }
    if (!v_2ca7e0 || !v_b113dd) { v_8a5996("로그인 정보가 없어요."); return; }
    v_b4f1d2(true); v_8a5996(null); v_47323f(null);
    try {

      const v_e873c0 = await v_3c288d.manipulateAsync(
        v_74f4a3,
        [{ resize: { width: v_13450a, height: v_13450a } }],
        { compress: 1, format: v_3c288d.SaveFormat.JPEG, base64: true },
      );
      if (!v_e873c0.base64) throw new Error("이미지 인코딩 실패");

      const v_e183ca = v_c8d567.from(v_e873c0.base64, "base64");
      const v_4adf64 = v_4decc2.decode(v_e183ca, { useTArray: true });

      const v_5b886e = new Float32Array(v_13450a * v_13450a * 3);
      for (let v_ebec57 = 0, v_b75e36 = 0; v_ebec57 < v_4adf64.data.length; v_ebec57 += 4, v_b75e36 += 3) {
        v_5b886e[v_b75e36] = (v_4adf64.data[v_ebec57] / 255) * 2 - 1;
        v_5b886e[v_b75e36 + 1] = (v_4adf64.data[v_ebec57 + 1] / 255) * 2 - 1;
        v_5b886e[v_b75e36 + 2] = (v_4adf64.data[v_ebec57 + 2] / 255) * 2 - 1;
      }

      const v_8d4337 = v_768389.runSync([v_5b886e])[0] as Float32Array;

      const v_75195c = v_a64bce(v_8d4337);

      const v_cb35cb = await v_afc2e6(v_2ca7e0, Array.from(v_75195c), v_62a304.cloneId);
      v_47323f({
        matches: v_cb35cb.matches,
        matchThreshold: v_cb35cb.threshold,
        autoEnrollThreshold: 0.75, 
      });
    } catch (v_9e86fd) {
      v_8a5996((v_9e86fd as Error).message);
    } finally {
      v_b4f1d2(false);
    }
  }, [v_74f4a3, v_62a304, v_768389, v_2ca7e0, v_b113dd]);

  const v_5e5963 = (v_740dd8, v_3b6e81, v_cf62e1) => {
    if (v_740dd8 >= v_cf62e1) return { bg: "#0f3d1f", tag: "#22c55e", label: `enroll+match (${v_cf62e1.toFixed(2)}↑)` };
    if (v_740dd8 >= v_3b6e81) return { bg: "#3d3410", tag: "#eab308", label: `match only (${v_3b6e81.toFixed(2)}~${v_cf62e1.toFixed(2)})` };
    return { bg: "#3d0f0f", tag: "#ef4444", label: `unknown (<${v_3b6e81.toFixed(2)})` };
  };

  return (
    <View style={[v_fd5f43.container, { paddingBottom: v_033e14.bottom }]}>
      <PageHeader showBackButton onBackPress={() => v_3c9f12.goBack()} transparent />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={v_fd5f43.title}>얼굴 임계값 테스트 (dev)</Text>
        <Text style={v_fd5f43.desc}>
          갤러리 이미지 → 앱과 동일 tflite 로 512-D 임베딩 → 서버 매칭. 얼굴 정면이 화면 대부분을 차지하는 사진 사용 권장 (얼굴 검출 X).
        </Text>

        {v_2ce97f.state === "loading" && (
          <View style={v_fd5f43.loading}><ActivityIndicator color={v_1bfbd0.white} /><Text style={v_fd5f43.loadingText}>모델 로딩 중...</Text></View>
        )}
        {v_2ce97f.state === "error" && (
          <Text style={v_fd5f43.err}>모델 로드 실패: {String(v_2ce97f.error)}</Text>
        )}

        <TouchableOpacity onPress={v_2e22e6} style={v_fd5f43.pickBtn}>
          <Text style={v_fd5f43.pickBtnText}>{v_74f4a3 ? "이미지 다시 선택" : "이미지 선택"}</Text>
        </TouchableOpacity>
        {v_74f4a3 && <Image source={{ uri: v_74f4a3 }} style={v_fd5f43.preview} resizeMode="cover" />}

        <Text style={v_fd5f43.label}>Person 선택</Text>
        {v_fded81.length === 0 ? (
          <Text style={v_fd5f43.desc}>등록된 person 없음</Text>
        ) : (
          v_fded81.filter((v_e2a85c) => v_e2a85c.cloneId != null).map((v_e2a85c) => {
            const v_f8b770 = v_e2a85c.id === v_75d7fc;
            return (
              <TouchableOpacity
                key={v_e2a85c.id}
                onPress={() => v_13fb8b(v_e2a85c.id)}
                style={[v_fd5f43.personItem, v_f8b770 && v_fd5f43.personItemActive]}
              >
                <Text style={[v_fd5f43.personText, v_f8b770 && v_fd5f43.personTextActive]}>
                  [{v_e2a85c.id}] {v_e2a85c.displayName ?? "(이름없음)"} · clone {v_e2a85c.cloneId}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          onPress={v_5a7c0f}
          disabled={v_3f8465 || !v_74f4a3 || !v_75d7fc || !v_768389}
          style={[v_fd5f43.calcBtn, (v_3f8465 || !v_74f4a3 || !v_75d7fc || !v_768389) && v_fd5f43.calcBtnDisabled]}
        >
          {v_3f8465 ? <ActivityIndicator color={v_1bfbd0.zinc900} /> : <Text style={v_fd5f43.calcBtnText}>임계값 계산</Text>}
        </TouchableOpacity>

        {v_49263d && <Text style={v_fd5f43.err}>{v_49263d}</Text>}

        {v_43c42e && (
          <View style={v_fd5f43.resultCard}>
            <Text style={v_fd5f43.resultTitle}>매칭 결과 (top {v_43c42e.matches.length})</Text>
            {v_43c42e.matches.length === 0 ? (
              <Text style={v_fd5f43.desc}>매칭된 person 없음</Text>
            ) : v_43c42e.matches.map((v_35f85c) => {
              const v_3f4e2e = v_5e5963(v_35f85c.score, v_43c42e.matchThreshold, v_43c42e.autoEnrollThreshold);
              return (
                <View key={v_35f85c.personId} style={[v_fd5f43.matchRow, { backgroundColor: v_3f4e2e.bg }]}>
                  <Text style={v_fd5f43.matchScore}>{v_35f85c.score.toFixed(3)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.matchName}>{v_35f85c.displayName ?? "(이름없음)"}</Text>
                    <Text style={v_fd5f43.matchMeta}>personId {v_35f85c.personId}</Text>
                  </View>
                  <View style={[v_fd5f43.chip, { backgroundColor: v_3f4e2e.tag }]}>
                    <Text style={v_fd5f43.chipText}>{v_3f4e2e.label}</Text>
                  </View>
                </View>
              );
            })}
            <Text style={v_fd5f43.thresholdInfo}>
              match {v_43c42e.matchThreshold} (서버) · enroll {v_43c42e.autoEnrollThreshold} (앱 auto-enroll)
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  container: { flex: 1, backgroundColor: v_1bfbd0.zinc950 },
  title: { color: v_1bfbd0.white, fontSize: 20, fontWeight: "700", marginBottom: 6 },
  desc: { color: v_1bfbd0.zinc400, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  loading: { flexDirection: "row", gap: 8, padding: 12, alignItems: "center" },
  loadingText: { color: v_1bfbd0.zinc300, fontSize: 13 },
  pickBtn: { backgroundColor: v_1bfbd0.zinc800, padding: 14, borderRadius: v_8b0c90.md, alignItems: "center", marginTop: 8 },
  pickBtnText: { color: v_1bfbd0.white, fontSize: 14, fontWeight: "600" },
  preview: { width: 200, height: 200, borderRadius: v_8b0c90.md, marginTop: 12, alignSelf: "center", backgroundColor: v_1bfbd0.zinc900 },
  label: { color: v_1bfbd0.zinc300, fontSize: 13, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  personItem: { padding: 12, borderRadius: v_8b0c90.sm, backgroundColor: v_1bfbd0.zinc900, marginBottom: 6, borderWidth: 1, borderColor: v_1bfbd0.zinc800 },
  personItemActive: { borderColor: v_1bfbd0.white, backgroundColor: v_1bfbd0.zinc800 },
  personText: { color: v_1bfbd0.zinc300, fontSize: 13 },
  personTextActive: { color: v_1bfbd0.white, fontWeight: "600" },
  calcBtn: { backgroundColor: v_1bfbd0.white, padding: 14, borderRadius: v_8b0c90.full, alignItems: "center", marginTop: 20 },
  calcBtnDisabled: { opacity: 0.4 },
  calcBtnText: { color: v_1bfbd0.zinc900, fontSize: 16, fontWeight: "700" },
  err: { color: "#f87171", fontSize: 13, marginTop: 12 },
  resultCard: { marginTop: 20, padding: 12, backgroundColor: v_1bfbd0.zinc900, borderRadius: v_8b0c90.md },
  resultTitle: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "700", marginBottom: 10 },
  matchRow: { flexDirection: "row", gap: 10, padding: 10, borderRadius: v_8b0c90.sm, marginBottom: 6, alignItems: "center" },
  matchScore: { color: v_1bfbd0.white, fontSize: 20, fontWeight: "700", minWidth: 70, fontVariant: ["tabular-nums"] },
  matchName: { color: v_1bfbd0.white, fontSize: 14, fontWeight: "600" },
  matchMeta: { color: v_1bfbd0.zinc400, fontSize: 11 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  chipText: { color: v_1bfbd0.white, fontSize: 10, fontWeight: "700" },
  thresholdInfo: { color: v_1bfbd0.zinc400, fontSize: 11, marginTop: 8, textAlign: "center" },
});

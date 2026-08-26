

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_4623af, v_122070, v_39a996, v_326be8 } from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import {
  v_862296 as v_628d75,
  v_db5a6b,
  v_b08ef3,
} from "mkqptszwrsxiemcjrtdlshyxlm";
import { v_ac8611 } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";
import { v_b24f74 } from "hpkstesipoootxeqkajlxyxt";
import { v_cb507d } from "hbzwhsuegbhzscystubugxnkiwe";
import { v_d73d29, v_fc0657 } from "fkysyevuehkssftyrtweoolhfw";
import { v_a64bce } from "../../face/l2normalize";
import { v_e74bab } from "../../face/largestFace";
import { v_a40fe8 } from "../../face/frameTimestamp";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_865d38, v_afc2e6 } from "../../api/persons";
import { v_889fad } from "../../stores/dialogStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import v_258c1c from "../../components/common/PageHeader";

interface Person {
  id: number;
  cloneId: number | null;
  displayName: string | null;
  faceCount: number;
  isSelf: boolean;
}
interface LastMatch {
  personId: number | null;
  displayName: string | null;
  score: number;
  threshold: number;
  ts: number;
}

const v_f72c06 = 0.75;
const v_10f62f = {
  performanceMode: "fast",
  landmarkMode: "none",
  contourMode: "none",
  classificationMode: "none",
  minFaceSize: 0.2,
} as const;
const v_d00c3a = 0.15;
const v_12b149 = 800; 

export default function v_30f4d7() {
  const v_3c9f12 = v_ada615();
  const v_033e14 = v_e0068c();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_44c2eb = v_326be8.OS === "android";

  const v_ac8c13 = v_db5a6b("front");
  const { detectFaces: v_de4d76 } = v_ac8611(v_10f62f);
  const { resize: v_2e11e8 } = v_cb507d();
  const v_2ce97f = v_b24f74(require("../../../assets/models/w600k_mbf.tflite"));
  const v_768389 = v_2ce97f.state === "loaded" ? v_2ce97f.model : null;

  const [v_f9f059, v_7c7b9c] = v_5ab095<boolean | null>(null);
  const [v_fded81, v_1b22c3] = v_5ab095<Person[]>([]);
  const [v_75d7fc, v_13fb8b] = v_5ab095<number | null>(null);
  const [v_ea9258, v_564db8] = v_5ab095(false);
  const [v_d99c5b, v_3f164d] = v_5ab095<LastMatch | null>(null);
  const [v_9d245d, v_a84001] = v_5ab095<{ score: number; ts: number }[]>([]);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);
  const [v_7c2f5d, v_1a225e] = v_5ab095(false);

  const v_5111a7 = v_fc0657(0);
  const v_c4f4ec = v_e662ae(false);

  const v_4711a9 = v_e662ae<string | null>(null);
  const v_c8bd5d = v_e662ae<Person | null>(null);
  const v_075217 = v_e662ae<typeof v_b113dd>(null);
  v_c4deb2(() => { v_4711a9.current = v_2ca7e0; }, [v_2ca7e0]);
  v_c4deb2(() => { v_075217.current = v_b113dd; }, [v_b113dd]);

  v_c4deb2(() => {
    void (async () => {
      const v_d308b5 = await v_628d75.requestCameraPermission();
      v_7c7b9c(v_d308b5 === "granted");
    })();
  }, []);

  v_c4deb2(() => {
    void (async () => {
      if (!v_2ca7e0) return;
      try {
        const v_cb35cb = await v_865d38(v_2ca7e0);
        const v_4622b9 = v_cb35cb.items
          .map((v_e2a85c) => ({
            id: v_e2a85c.id,
            cloneId: v_e2a85c.cloneId ?? null,
            displayName: v_e2a85c.displayName ?? null,
            faceCount: v_e2a85c.faceCount ?? 0,
            isSelf: v_e2a85c.isSelf ?? false,
          }))
          .filter((v_e2a85c) => v_e2a85c.cloneId != null);
        v_1b22c3(v_4622b9);
        if (v_4622b9.length > 0 && v_75d7fc == null) v_13fb8b(v_4622b9[0].id);
      } catch (v_9e86fd) {
        console.warn("[FaceTest] listPersons 실패:", v_9e86fd);
      }
    })();
  }, [v_2ca7e0, v_75d7fc]);

  const v_62a304 = v_df9f57(
    () => v_fded81.find((v_e2a85c) => v_e2a85c.id === v_75d7fc) ?? null,
    [v_fded81, v_75d7fc],
  );
  v_c4deb2(() => { v_c8bd5d.current = v_62a304; }, [v_62a304]);

  const v_998534 = v_df9f57(
    () =>
      v_d73d29.createRunOnJS((v_46ff7a, v_6a05dc) => {
        v_1a225e(v_6a05dc);
        if (!v_6a05dc) return;
        const v_21cc31 = v_4711a9.current;
        const v_625c74 = v_075217.current;
        const v_306a28 = v_c8bd5d.current;
        if (!v_21cc31 || !v_625c74 || !v_306a28 || v_306a28.cloneId == null) return;
        if (v_c4f4ec.current) return;
        v_c4f4ec.current = true;
        const v_825625 = v_a64bce(Float32Array.from(v_46ff7a));
        (async () => {
          try {
            const v_cb35cb = await v_afc2e6(v_21cc31, v_825625, v_306a28.cloneId!);
            const v_643757 = v_cb35cb.best;
            const v_3a5fef = Date.now();
            const v_fd5f43 = v_643757?.score ?? (v_cb35cb.matches[0]?.score ?? 0);
            v_3f164d({
              personId: v_643757?.personId ?? null,
              displayName: v_643757?.displayName ?? null,
              score: v_fd5f43,
              threshold: v_cb35cb.threshold,
              ts: v_3a5fef,
            });
            v_a84001((v_ba2215) => [...v_ba2215, { score: v_fd5f43, ts: v_3a5fef }].slice(-30));
          } catch (v_9e86fd) {
            console.warn("[FaceTest] matchFace 실패:", v_9e86fd);
          } finally {
            v_c4f4ec.current = false;
          }
        })();
      }),
    [],
  );

  const v_a61ebf = v_b08ef3(
    (v_143cb5) => {
      "worklet";
      if (!v_768389) return;
      const v_67e77e = v_a40fe8(v_143cb5.timestamp, v_44c2eb);
      if (v_67e77e - v_5111a7.value < v_12b149) return;
      const v_a51d09 = v_de4d76(v_143cb5);
      const v_127e92 = v_e74bab(v_a51d09);
      if (v_127e92 == null) {
        v_998534([], false);
        return;
      }
      v_5111a7.value = v_67e77e;

      const v_6ea96a = v_127e92.bounds.x;
      const v_0c42b9 = v_127e92.bounds.y;
      const v_705ad0 = v_127e92.bounds.width;
      const v_4b4cf5 = v_127e92.bounds.height;
      const v_458f45 = v_705ad0 * v_d00c3a;
      const v_8fc8f0 = v_4b4cf5 * v_d00c3a;
      const v_2d3c27 = v_2e11e8(v_143cb5, {
        crop: {
          x: Math.max(0, v_6ea96a - v_458f45),
          y: Math.max(0, v_0c42b9 - v_8fc8f0),
          width: v_705ad0 + v_458f45 * 2,
          height: v_4b4cf5 + v_8fc8f0 * 2,
        },
        scale: { width: 112, height: 112 },
        pixelFormat: "rgb",
        dataType: "float32",
      });
      const v_75195c = new Float32Array(v_2d3c27.length);
      for (let v_ebec57 = 0; v_ebec57 < v_2d3c27.length; v_ebec57++) v_75195c[v_ebec57] = v_2d3c27[v_ebec57] * 2 - 1;
      const v_8d4337 = v_768389.runSync([v_75195c])[0] as Float32Array;
      v_998534(Array.from(v_8d4337), true);
    },
    [v_de4d76, v_768389, v_2e11e8, v_5111a7, v_44c2eb, v_998534],
  );

  const v_5e5963 = (v_740dd8, v_3b6e81, v_cf62e1) => {
    if (v_740dd8 >= v_cf62e1) return { bg: "#0f3d1f", tag: "#22c55e", label: `enroll ≥${v_cf62e1.toFixed(2)}` };
    if (v_740dd8 >= v_3b6e81) return { bg: "#3d3410", tag: "#eab308", label: `match ≥${v_3b6e81.toFixed(2)}` };
    return { bg: "#3d0f0f", tag: "#ef4444", label: `unknown <${v_3b6e81.toFixed(2)}` };
  };

  if (v_f9f059 === false) {
    return (
      <View style={[v_fd5f43.container, { paddingBottom: v_033e14.bottom }]}>
        <PageHeader showBackButton onBackPress={() => v_3c9f12.goBack()} transparent />
        <View style={v_fd5f43.centerBlock}>
          <Text style={v_fd5f43.err}>카메라 권한이 없어요.</Text>
          <TouchableOpacity onPress={() => v_889fad("권한", "설정에서 카메라 권한을 허용해 주세요.")}>
            <Text style={v_fd5f43.linkText}>권한 요청 안내</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const v_3018ef = v_d99c5b?.threshold ?? 0.55;

  return (
    <View style={[v_fd5f43.container, { paddingBottom: v_033e14.bottom }]}>
      <PageHeader showBackButton onBackPress={() => v_3c9f12.goBack()} transparent />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={v_fd5f43.title}>얼굴 임계값 테스트 (라이브)</Text>
        <Text style={v_fd5f43.desc}>
          카메라 프리뷰 + 실 통화와 동일 pipeline (frameProcessor + libyuv resize + tflite).
          실시간 매칭 score 는 통화 중 값과 정확히 같음.
        </Text>

        {}
        <View style={v_fd5f43.thresholdBanner}>
          <Text style={v_fd5f43.thresholdBannerTitle}>현재 임계값</Text>
          <View style={v_fd5f43.thresholdRow}>
            <View style={[v_fd5f43.thChip, { backgroundColor: "#eab308" }]}>
              <Text style={v_fd5f43.thChipLabel}>match</Text>
              <Text style={v_fd5f43.thChipVal}>≥ {v_3018ef.toFixed(2)}</Text>
            </View>
            <Text style={v_fd5f43.thExplain}>서버 · 통화 매칭 게이트</Text>
          </View>
          <View style={v_fd5f43.thresholdRow}>
            <View style={[v_fd5f43.thChip, { backgroundColor: "#22c55e" }]}>
              <Text style={v_fd5f43.thChipLabel}>enroll</Text>
              <Text style={v_fd5f43.thChipVal}>≥ {v_f72c06.toFixed(2)}</Text>
            </View>
            <Text style={v_fd5f43.thExplain}>앱 · auto-enroll 학습 게이트</Text>
          </View>
        </View>

        {v_2ce97f.state === "loading" && (
          <View style={v_fd5f43.loading}>
            <ActivityIndicator color={v_1bfbd0.white} />
            <Text style={v_fd5f43.loadingText}>모델 로딩 중...</Text>
          </View>
        )}
        {v_2ce97f.state === "error" && (
          <Text style={v_fd5f43.err}>모델 로드 실패: {String(v_2ce97f.error)}</Text>
        )}

        {}
        <View style={v_fd5f43.cameraBox}>
          {v_ac8c13 && v_f9f059 && v_768389 ? (
            <VisionCamera
              style={v_472849.absoluteFill}
              device={v_ac8c13}
              isActive={v_ea9258}
              frameProcessor={v_ea9258 ? v_a61ebf : undefined}
              pixelFormat="yuv"
            />
          ) : (
            <View style={[v_472849.absoluteFill, v_fd5f43.cameraPlaceholder]}>
              <Text style={v_fd5f43.desc}>{!v_ac8c13 ? "카메라 없음" : !v_768389 ? "모델 로딩 중" : "권한 확인 중"}</Text>
            </View>
          )}
          {v_ea9258 && !v_7c2f5d && (
            <View style={v_fd5f43.overlay}>
              <Text style={v_fd5f43.overlayText}>얼굴을 프레임에 맞춰주세요</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            v_564db8((v_81e2ef) => !v_81e2ef);
            v_3f164d(null);
            v_a84001([]);
          }}
          disabled={!v_768389 || !v_75d7fc}
          style={[v_fd5f43.calcBtn, (!v_768389 || !v_75d7fc) && v_fd5f43.calcBtnDisabled]}
        >
          <Text style={v_fd5f43.calcBtnText}>{v_ea9258 ? "중지" : "라이브 매칭 시작"}</Text>
        </TouchableOpacity>

        <Text style={v_fd5f43.label}>저장된 person ({v_fded81.length})</Text>
        {v_fded81.length === 0 ? (
          <Text style={v_fd5f43.err}>등록된 person 이 없어요. MyScreen 얼굴 5각도 등록 먼저 진행하세요.</Text>
        ) : (
          v_fded81.map((v_e2a85c) => {
            const v_f8b770 = v_e2a85c.id === v_75d7fc;
            return (
              <TouchableOpacity
                key={v_e2a85c.id}
                onPress={() => v_13fb8b(v_e2a85c.id)}
                activeOpacity={0.7}
                style={[v_fd5f43.personItem, v_f8b770 && v_fd5f43.personItemActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[v_fd5f43.personText, v_f8b770 && v_fd5f43.personTextActive]}>
                    {v_e2a85c.displayName ?? "(이름없음)"} {v_e2a85c.isSelf ? "★self" : ""}
                  </Text>
                  <Text style={v_fd5f43.personMeta}>personId {v_e2a85c.id} · cloneId {v_e2a85c.cloneId}</Text>
                </View>
                <View style={v_fd5f43.faceCountBadge}>
                  <Text style={v_fd5f43.faceCountNum}>{v_e2a85c.faceCount}</Text>
                  <Text style={v_fd5f43.faceCountLbl}>faces</Text>
                </View>
                {v_f8b770 && <View style={v_fd5f43.selectMark}><Text style={v_fd5f43.selectMarkText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })
        )}

        {v_49263d && <Text style={v_fd5f43.err}>{v_49263d}</Text>}

        {v_d99c5b && (
          <View style={v_fd5f43.resultCard}>
            <Text style={v_fd5f43.resultTitle}>실시간 매칭</Text>
            {(() => {
              const v_3f4e2e = v_5e5963(v_d99c5b.score, v_d99c5b.threshold, v_f72c06);
              const v_24d678 = v_d99c5b.score >= v_d99c5b.threshold;
              const v_9c3b6a = v_d99c5b.score >= v_f72c06;
              return (
                <View style={[v_fd5f43.matchRow, { backgroundColor: v_3f4e2e.bg }]}>
                  <Text style={v_fd5f43.matchScore}>{v_d99c5b.score.toFixed(3)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.matchName}>{v_d99c5b.displayName ?? "(unknown)"}</Text>
                    <Text style={v_fd5f43.matchMeta}>
                      personId {v_d99c5b.personId ?? "—"} · match {v_24d678 ? "✓" : "✗"} / enroll {v_9c3b6a ? "✓" : "✗"}
                    </Text>
                  </View>
                  <View style={[v_fd5f43.chip, { backgroundColor: v_3f4e2e.tag }]}>
                    <Text style={v_fd5f43.chipText}>{v_3f4e2e.label}</Text>
                  </View>
                </View>
              );
            })()}
            <View style={v_fd5f43.divider} />
            <Text style={v_fd5f43.sectionSub}>최근 {v_9d245d.length} 회 score</Text>
            <View style={v_fd5f43.historyRow}>
              {v_9d245d.map((v_65a2cd, v_ebec57) => {
                const v_3f4e2e = v_5e5963(v_65a2cd.score, v_3018ef, v_f72c06);
                return (
                  <View key={v_ebec57} style={[v_fd5f43.historyDot, { backgroundColor: v_3f4e2e.tag }]}>
                    <Text style={v_fd5f43.historyDotText}>{v_65a2cd.score.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={v_fd5f43.thresholdInfo}>
              match ≥{v_d99c5b.threshold.toFixed(2)} (서버) · enroll ≥{v_f72c06.toFixed(2)} (앱)
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
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  linkText: { color: "#60a5fa", fontSize: 13, marginTop: 12 },
  loading: { flexDirection: "row", gap: 8, padding: 12, alignItems: "center" },
  loadingText: { color: v_1bfbd0.zinc300, fontSize: 13 },
  thresholdBanner: {
    marginTop: 8, marginBottom: 8, padding: 12, borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900, borderWidth: 1, borderColor: v_1bfbd0.zinc800,
  },
  thresholdBannerTitle: { color: v_1bfbd0.white, fontSize: 12, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 },
  thresholdRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  thChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 90, alignItems: "center" },
  thChipLabel: { color: v_1bfbd0.white, fontSize: 10, fontWeight: "700", opacity: 0.85 },
  thChipVal: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
  thExplain: { color: v_1bfbd0.zinc400, fontSize: 11, flex: 1 },
  cameraBox: {
    marginTop: 12, aspectRatio: 3 / 4, borderRadius: v_8b0c90.md, overflow: "hidden",
    backgroundColor: v_1bfbd0.zinc900, position: "relative",
  },
  cameraPlaceholder: { alignItems: "center", justifyContent: "center" },
  overlay: {
    position: "absolute", left: 0, right: 0, bottom: 12, alignItems: "center",
  },
  overlayText: {
    color: v_1bfbd0.white, fontSize: 12, backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  label: { color: v_1bfbd0.zinc300, fontSize: 13, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  personItem: {
    padding: 12, borderRadius: v_8b0c90.sm, backgroundColor: v_1bfbd0.zinc900,
    marginBottom: 6, borderWidth: 1, borderColor: v_1bfbd0.zinc800,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  personItemActive: { borderColor: "#60a5fa", borderWidth: 2, backgroundColor: "#1e293b" },
  personText: { color: v_1bfbd0.zinc300, fontSize: 14 },
  personTextActive: { color: v_1bfbd0.white, fontWeight: "700" },
  personMeta: { color: v_1bfbd0.zinc500, fontSize: 10, marginTop: 2 },
  faceCountBadge: { backgroundColor: v_1bfbd0.zinc800, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: "center", minWidth: 48 },
  faceCountNum: { color: v_1bfbd0.white, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
  faceCountLbl: { color: v_1bfbd0.zinc400, fontSize: 9 },
  selectMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#60a5fa", alignItems: "center", justifyContent: "center" },
  selectMarkText: { color: v_1bfbd0.zinc900, fontSize: 14, fontWeight: "800" },
  calcBtn: { backgroundColor: v_1bfbd0.white, padding: 14, borderRadius: v_8b0c90.full, alignItems: "center", marginTop: 12 },
  calcBtnDisabled: { opacity: 0.4 },
  calcBtnText: { color: v_1bfbd0.zinc900, fontSize: 16, fontWeight: "700" },
  err: { color: "#f87171", fontSize: 13, marginTop: 12, lineHeight: 18 },
  resultCard: { marginTop: 20, padding: 12, backgroundColor: v_1bfbd0.zinc900, borderRadius: v_8b0c90.md },
  resultTitle: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "700", marginBottom: 10 },
  matchRow: { flexDirection: "row", gap: 10, padding: 10, borderRadius: v_8b0c90.sm, marginBottom: 6, alignItems: "center" },
  matchScore: { color: v_1bfbd0.white, fontSize: 20, fontWeight: "700", minWidth: 70, fontVariant: ["tabular-nums"] },
  matchName: { color: v_1bfbd0.white, fontSize: 14, fontWeight: "600" },
  matchMeta: { color: v_1bfbd0.zinc400, fontSize: 11, marginTop: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  chipText: { color: v_1bfbd0.white, fontSize: 10, fontWeight: "700" },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc800, marginTop: 10, marginBottom: 10 },
  sectionSub: { color: v_1bfbd0.zinc400, fontSize: 11, fontWeight: "600", marginBottom: 6 },
  historyRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  historyDot: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4, minWidth: 32, alignItems: "center" },
  historyDotText: { color: "#000", fontSize: 9, fontWeight: "700", fontVariant: ["tabular-nums"] },
  thresholdInfo: { color: v_1bfbd0.zinc400, fontSize: 11, marginTop: 8, textAlign: "center" },
});

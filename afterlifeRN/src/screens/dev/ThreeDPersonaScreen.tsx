

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_39a996,
  v_acfdec,
  v_122070,
  v_472849,
  v_19b633,
  v_4623af,
  v_3094a2,
} from "rcmrninabrnb";
import { v_2f0d58 } from "wubwojvppqigopdenymkn";
import { v_fc0657 } from "fkysyevuehkssftyrtweoolhfw";
import { v_1bfbd0 } from "../../components/constants";
import { v_842502, v_45df48 } from "./threedPersona/Head";
import { v_ceeae8, v_c4faef } from "./threedPersona/config";

const v_7f7fe8 = (() => {
  const v_f791ed = 180;
  const v_8d4337 = new Array(v_f791ed).fill(0);
  for (let v_ebec57 = 0; v_ebec57 < v_f791ed; v_ebec57++) {
    const v_8d41d7 = v_ebec57 / 60;

    const v_729db2 = 0.35 + 0.35 * Math.sin(v_8d41d7 * 22) * Math.sin(v_8d41d7 * 4.3);
    v_8d4337[v_ebec57] = Math.max(0, Math.min(1.0, v_729db2));
  }
  return v_8d4337;
})();

function v_57ae6b() {
  const v_e5c9ed = v_fc0657<number[]>([...v_45df48]);
  const [v_bf751c, v_8bbf9d] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const [v_a893b0, v_767e63] = v_5ab095<string[]>([]);

  const [v_804a1b, v_31437d] = v_5ab095(0);

  const v_a98ec7 = v_de06a3((v_77b1ac) => {
    console.log(`[3DPersona] GLB loaded · morphs=${v_77b1ac.join(",")}`);
    v_767e63(v_77b1ac);
    v_8bbf9d(true);
  }, []);
  const v_c6eab8 = v_de06a3((v_badeaf) => {
    console.warn(`[3DPersona] load error: ${v_badeaf}`);
    v_3a7d09(v_badeaf);
  }, []);

  v_c4deb2(() => {
    if (!v_bf751c) return;
    let v_2008a4 = false;
    let v_cb36b1 = null;

    const v_6337ad = () => {
      if (v_2008a4) return;
      const v_965edf = Date.now();
      const v_729796 = () => {
        if (v_2008a4) return;
        const v_e56026 = Date.now() - v_965edf;

        const v_8d41d7 = Math.min(1, v_e56026 / 130);
        const v_81e2ef = Math.sin(v_8d41d7 * Math.PI);
        const v_a448ad = [...v_e5c9ed.value];
        v_a448ad[4] = v_81e2ef; 
        v_e5c9ed.value = v_a448ad;
        if (v_8d41d7 < 1) requestAnimationFrame(v_729796);
        else {
          const v_7900b1 = [...v_e5c9ed.value];
          v_7900b1[4] = 0;
          v_e5c9ed.value = v_7900b1;
          const v_aa4609 = 2000 + Math.random() * 2000;
          v_cb36b1 = setTimeout(v_6337ad, v_aa4609);
        }
      };
      requestAnimationFrame(v_729796);
    };
    v_cb36b1 = setTimeout(v_6337ad, 1500);
    return () => {
      v_2008a4 = true;
      if (v_cb36b1) clearTimeout(v_cb36b1);
    };
  }, [v_bf751c, v_e5c9ed]);

  const [v_8672be, v_75c87f] = v_5ab095(false);
  const v_a98af7 = v_de06a3(() => {
    if (v_8672be || !v_bf751c) return;
    v_75c87f(true);
    const v_965edf = Date.now();
    const v_729796 = () => {
      const v_e56026 = (Date.now() - v_965edf) / 1000;
      const v_143cb5 = Math.floor(v_e56026 * 60);
      if (v_143cb5 >= v_7f7fe8.length) {
        const v_a448ad = [...v_e5c9ed.value];
        v_a448ad[0] = 0; 
        v_a448ad[1] = 0; 
        v_e5c9ed.value = v_a448ad;
        v_31437d(0); 
        v_75c87f(false);
        return;
      }
      const v_a448ad = [...v_e5c9ed.value];
      const v_93cb95 = v_7f7fe8[v_143cb5];
      v_a448ad[0] = v_93cb95; 

      v_a448ad[1] = v_93cb95 * 0.7;
      v_e5c9ed.value = v_a448ad;
      v_31437d(v_93cb95); 
      requestAnimationFrame(v_729796);
    };
    requestAnimationFrame(v_729796);
  }, [v_8672be, v_bf751c, v_e5c9ed]);

  const v_189455 = v_df9f57(() => {
    if (v_a893b0.length === 0) return null;
    const v_505a6d = v_c4faef.join(",");
    const v_61a388 = v_a893b0.join(",");
    return v_505a6d === v_61a388 ? "✅ morph 순서 일치" : `⚠️ morph 순서 불일치\nexpected: ${v_505a6d}\nactual: ${v_61a388}`;
  }, [v_a893b0]);

  return (
    <SafeAreaView style={v_fd5f43.container}>
      <ScrollView contentContainerStyle={v_fd5f43.scroll}>
        <Text style={v_fd5f43.title}>3D 페르소나 데모</Text>
        <Text style={v_fd5f43.subtitle}>
          Filament (Google) 로 GLB 헤드 렌더 + morph target 립싱크 데모. 참고 프로젝트{" "}
          <Text style={v_fd5f43.mono}>al-3dtest</Text> 이식 Phase 1.
        </Text>

        <View style={v_fd5f43.headContainer}>
          {v_5e9bfe ? (
            <View style={v_fd5f43.errorBox}>
              <Text style={v_fd5f43.errorText}>렌더 실패</Text>
              <Text style={v_fd5f43.errorDetail}>{v_5e9bfe}</Text>
            </View>
          ) : (
            <Head weights={v_e5c9ed} onLoaded={v_a98ec7} onError={v_c6eab8} />
          )}
          {!v_bf751c && !v_5e9bfe ? (
            <View style={v_fd5f43.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={v_1bfbd0.white} />
              <Text style={v_fd5f43.loadingText}>GLB 로딩중…</Text>
            </View>
          ) : null}
          {

}
          {v_bf751c && !v_5e9bfe && v_804a1b > 0 ? (
            <View
              style={[
                v_fd5f43.mouthCavityOverlay,
                {
                  opacity: Math.min(0.88, v_804a1b * 0.95),
                  height: 22 + v_804a1b * 28, 
                },
              ]}
              pointerEvents="none"
            />
          ) : null}
        </View>

        <TouchableOpacity
          style={[v_fd5f43.btn, (v_8672be || !v_bf751c) && v_fd5f43.btnDisabled]}
          onPress={v_a98af7}
          disabled={v_8672be || !v_bf751c}
        >
          <Text style={v_fd5f43.btnText}>{v_8672be ? "말하는 중…" : "말하기 데모 (3초)"}</Text>
        </TouchableOpacity>

        {v_189455 ? (
          <View style={v_fd5f43.infoBox}>
            <Text style={v_fd5f43.infoTitle}>Morph Target 검증</Text>
            <Text style={v_fd5f43.infoText}>{v_189455}</Text>
            <Text style={v_fd5f43.infoText}>총 {v_ceeae8} 개 · 순서: {v_c4faef.join(", ")}</Text>
          </View>
        ) : null}

        <View style={v_fd5f43.infoBox}>
          <Text style={v_fd5f43.infoTitle}>Phase 2 예정</Text>
          <Text style={v_fd5f43.infoText}>
            • 사진 → 3D 자동 생성 (TripoSG){"\n"}
            • 통화 시 real TTS + 진폭 envelope 립싱크{"\n"}
            • 페르소나 pipeline='threed' 라우팅
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function v_ecc90b() {
  return (
    <FilamentScene>
      <ThreeDPersonaInner />
    </FilamentScene>
  );
}

const v_fd5f43 = v_472849.create({
  container: { flex: 1, backgroundColor: v_1bfbd0.zinc950 },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { color: v_1bfbd0.white, fontSize: 20, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: v_1bfbd0.zinc400, fontSize: 13, marginBottom: 16, lineHeight: 18 },
  mono: { fontFamily: "Courier", color: v_1bfbd0.zinc300 },
  headContainer: {
    height: 420,
    backgroundColor: v_1bfbd0.zinc900,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  loadingText: { color: v_1bfbd0.white, marginTop: 12, fontSize: 14 },

  mouthCavityOverlay: {
    position: "absolute",
    left: "50%",
    top: 245,
    width: 60,
    marginLeft: -30,
    borderRadius: 30,
    backgroundColor: "#000000",
  },
  errorBox: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: v_1bfbd0.error, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  errorDetail: { color: v_1bfbd0.zinc300, fontSize: 12, textAlign: "center" },
  btn: {
    backgroundColor: v_1bfbd0.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "700" },
  infoBox: {
    backgroundColor: v_1bfbd0.zinc900,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTitle: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  infoText: { color: v_1bfbd0.zinc300, fontSize: 12, lineHeight: 18 },
});

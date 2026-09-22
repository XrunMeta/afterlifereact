

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_39a996,
  v_acfdec,
  v_122070,
  v_472849,
  v_19b633,
  v_79c4f2,
  v_4623af,
  v_3094a2,
} from "rcmrninabrnb";
import { v_2f0d58 } from "wubwojvppqigopdenymkn";
import { v_fc0657 } from "fkysyevuehkssftyrtweoolhfw";
import { v_1bfbd0 } from "../../components/constants";
import { v_842502, v_45df48 } from "./threedPersona/Head";
import { v_ceeae8, v_c4faef } from "./threedPersona/config";
import { v_d60cdf, type v_fa0201 } from "../../api/clones";
import { v_1ed7d9 } from "../../stores/authStore";

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

  const [v_ec25ce, v_be68a6] = v_5ab095<boolean[]>([false, false, false, false, false]);
  const v_6cdf7b = v_de06a3((v_e86ad8) => {
    v_be68a6((v_ba2215) => {
      const v_a448ad = [...v_ba2215];
      v_a448ad[v_e86ad8] = !v_a448ad[v_e86ad8];
      const v_32f7b8 = [...v_e5c9ed.value];
      v_32f7b8[v_e86ad8] = v_a448ad[v_e86ad8] ? 1 : 0;
      v_e5c9ed.value = v_32f7b8;
      return v_a448ad;
    });
  }, [v_e5c9ed]);

  const [v_48e28a, v_107655] = v_5ab095("");
  const [v_5d6327, v_f8a8be] = v_5ab095<string | null>(null);
  const v_0ef735 = v_de06a3(() => {
    const v_2f361a = v_48e28a.trim();
    if (!v_2f361a) return;

    v_8bbf9d(false);
    v_3a7d09(null);
    v_767e63([]);
    v_e5c9ed.value = [...v_45df48];
    v_31437d(0);
    v_be68a6([false, false, false, false, false]);
    v_f8a8be(v_2f361a);
  }, [v_48e28a, v_e5c9ed]);
  const v_529ca2 = v_de06a3(() => {
    v_8bbf9d(false);
    v_3a7d09(null);
    v_767e63([]);
    v_e5c9ed.value = [...v_45df48];
    v_31437d(0);
    v_be68a6([false, false, false, false, false]);
    v_f8a8be(null);
  }, [v_e5c9ed]);

  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_5b8f3f, v_5ef9ce] = v_5ab095<v_fa0201[]>([]);
  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_d60cdf(v_2ca7e0)
      .then((v_cb35cb) => {
        if (v_2008a4) return;
        const v_e4cf17 = v_cb35cb.items.filter((v_3f4e2e) => v_3f4e2e.pipeline === "threed" && v_3f4e2e.avatarSdkGlbUrl);
        v_5ef9ce(v_e4cf17);
      })
      .catch((v_9e86fd) => {
        if (!v_2008a4) console.warn("[3DPersona] listMyClones fail:", v_9e86fd);
      });
    return () => { v_2008a4 = true; };
  }, [v_2ca7e0]);
  const v_70ac22 = v_de06a3((clone: v_fa0201) => {
    const v_f71b56 = v_eb25ce.avatarSdkGlbUrl;
    if (!v_f71b56) return;
    v_107655(v_f71b56);
    v_8bbf9d(false);
    v_3a7d09(null);
    v_767e63([]);
    v_e5c9ed.value = [...v_45df48];
    v_31437d(0);
    v_be68a6([false, false, false, false, false]);
    v_f8a8be(v_f71b56);
  }, [v_e5c9ed]);

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
            <Head

              key={v_5d6327 ?? "bundled"}
              weights={v_e5c9ed}
              onLoaded={v_a98ec7}
              onError={v_c6eab8}
              remoteUrl={v_5d6327 ?? undefined}
            />
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
                  opacity: Math.min(0.92, v_804a1b * 1.05),
                  height: 18 + v_804a1b * 34,
                  width: 56 + v_804a1b * 12,
                  marginLeft: -(56 + v_804a1b * 12) / 2,
                  borderTopLeftRadius: 30 + v_804a1b * 6,
                  borderTopRightRadius: 30 + v_804a1b * 6,
                  borderBottomLeftRadius: 40 + v_804a1b * 10,
                  borderBottomRightRadius: 40 + v_804a1b * 10,
                },
              ]}
              pointerEvents="none"
            >
              {
}
              <View style={v_fd5f43.mouthCavityCore} pointerEvents="none" />
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[v_fd5f43.btn, (v_8672be || !v_bf751c) && v_fd5f43.btnDisabled]}
          onPress={v_a98af7}
          disabled={v_8672be || !v_bf751c}
        >
          <Text style={v_fd5f43.btnText}>{v_8672be ? "말하는 중…" : "말하기 데모 (3초)"}</Text>
        </TouchableOpacity>

        {
}
        {v_5b8f3f.length > 0 ? (
          <View style={v_fd5f43.infoBox}>
            <Text style={v_fd5f43.infoTitle}>내 3D 페르소나 ({v_5b8f3f.length}개)</Text>
            <Text style={v_fd5f43.infoText}>
              admin 에서 pipeline=threed + Avatar SDK URL 저장한 페르소나. 탭 → 즉시 로드.
            </Text>
            <View style={v_fd5f43.morphDiagRow}>
              {v_5b8f3f.map((v_3f4e2e) => (
                <TouchableOpacity
                  key={v_3f4e2e.id}
                  style={[v_fd5f43.morphChip, v_5d6327 === v_3f4e2e.avatarSdkGlbUrl && v_fd5f43.morphChipOn]}
                  onPress={() => v_70ac22(v_3f4e2e)}
                >
                  <Text style={[v_fd5f43.morphChipText, v_5d6327 === v_3f4e2e.avatarSdkGlbUrl && v_fd5f43.morphChipTextOn]}>
                    {v_3f4e2e.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {
}
        <View style={v_fd5f43.infoBox}>
          <Text style={v_fd5f43.infoTitle}>원격 GLB URL (실험 · 수동 붙여넣기)</Text>
          <Text style={v_fd5f43.infoText}>
            Avatar SDK / MetaPerson Creator / Ready Player Me 등에서 뽑은 GLB URL 을 붙여넣으세요.
            비워두거나 초기화 누르면 번들된 head_9053.glb 로 되돌아갑니다.
          </Text>
          <TextInput
            style={v_fd5f43.urlInput}
            value={v_48e28a}
            onChangeText={v_107655}
            placeholder="https://models.readyplayerme.com/... 또는 Avatar SDK GLB URL"
            placeholderTextColor={v_1bfbd0.zinc500}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
          <View style={v_fd5f43.remoteBtnRow}>
            <TouchableOpacity
              style={[v_fd5f43.btnSmall, v_fd5f43.btnSmallPrimary, !v_48e28a.trim() && v_fd5f43.btnDisabled]}
              onPress={v_0ef735}
              disabled={!v_48e28a.trim()}
            >
              <Text style={v_fd5f43.btnText}>이 URL 로드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[v_fd5f43.btnSmall, v_fd5f43.btnSmallSecondary]}
              onPress={v_529ca2}
            >
              <Text style={v_fd5f43.btnText}>번들로 초기화</Text>
            </TouchableOpacity>
          </View>
          <Text style={v_fd5f43.infoText}>
            현재 소스: {v_5d6327 ? "원격 URL" : "번들 head_9053.glb"}
          </Text>
          {v_5d6327 ? (
            <Text style={[v_fd5f43.infoText, v_fd5f43.mono]} numberOfLines={2}>{v_5d6327}</Text>
          ) : null}
        </View>

        {v_a893b0.length > 0 ? (
          <View style={v_fd5f43.infoBox}>
            <Text style={v_fd5f43.infoTitle}>Morph Target 목록 ({v_a893b0.length}개)</Text>
            {v_189455 ? <Text style={v_fd5f43.infoText}>{v_189455}</Text> : null}
            <Text style={[v_fd5f43.infoText, v_fd5f43.mono]}>
              {v_a893b0.map((v_f4e98d, v_ebec57) => `[${v_ebec57}] ${v_f4e98d}`).join("\n")}
            </Text>
          </View>
        ) : null}

        {

}
        {v_bf751c && !v_5e9bfe ? (
          <View style={v_fd5f43.infoBox}>
            <Text style={v_fd5f43.infoTitle}>Morph 개별 토글 (진단)</Text>
            <Text style={v_fd5f43.infoText}>
              각 morph 를 0 ↔ 1 로 토글해서 실제 vertices 이동이 일어나는지 확인. GLB rigging 결함
              추적용.
            </Text>
            <View style={v_fd5f43.morphDiagRow}>
              {v_c4faef.map((v_1833e7, v_e86ad8) => (
                <TouchableOpacity
                  key={v_1833e7}
                  style={[v_fd5f43.morphChip, v_ec25ce[v_e86ad8] && v_fd5f43.morphChipOn, v_8672be && v_fd5f43.btnDisabled]}
                  onPress={() => v_6cdf7b(v_e86ad8)}
                  disabled={v_8672be}
                >
                  <Text style={[v_fd5f43.morphChipText, v_ec25ce[v_e86ad8] && v_fd5f43.morphChipTextOn]}>
                    {v_1833e7}{v_ec25ce[v_e86ad8] ? " ✓" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 8,
  },

  mouthCavityCore: {
    position: "absolute",
    top: 3,
    left: 6,
    right: 6,
    bottom: 2,
    borderRadius: 20,
    backgroundColor: "#0a0a0a",
  },

  morphDiagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  morphChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: v_1bfbd0.zinc800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc700,
  },
  morphChipOn: {
    backgroundColor: v_1bfbd0.primary,
    borderColor: v_1bfbd0.primary,
  },
  morphChipText: {
    color: v_1bfbd0.zinc300,
    fontSize: 11,
    fontWeight: "600",
  },
  morphChipTextOn: {
    color: v_1bfbd0.white,
  },

  urlInput: {
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: v_1bfbd0.zinc800,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc700,
    color: v_1bfbd0.white,
    fontSize: 12,
    minHeight: 60,
    textAlignVertical: "top",
  },
  remoteBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  btnSmall: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnSmallPrimary: {
    backgroundColor: v_1bfbd0.primary,
  },
  btnSmallSecondary: {
    backgroundColor: v_1bfbd0.zinc700,
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



import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_122070,
  v_cf9c33,
  v_4623af,
  v_472849,
  v_39a996,
  v_03e392,
  v_f2c756,
  v_326be8,
  v_405151,
} from "rcmrninabrnb";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_8881f3,
  v_84dc6e,
  type v_c7ec88,
} from "../../api/triposr";

export default function v_bf7ede() {
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_ee89db, v_3456cd] = v_5ab095<string | null>(null);
  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_43c42e, v_47323f] = v_5ab095<v_c7ec88 | null>(null);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const v_2e22e6 = async () => {
    const v_d60769 = await v_d05ab5.requestMediaLibraryPermissionsAsync();
    if (!v_d60769.granted) {
      v_03e392.alert("권한 필요", "갤러리 접근 권한을 허용해주세요.");
      return;
    }
    const v_8f00b9 = await v_d05ab5.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (v_8f00b9.canceled || !v_8f00b9.assets?.[0]?.uri) return;
    v_3456cd(v_8f00b9.assets[0].uri);
    v_47323f(null);
    v_3a7d09(null);
  };

  const v_d54f25 = async () => {
    if (!v_ee89db || !v_2ca7e0) return;
    v_34a50a(true);
    v_3a7d09(null);
    v_47323f(null);
    try {
      const v_cb35cb = await v_8881f3(v_2ca7e0, v_ee89db);
      v_47323f(v_cb35cb);
      if (v_326be8.OS === "android") {
        v_405151.show(`생성 완료 · ${(v_cb35cb.elapsed_ms / 1000).toFixed(1)}s`, v_405151.SHORT);
      }
    } catch (v_9e86fd) {
      const v_badeaf = (v_9e86fd as Error).message ?? String(v_9e86fd);
      v_3a7d09(v_badeaf);
      v_03e392.alert("3D 생성 실패", v_badeaf);
    } finally {
      v_34a50a(false);
    }
  };

  const v_98853a = () => {
    if (!v_43c42e) return;
    void v_f2c756.openURL(v_84dc6e(v_43c42e.base_url, v_43c42e.mesh_url));
  };

  return (
    <View style={v_fd5f43.container}>
      <PageHeader showBackButton title="3D 생성 테스트" transparent />
      <ScrollView contentContainerStyle={v_fd5f43.scroll}>
        <Text style={v_fd5f43.desc}>
          사진 1장 → TripoSR 서버 (가비아) → mesh + 5각도 렌더.{"\n"}
          첫 요청은 model 로딩으로 30초까지, 이후는 5~15초.
        </Text>

        <TouchableOpacity style={v_fd5f43.pickBtn} onPress={v_2e22e6} disabled={v_683210}>
          <Feather name="image" size={20} color={v_1bfbd0.white} />
          <Text style={v_fd5f43.pickBtnLabel}>사진 선택</Text>
        </TouchableOpacity>

        {v_ee89db ? (
          <View style={v_fd5f43.inputCard}>
            <Text style={v_fd5f43.sectionLabel}>입력</Text>
            <Image source={{ uri: v_ee89db }} style={v_fd5f43.inputImage} resizeMode="contain" />
            <TouchableOpacity
              style={[v_fd5f43.runBtn, v_683210 && v_fd5f43.runBtnDisabled]}
              onPress={v_d54f25}
              disabled={v_683210}
            >
              {v_683210 ? (
                <ActivityIndicator color={v_1bfbd0.white} />
              ) : (
                <>
                  <Feather name="box" size={18} color={v_1bfbd0.white} />
                  <Text style={v_fd5f43.runBtnLabel}>3D 생성</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {v_5e9bfe ? (
          <View style={v_fd5f43.errorCard}>
            <Text style={v_fd5f43.errorLabel}>실패</Text>
            <Text style={v_fd5f43.errorMsg}>{v_5e9bfe}</Text>
          </View>
        ) : null}

        {v_43c42e ? (
          <View style={v_fd5f43.resultCard}>
            <Text style={v_fd5f43.sectionLabel}>
              결과 · {(v_43c42e.elapsed_ms / 1000).toFixed(1)}s · mesh {(v_43c42e.mesh_bytes / 1024 / 1024).toFixed(1)}MB · {v_43c42e.render_urls.length}각도
            </Text>
            <TurntablePlayer
              baseUrl={v_43c42e.base_url}
              renderUrls={v_43c42e.render_urls}
            />
            <TouchableOpacity style={v_fd5f43.meshBtn} onPress={v_98853a}>
              <Feather name="download" size={16} color={v_1bfbd0.white} />
              <Text style={v_fd5f43.meshBtnLabel}>mesh.obj 열기 (브라우저)</Text>
            </TouchableOpacity>
            <Text style={v_fd5f43.jobId}>job_id: {v_43c42e.job_id}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function v_1e7588({
  baseUrl: v_c01615,
  renderUrls: v_9b9b69,
}: {
  baseUrl: string;
  renderUrls: string[];
}) {
  const v_942aa2 = v_9b9b69.map((v_ba70d8) => v_84dc6e(v_c01615, v_ba70d8));
  const [v_e86ad8, v_273390] = v_5ab095(0);
  const [v_398075, v_745403] = v_5ab095(true);
  const [v_b1717e, v_0189ac] = v_5ab095(false);
  const v_bd4e67 = v_e662ae(0);

  v_c4deb2(() => {
    let v_2008a4 = false;
    let v_bf751c = 0;
    v_942aa2.forEach((v_ceb55a) => {
      void v_cf9c33.prefetch(v_ceb55a).then(() => {
        v_bf751c += 1;
        if (v_bf751c === v_942aa2.length && !v_2008a4) v_0189ac(true);
      }).catch(() => {
        v_bf751c += 1;
        if (v_bf751c === v_942aa2.length && !v_2008a4) v_0189ac(true);
      });
    });
    return () => { v_2008a4 = true; };
  }, [v_942aa2.join(",")]);

  v_c4deb2(() => {
    if (!v_398075 || !v_b1717e) return;
    const v_389afb = setInterval(() => {
      v_bd4e67.current = (v_bd4e67.current + 1) % v_942aa2.length;
      v_273390(v_bd4e67.current);
    }, 83); 
    return () => clearInterval(v_389afb);
  }, [v_398075, v_b1717e, v_942aa2.length]);

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => v_745403((v_e2a85c) => !v_e2a85c)}
        style={v_2871bd.frame}
      >
        {v_942aa2.map((v_ceb55a, v_ebec57) => (
          <Image
            key={v_ebec57}
            source={{ uri: v_ceb55a }}
            style={[v_2871bd.image, { opacity: v_ebec57 === v_e86ad8 ? 1 : 0 }]}
            resizeMode="contain"
            fadeDuration={0}
          />
        ))}
        {!v_b1717e ? (
          <View style={v_2871bd.loadingOverlay}>
            <ActivityIndicator color="#fff" />
            <Text style={v_2871bd.loadingText}>프레임 로딩 중...</Text>
          </View>
        ) : !v_398075 ? (
          <View style={v_2871bd.pauseBadge}>
            <Feather name="play" size={20} color="#fff" />
          </View>
        ) : null}
      </TouchableOpacity>
      <Text style={v_2871bd.hint}>
        {v_b1717e ? (v_398075 ? "탭 = 일시정지" : "탭 = 재생") : "프레임 로딩 중..."} · {v_e86ad8 + 1} / {v_942aa2.length}
      </Text>
    </View>
  );
}

const v_2871bd = v_472849.create({
  frame: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingText: { color: "#fff", fontSize: 12 },
  pauseBadge: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 16,
    borderRadius: 999,
  },
  hint: { color: "#a1a1aa", fontSize: 11, textAlign: "center", marginTop: 6 },
});

const v_fd5f43 = v_472849.create({
  container: { flex: 1, backgroundColor: v_1bfbd0.zinc950 },
  scroll: { padding: v_9b1a04.medium, gap: v_9b1a04.medium },
  desc: {
    color: v_1bfbd0.zinc300,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: v_9b1a04.small,
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: v_9b1a04.small,
    backgroundColor: v_1bfbd0.zinc800,
    paddingVertical: v_9b1a04.medium,
    borderRadius: v_9b1a04.small,
  },
  pickBtnLabel: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "600" },
  inputCard: {
    backgroundColor: v_1bfbd0.zinc900,
    borderRadius: v_9b1a04.small,
    padding: v_9b1a04.medium,
    gap: v_9b1a04.small,
  },
  sectionLabel: { color: v_1bfbd0.zinc300, fontSize: 13, fontWeight: "600" },
  inputImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: v_9b1a04.small,
    backgroundColor: v_1bfbd0.zinc800,
  },
  runBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: v_9b1a04.small,
    backgroundColor: "#4f46e5",
    paddingVertical: v_9b1a04.medium,
    borderRadius: v_9b1a04.small,
    marginTop: v_9b1a04.small,
  },
  runBtnDisabled: { opacity: 0.6 },
  runBtnLabel: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "600" },
  errorCard: {
    backgroundColor: "#3b1f1f",
    borderRadius: v_9b1a04.small,
    padding: v_9b1a04.medium,
    gap: 4,
  },
  errorLabel: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  errorMsg: { color: v_1bfbd0.zinc300, fontSize: 12, lineHeight: 18 },
  resultCard: {
    backgroundColor: v_1bfbd0.zinc900,
    borderRadius: v_9b1a04.small,
    padding: v_9b1a04.medium,
    gap: v_9b1a04.small,
  },
  renderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: v_9b1a04.small,
  },
  renderThumb: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: v_9b1a04.small,
    backgroundColor: v_1bfbd0.zinc800,
  },
  meshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: v_9b1a04.small,
    backgroundColor: v_1bfbd0.zinc800,
    paddingVertical: v_9b1a04.medium,
    borderRadius: v_9b1a04.small,
    marginTop: v_9b1a04.small,
  },
  meshBtnLabel: { color: v_1bfbd0.white, fontSize: 14, fontWeight: "600" },
  jobId: { color: v_1bfbd0.zinc300, fontSize: 11, textAlign: "center", marginTop: 4 },
});

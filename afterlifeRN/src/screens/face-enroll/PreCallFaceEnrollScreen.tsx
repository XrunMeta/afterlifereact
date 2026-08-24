

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_79c4f2,
  v_39a996,
  v_a2349e,
  v_d49152,
  v_e767d1,
  v_326be8,
  v_0e1f26,
} from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_650cfa, v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import {
  v_862296 as v_628d75,
  v_db5a6b,
  v_b08ef3,
} from "mkqptszwrsxiemcjrtdlshyxlm";
import { v_d73d29, v_fc0657 } from "fkysyevuehkssftyrtweoolhfw";
import { v_ac8611 } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";
import { v_b24f74 } from "hpkstesipoootxeqkajlxyxt";
import { v_cb507d } from "hbzwhsuegbhzscystubugxnkiwe";
import { v_e74bab } from "../../face/largestFace";
import { v_a40fe8 } from "../../face/frameTimestamp";
import { v_a64bce } from "../../face/l2normalize";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_4e7b87, v_4585d1, v_a94a1b, v_6ffcc5, v_865d38 } from "../../api/persons";
import { v_889fad } from "../../stores/dialogStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import v_258c1c from "../../components/common/PageHeader";
import type { v_8ad91b } from "../../navigation/types";

type Nav = v_390fcc<v_8ad91b, "PreCallFaceEnroll">;
type Rt = v_ee3714<v_8ad91b, "PreCallFaceEnroll">;

interface Step {
  key: string;
  label: string;
  hint: string;
}

const v_77ce37 = [
  { key: "front", label: "정면", hint: "화면 정중앙을 정시해 주세요" },
  { key: "right", label: "오른쪽", hint: "고개를 오른쪽으로 살짝 돌려주세요" },
  { key: "left", label: "왼쪽", hint: "고개를 왼쪽으로 살짝 돌려주세요" },
  { key: "up", label: "위", hint: "고개를 위로 살짝 들어주세요" },
  { key: "down", label: "아래", hint: "고개를 아래로 살짝 숙여주세요" },
  { key: "close", label: "가까이", hint: "얼굴을 카메라에 가까이 대주세요" },
  { key: "far", label: "멀리", hint: "얼굴을 카메라에서 조금 멀리 떨어뜨려 주세요" },
] as const;

const v_10f62f = {
  performanceMode: "fast",
  landmarkMode: "none",
  contourMode: "none",
  classificationMode: "none",
  minFaceSize: 0.2,
} as const;

export default function v_8640b9() {
  const v_3c9f12 = v_ada615<Nav>();
  const v_c7daf6 = v_2d8264<Rt>();
  const v_033e14 = v_e0068c();

  const v_79a64b = (v_c7daf6.params as { cloneId: unknown }).cloneId;
  const v_6e0fd3 = Number(v_79a64b);
  const { name: v_dfb220, image: v_0e38ad, midCall: v_c414dc } = v_c7daf6.params;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);

  v_c4deb2(() => {
    if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
      v_889fad("페르소나 정보 오류", "잘못된 페르소나로 진입했어요. 다시 시도해 주세요.", [
        { text: "확인", onPress: () => v_3c9f12.goBack() },
      ]);
    }

  }, [v_6e0fd3]);

  const [v_f9f059, v_7c7b9c] = v_5ab095<boolean | null>(null);
  const [v_729796, v_fd7d1f] = v_5ab095(0);
  const [v_74e259, v_49cc35] = v_5ab095<number[][]>([]);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const [v_595acb, v_9ad9a9] = v_5ab095("");
  const [v_d7d38d, v_23c9e5] = v_5ab095("");
  const [v_056b4f, v_342bf2] = v_5ab095<string | null>(null);

  const v_d0be9c = v_e662ae<number[] | null>(null);
  const v_5428c9 = v_e662ae(0);

  const v_ac8592 = v_e662ae(new v_a2349e.Value(0)).current;
  const v_7454ea = v_de06a3(() => {

    v_d49152.vibrate(30);
    v_a2349e.sequence([
      v_a2349e.timing(v_ac8592, { toValue: 0.6, duration: 80, useNativeDriver: true }),
      v_a2349e.timing(v_ac8592, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [v_ac8592]);

  v_c4deb2(() => {
    void (async () => {
      const v_d308b5 = await v_628d75.requestCameraPermission();
      v_7c7b9c(v_d308b5 === "granted");
    })();
  }, []);

  const v_ac8c13 = v_db5a6b("front");
  const { detectFaces: v_de4d76 } = v_ac8611(v_10f62f);
  const { resize: v_2e11e8 } = v_cb507d();
  const v_2ce97f = v_b24f74(
    require("../../../assets/models/w600k_mbf.tflite"),
  );
  const v_23f1a4 = v_2ce97f.state === "loaded" ? v_2ce97f.model : null;

  const v_5111a7 = v_fc0657(0);
  const v_d36325 = 300;
  const v_44c2eb = v_df9f57(() => require("rcmrninabrnb").Platform.OS === "android", []);

  const v_998534 = v_df9f57(
    () =>
      v_d73d29.createRunOnJS((v_f9a45c, v_0b2889) => {
        v_d0be9c.current = v_f9a45c;
        v_5428c9.current = v_0b2889;
      }),
    [],
  );

  const v_a61ebf = v_b08ef3(
    (v_143cb5) => {
      "worklet";
      const v_a51d09 = v_de4d76(v_143cb5);
      if (v_23f1a4 == null) return;
      const v_67e77e = v_a40fe8(v_143cb5.timestamp, v_44c2eb);
      if (v_67e77e - v_5111a7.value < v_d36325) return;
      v_5111a7.value = v_67e77e;
      const v_127e92 = v_e74bab(v_a51d09);
      if (v_127e92 == null) {
        v_998534([], 0);
        return;
      }

      const v_138ccc = v_127e92.bounds.x;
      const v_29057a = v_127e92.bounds.y;
      const v_5975be = v_127e92.bounds.width;
      const v_75930d = v_127e92.bounds.height;
      const v_818eab = v_5975be * 0.15;
      const v_737234 = v_75930d * 0.15;
      const v_2d3c27 = v_2e11e8(v_143cb5, {
        crop: {
          x: Math.max(0, v_138ccc - v_818eab),
          y: Math.max(0, v_29057a - v_737234),
          width: v_5975be + v_818eab * 2,
          height: v_75930d + v_737234 * 2,
        },
        scale: { width: 112, height: 112 },
        pixelFormat: "rgb",
        dataType: "float32",
      });
      const v_75195c = new Float32Array(v_2d3c27.length);
      for (let v_ebec57 = 0; v_ebec57 < v_2d3c27.length; v_ebec57++) v_75195c[v_ebec57] = v_2d3c27[v_ebec57] * 2 - 1;
      const v_8d4337 = v_23f1a4.runSync([v_75195c])[0] as Float32Array;
      v_998534(Array.from(v_8d4337), v_a51d09.length);
    },
    [v_de4d76, v_23f1a4, v_2e11e8, v_5111a7, v_44c2eb, v_998534],
  );

  const v_e9b971 = v_de06a3(() => {
    v_3c9f12.dispatch(
      v_650cfa.reset({
        index: 0,
        routes: [{ name: "Call", params: { cloneId: v_6e0fd3, name: v_dfb220, image: v_0e38ad } }],
      }),
    );
  }, [v_3c9f12, v_6e0fd3, v_dfb220, v_0e38ad]);

  const v_bcff1c = v_de06a3(() => {
    v_889fad(
      "등록 없이 진행",
      "얼굴 인식·기억 기능이 제한될 수 있습니다. 계속하시겠어요?",
      [
        { text: "취소", style: "cancel" },
        { text: "그대로 진행", onPress: v_e9b971 },
      ],
    );
  }, [v_e9b971]);

  const v_94e3dc = v_de06a3(() => {
    const v_46ff7a = v_d0be9c.current;
    const v_0b2889 = v_5428c9.current;
    if (!v_46ff7a || v_46ff7a.length !== 512 || v_0b2889 === 0) {
      v_889fad("얼굴을 찾지 못했어요", "가이드 원 안에 얼굴이 잘 보이도록 자세를 잡아주세요.");
      return;
    }

    const v_825625 = Array.from(v_a64bce(Float32Array.from(v_46ff7a)));

    v_7454ea();
    v_49cc35((v_ba2215) => [...v_ba2215, v_825625]);
    v_fd7d1f((v_ba2215) => v_ba2215 + 1);
  }, [v_7454ea]);

  const v_cd685a = v_de06a3(
    (v_8a1355, v_dd8af0) => {
      if (!v_2ca7e0 || !v_625c74) {
        v_342bf2("로그인 정보가 없어요. 다시 시도해 주세요.");
        return;
      }
      if (v_74e259.length !== v_77ce37.length) {
        v_342bf2("얼굴 촬영을 먼저 완료해 주세요.");
        return;
      }
      const v_affc3e = v_8a1355.trim();
      if (!v_affc3e) {
        v_342bf2("이름을 입력해 주세요.");
        return;
      }
      v_0e1f26.dismiss();
      v_342bf2(null);
      v_ee9ec1(true);
      void (async () => {
        let v_d794c4 = null;
        try {

          let v_ca1ec5;
          try {
            const v_306a28 = await v_4e7b87(v_2ca7e0, {
              cloneId: v_6e0fd3,
              displayName: v_affc3e,
              enrolledVia: "auto_biometric",
            });
            v_ca1ec5 = v_306a28.id;
            v_d794c4 = v_306a28.id;
          } catch (v_7df476) {
            const v_badeaf = (v_7df476 as Error).message ?? "";
            if (/이미 등록된 이름/.test(v_badeaf)) {

              const v_ef8ab1 = await v_865d38(v_2ca7e0, v_6e0fd3);
              const v_3c8572 = v_ef8ab1.items.find((v_e2a85c) => (v_e2a85c.displayName ?? "") === v_affc3e);
              if (!v_3c8572) throw v_7df476; 
              v_ca1ec5 = v_3c8572.id;
              console.log(`[PreCallFaceEnroll] 이미 존재 person 재사용 · id=${v_ca1ec5} · faces 추가`);
            } else {
              throw v_7df476;
            }
          }
          const v_e646b6 = 5;
          for (let v_ebec57 = 0; v_ebec57 < v_74e259.length; v_ebec57 += v_e646b6) {
            const v_36e01f = v_74e259.slice(v_ebec57, v_ebec57 + v_e646b6);
            await v_4585d1(v_2ca7e0, v_ca1ec5, v_36e01f, v_6e0fd3);
          }
          const v_d04cc5 = v_dd8af0.trim();
          if (v_d04cc5) {
            try {
              await v_6ffcc5(v_2ca7e0, v_ca1ec5, v_d04cc5);
            } catch (v_2530bf) {
              console.warn("[PreCallFaceEnroll] updatePersonRelation 실패 (무시):", v_2530bf);
            }
          }
          v_d794c4 = null;
          const v_a8cd21 = v_c414dc
            ? "얼굴 등록 완료! 통화를 다시 시작합니다."
            : "얼굴 인식 준비가 끝났어요. 통화를 시작합니다.";
          v_889fad("등록 완료", v_a8cd21, [{ text: "통화 시작", onPress: v_e9b971 }]);
        } catch (v_49263d) {
          console.warn("[PreCallFaceEnroll] enroll 실패:", v_49263d);
          if (v_d794c4 != null) {
            try {
              await v_a94a1b(v_2ca7e0, v_d794c4);
            } catch (v_d42b37) {
              console.warn("[PreCallFaceEnroll] rollback 실패:", v_d42b37);
            }
          }
          v_342bf2((v_49263d as Error).message ?? "네트워크 오류");
          v_ee9ec1(false);
        }
      })();
    },
    [v_2ca7e0, v_625c74, v_74e259, v_6e0fd3, v_c414dc, v_e9b971],
  );

  const v_3bfe4c = v_de06a3(() => {
    v_cd685a(v_595acb, v_d7d38d);
  }, [v_cd685a, v_595acb, v_d7d38d]);

  const v_4e7e60 = v_e662ae(false);
  const v_1e2ad6 = v_729796 >= v_77ce37.length;
  v_c4deb2(() => {
    if (!v_1e2ad6 || v_c414dc || v_4e7e60.current || v_cb66b4) return;
    const v_d48d1e = (v_625c74?.name ?? "").trim() || "나";
    v_4e7e60.current = true;
    v_cd685a(v_d48d1e, "");
  }, [v_1e2ad6, v_c414dc, v_cb66b4, v_625c74, v_cd685a]);

  if (v_f9f059 === false) {
    return (
      <View style={[v_fd5f43.container, v_fd5f43.center]}>
        <Text style={v_fd5f43.hint}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity onPress={v_bcff1c} style={v_fd5f43.skipBtn}>
          <Text style={v_fd5f43.skipBtnText}>등록 건너뛰고 통화</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (v_f9f059 === null || !v_ac8c13) {
    return (
      <View style={[v_fd5f43.container, v_fd5f43.center]}>
        <ActivityIndicator color={v_1bfbd0.white} />
        <Text style={v_fd5f43.hint}>카메라 준비 중...</Text>
      </View>
    );
  }

  const v_91943c = v_77ce37[Math.min(v_729796, v_77ce37.length - 1)];
  const v_2fb8cc = v_729796 >= v_77ce37.length;

  return (
    <View style={[v_fd5f43.container, { paddingBottom: v_033e14.bottom }]}>
      {}
      <PageHeader showBackButton onBackPress={() => v_3c9f12.goBack()} transparent />

      {
}
      {!(v_2fb8cc && v_c414dc) && (
        <View style={v_fd5f43.header}>
          <Text style={v_fd5f43.title}>얼굴 등록</Text>
          <Text style={v_fd5f43.subtitle}>
            {v_c414dc
              ? "새 얼굴을 등록하고 통화를 다시 시작해요."
              : `${v_dfb220 ?? "페르소나"} 과 자연스럽게 대화하도록 얼굴을 각도·거리별로 담아둘게요.`}
          </Text>
        </View>
      )}

      {}
      {v_2fb8cc && v_c414dc ? (
        <KeyboardAvoidingView
          style={v_fd5f43.centerBlock}
          behavior={v_326be8.OS === "ios" ? "padding" : "height"}
        >
          <Text style={v_fd5f43.formTitle}>이 분은 누구신가요?</Text>
          <Text style={v_fd5f43.formDesc}>
            이름과 관계를 알려주시면 다음 통화부터 알아볼 수 있어요.
          </Text>
          <Text style={v_fd5f43.formLabel}>이름</Text>
          <TextInput
            style={v_fd5f43.formInput}
            value={v_595acb}
            onChangeText={v_9ad9a9}
            placeholder="예: 지호"
            placeholderTextColor={v_1bfbd0.zinc500}
            autoFocus
            returnKeyType="next"
            editable={!v_cb66b4}
          />
          <Text style={v_fd5f43.formLabel}>관계 (선택)</Text>
          <TextInput
            style={v_fd5f43.formInput}
            value={v_d7d38d}
            onChangeText={v_23c9e5}
            placeholder="예: 손주, 오랜 친구"
            placeholderTextColor={v_1bfbd0.zinc500}
            returnKeyType="done"
            editable={!v_cb66b4}
            onSubmitEditing={v_3bfe4c}
          />
          {v_056b4f ? <Text style={v_fd5f43.formError}>{v_056b4f}</Text> : null}
        </KeyboardAvoidingView>
      ) : v_2fb8cc && !v_c414dc ? (

        <View style={v_fd5f43.centerBlock}>
          <ActivityIndicator size="large" color={v_1bfbd0.white} />
          <Text style={v_fd5f43.hint}>얼굴 등록 중...</Text>
        </View>
      ) : (
        <View style={v_fd5f43.centerBlock}>
          <View style={v_fd5f43.cameraBox}>
            <VisionCamera
              style={v_472849.absoluteFill}
              device={v_ac8c13}
              isActive={!v_cb66b4}
              frameProcessor={v_23f1a4 ? v_a61ebf : undefined}
              pixelFormat="yuv"
            />
            <View style={v_fd5f43.guideCircle} pointerEvents="none" />
          </View>

          <View style={v_fd5f43.stepBox}>
            <Text style={v_fd5f43.stepLabel}>
              {v_729796 + 1}/{v_77ce37.length} · {v_91943c.label}
            </Text>
            <Text style={v_fd5f43.stepHint}>{v_91943c.hint}</Text>
          </View>

          <View style={v_fd5f43.progressRow}>
            {v_77ce37.map((v_9dd05b, v_e86ad8) => (
              <View
                key={v_9dd05b.key}
                style={[v_fd5f43.dot, v_e86ad8 < v_729796 && v_fd5f43.dotDone, v_e86ad8 === v_729796 && !v_2fb8cc && v_fd5f43.dotActive]}
              />
            ))}
          </View>
        </View>
      )}

      {}
      <View style={v_fd5f43.bottomBlock}>
        {v_2fb8cc ? (
          <TouchableOpacity
            onPress={v_3bfe4c}
            style={[v_fd5f43.captureBtn, v_cb66b4 && v_fd5f43.captureBtnDisabled]}
            disabled={v_cb66b4 || !v_595acb.trim()}
          >
            {v_cb66b4 ? (
              <ActivityIndicator color={v_1bfbd0.zinc900} />
            ) : (
              <Text style={v_fd5f43.captureBtnText}>등록</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={v_94e3dc} style={v_fd5f43.captureBtn} disabled={v_cb66b4}>
            <Text style={v_fd5f43.captureBtnText}>촬영</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={v_bcff1c} style={v_fd5f43.skipBtn} disabled={v_cb66b4}>
          <Text style={v_fd5f43.skipBtnText}>
            {v_c414dc ? "등록 없이 통화 재개" : "나중에 하기 (지금 통화)"}
          </Text>
        </TouchableOpacity>

        {}
        <Text style={v_fd5f43.privacyNote}>
          촬영한 사진은 서버에 저장되지 않아요. 얼굴을 알아보기 위한 숫자 특징(벡터)만 안전하게 담아둡니다.
        </Text>
      </View>

      {}
      <Animated.View
        pointerEvents="none"
        style={[v_fd5f43.flash, { opacity: v_ac8592 }]}
      />
    </View>
  );
}

const v_fdd448 = 260;

const v_fd5f43 = v_472849.create({
  container: { flex: 1, backgroundColor: v_1bfbd0.zinc950, padding: 20 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  header: { alignItems: "center", gap: 6, marginBottom: 8 },
  centerBlock: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },

  bottomBlock: { gap: 0 },
  privacyNote: {
    color: v_1bfbd0.zinc400,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },

  formTitle: { color: v_1bfbd0.white, fontSize: 20, fontWeight: "700", textAlign: "center" },
  formDesc: { color: v_1bfbd0.zinc300, fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 20 },
  formLabel: { color: v_1bfbd0.zinc300, fontSize: 13, alignSelf: "flex-start", marginTop: 12, marginBottom: 6 },
  formInput: {
    alignSelf: "stretch",
    backgroundColor: v_1bfbd0.zinc900,
    color: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formError: { color: "#f87171", fontSize: 12, marginTop: 10, alignSelf: "flex-start" },
  captureBtnDisabled: { opacity: 0.6 },
  title: { color: v_1bfbd0.white, fontSize: 22, fontWeight: "700" },
  subtitle: { color: v_1bfbd0.zinc300, fontSize: 13, textAlign: "center" },
  cameraBox: {
    width: v_fdd448,
    height: v_fdd448,
    borderRadius: v_fdd448 / 2,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: v_1bfbd0.zinc900,
  },
  guideCircle: {
    ...v_472849.absoluteFillObject,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: v_fdd448 / 2,
  },
  stepBox: { alignItems: "center", gap: 4 },
  stepLabel: { color: v_1bfbd0.white, fontSize: 18, fontWeight: "700" },
  stepHint: { color: v_1bfbd0.zinc300, fontSize: 13 },
  progressRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 4 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: v_1bfbd0.zinc700,
  },
  dotDone: { backgroundColor: "#22c55e" },
  dotActive: { backgroundColor: v_1bfbd0.white },
  captureBtn: {
    backgroundColor: v_1bfbd0.white,
    paddingVertical: 14,
    borderRadius: v_8b0c90.full,
    alignItems: "center",

    marginTop: 0,
  },
  captureBtnText: { color: v_1bfbd0.zinc900, fontSize: 16, fontWeight: "700" },
  skipBtn: {

    paddingTop: 12,
    paddingBottom: 4,
    alignItems: "center",
  },
  skipBtnText: { color: v_1bfbd0.zinc400, fontSize: 13, textDecorationLine: "underline" },
  hint: { color: v_1bfbd0.zinc300, fontSize: 14, textAlign: "center" },

  flash: {
    ...v_472849.absoluteFillObject,
    backgroundColor: v_1bfbd0.white,
  },
});

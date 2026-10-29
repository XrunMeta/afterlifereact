

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_4623af, v_39a996, v_a2349e, v_d49152 } from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import v_f595b9, { v_bf60de } from "vpztcxjmsfanunln";
import { v_e82960, v_0e491a } from "qmmwyqbwrg";
import * as v_3c288d from "bxoplsnixpmvnirxbbkstg";
import { v_862296 as v_628d75, v_db5a6b, v_b08ef3 } from "mkqptszwrsxiemcjrtdlshyxlm";
import { v_d73d29, v_fc0657 } from "fkysyevuehkssftyrtweoolhfw";
import { v_ac8611 } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_75de9d } from "zqqvxke";
import { v_e74bab } from "../../face/largestFace";
import { v_a40fe8 } from "../../face/frameTimestamp";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_84a859 } from "../../api/auth";
import { v_d24cb4, v_62d015, type v_7282a2 } from "../../api/faceAccount";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

type ShotKey = "front" | v_7282a2;

const v_7c0430 = {
  front: {
    labelKey: "faceEnroll.step.frontLabel", label: "정면",
    hintKey: "faceEnroll.step.frontHint", hint: "카메라를 정면으로 봐주세요",
    check: (v_64877a, v_e2a85c) => Math.abs(v_64877a) < 12 && Math.abs(v_e2a85c) < 12, sfx: 0,
  },
  left: {
    labelKey: "faceEnroll.step.leftLabel", label: "왼쪽",
    hintKey: "faceEnroll.step.leftHint", hint: "고개를 왼쪽으로 돌려주세요",
    check: (v_64877a, v_e2a85c) => v_64877a > 18 && Math.abs(v_e2a85c) < 20, sfx: 1,
  },
  right: {
    labelKey: "faceEnroll.step.rightLabel", label: "오른쪽",
    hintKey: "faceEnroll.step.rightHint", hint: "고개를 오른쪽으로 돌려주세요",
    check: (v_64877a, v_e2a85c) => v_64877a < -18 && Math.abs(v_e2a85c) < 20, sfx: 2,
  },
  down: {
    labelKey: "faceEnroll.step.downLabel", label: "아래",
    hintKey: "faceEnroll.step.downHint", hint: "고개를 아래로 숙여주세요",
    check: (v_64877a, v_e2a85c) => v_e2a85c < -10 && Math.abs(v_64877a) < 20, sfx: 3,
  },
  up: {
    labelKey: "faceEnroll.step.upLabel", label: "위",
    hintKey: "faceEnroll.step.upHint", hint: "고개를 위로 들어주세요",
    check: (v_64877a, v_e2a85c) => v_e2a85c > 10 && Math.abs(v_64877a) < 20, sfx: 4,
  },
};

const v_10f62f = {
  performanceMode: "fast",
  landmarkMode: "none",
  contourMode: "none",
  classificationMode: "none",
  minFaceSize: 0.2,
} as const;

function v_5a6d81(t: v_75de9d, v_c99bd2): string {
  switch (v_c99bd2) {
    case "NO_FACE":
    case "LOW_QUALITY":
    case "BAD_IMAGE":
      return v_8d41d7("accountFace.err.noFace", { defaultValue: "얼굴이 잘 보이지 않았어요. 밝은 곳에서 다시 찍어 주세요." });
    case "MULTI_FACE":
      return v_8d41d7("accountFace.err.multiFace", { defaultValue: "화면에 한 사람만 보이게 해 주세요." });
    case "NOT_FRONTAL":
      return v_8d41d7("accountFace.err.notFrontal", { defaultValue: "첫 장은 카메라를 정면으로 봐 주세요." });
    case "STEP_MISMATCH":
    case "NOT_SAME_PERSON":
      return v_8d41d7("accountFace.err.steps", { defaultValue: "안내한 방향대로 고개를 천천히 돌려 주세요." });
    case "CHALLENGE_INVALID":
      return v_8d41d7("accountFace.err.expired", { defaultValue: "시간이 지났어요. 다시 찍어 주세요." });
    default:
      return v_8d41d7("accountFace.err.generic", { defaultValue: "등록하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
}

export default function v_5b71e1({ onDone: v_7b5712 }: { onDone: () => void }) {
  const v_033e14 = v_e0068c();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_f9f059, v_7c7b9c] = v_5ab095<boolean | null>(null);
  const [v_62f5a9, v_7c0eee] = v_5ab095<{ id: string; shots: ShotKey[] } | null>(null);
  const [v_85f251, v_024d7d] = v_5ab095(0);
  const [v_db2e13, v_3c192b] = v_5ab095<string[]>([]);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const [v_26803c, v_807576] = v_5ab095<{ yaw: number; pitch: number } | null>(null);

  const v_1a165b = v_e662ae<v_628d75>(null);
  const v_4bc1f9 = v_e662ae(0);
  const v_6ba760 = v_e662ae<ShotKey[]>([]);
  const v_ab47d1 = v_e662ae(false);
  const v_e1fdd2 = v_e662ae<{ yaw: number; pitch: number } | null>(null);
  const v_c260c5 = v_e662ae(0);
  v_c4deb2(() => { v_4bc1f9.current = v_85f251; }, [v_85f251]);
  v_c4deb2(() => { v_6ba760.current = v_62f5a9?.shots ?? []; }, [v_62f5a9]);

  const v_ac8592 = v_e662ae(new v_a2349e.Value(0)).current;
  const v_e1989a = v_df9f57(
    () => [
      v_e82960(require("../../../assets/sfx/face_1_front.mp3")),
      v_e82960(require("../../../assets/sfx/face_2_left.mp3")),
      v_e82960(require("../../../assets/sfx/face_3_right.wav")),
      v_e82960(require("../../../assets/sfx/face_4_down.mp3")),
      v_e82960(require("../../../assets/sfx/face_5_up.mp3")),
    ],
    [],
  );
  const v_343670 = v_df9f57(() => v_e82960(require("../../../assets/sfx/face_complete.wav")), []);
  v_c4deb2(() => {
    v_0e491a({ playsInSilentMode: true, interruptionMode: "mixWithOthers" }).catch(() => {});
    return () => {
      for (const v_e2a85c of [...v_e1989a, v_343670]) {
        try { v_e2a85c.remove(); } catch {  }
      }
    };
  }, [v_e1989a, v_343670]);
  const v_1eef66 = v_de06a3((p: ReturnType<typeof v_e82960> | undefined) => {
    if (!v_e2a85c) return;
    try {
      void v_e2a85c.seekTo(0);
      v_e2a85c.play();
    } catch {  }
  }, []);

  v_c4deb2(() => {
    void (async () => {
      const v_d308b5 = await v_628d75.requestCameraPermission();
      v_7c7b9c(v_d308b5 === "granted");
    })();
  }, []);

  const v_fd0d55 = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    v_3a7d09(null);
    v_3c192b([]);
    v_024d7d(0);
    v_4bc1f9.current = 0;
    v_c260c5.current = 0;
    v_7c0eee(null);
    try {
      const v_3f4e2e = await v_d24cb4(v_2ca7e0);
      v_7c0eee({ id: v_3f4e2e.challengeId, shots: ["front", ...v_3f4e2e.steps] });
    } catch (v_9e86fd) {
      const v_c99bd2 = v_9e86fd instanceof v_84a859 ? v_9e86fd.code : "";
      if (v_c99bd2 === "FACE_DISABLED") {
        v_7b5712(); 
        return;
      }
      v_3a7d09(v_5a6d81(v_8d41d7, v_c99bd2));
    }
  }, [v_2ca7e0, v_7b5712, v_8d41d7]);
  v_c4deb2(() => {
    void v_fd0d55();

  }, []);

  const v_e6b3ef = v_de06a3(async () => {
    const v_375edd = v_1a165b.current;
    const v_e86ad8 = v_4bc1f9.current;
    if (!v_375edd || v_ab47d1.current || v_e86ad8 >= v_6ba760.current.length) return;
    v_ab47d1.current = true;
    try {
      const v_2a5a61 = await v_375edd.takePhoto({ flash: "off", enableShutterSound: false });
      const v_f5dbce = await v_3c288d.manipulateAsync(
        v_2a5a61.path.startsWith("file://") ? v_2a5a61.path : `file://${v_2a5a61.path}`,
        [{ resize: { width: 640 } }],
        { compress: 0.85, format: v_3c288d.SaveFormat.JPEG },
      );
      v_d49152.vibrate(v_e86ad8 >= v_6ba760.current.length - 1 ? [0, 120, 90, 260] : 120);
      v_1eef66(v_e1989a[v_7c0430[v_6ba760.current[v_e86ad8]].sfx]);
      v_a2349e.sequence([
        v_a2349e.timing(v_ac8592, { toValue: 0.5, duration: 70, useNativeDriver: true }),
        v_a2349e.timing(v_ac8592, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      v_3c192b((v_ba2215) => [...v_ba2215, v_f5dbce.uri]);
      v_4bc1f9.current = v_e86ad8 + 1;
      v_024d7d(v_e86ad8 + 1);
    } catch (v_9e86fd) {
      console.warn("[AccountFaceEnroll] takePhoto failed:", (v_9e86fd as Error).message);
    } finally {
      v_c260c5.current = 0;
      v_ab47d1.current = false;
    }
  }, [v_ac8592, v_1eef66, v_e1989a]);

  const v_88ac29 = v_df9f57(
    () =>
      v_d73d29.createRunOnJS((v_0b2889, v_c81315, v_e4ff5e) => {
        if (v_0b2889 !== 1) {
          v_807576(null);
          v_c260c5.current = 0;
          return;
        }
        v_807576({ yaw: v_c81315, pitch: v_e4ff5e });
        const v_e86ad8 = v_4bc1f9.current;
        const v_b24339 = v_6ba760.current[v_e86ad8];
        if (!v_b24339 || v_ab47d1.current) return;

        const v_ba2215 = v_e1fdd2.current;
        v_e1fdd2.current = { yaw: v_c81315, pitch: v_e4ff5e };
        const v_ef4e5b = !!v_ba2215 && (Math.abs(v_c81315 - v_ba2215.yaw) > 5 || Math.abs(v_e4ff5e - v_ba2215.pitch) > 5);
        if (!v_7c0430[v_b24339].check(v_c81315, v_e4ff5e) || v_ef4e5b) {
          v_c260c5.current = 0;
          return;
        }
        v_c260c5.current += 1;
        if (v_c260c5.current >= 3) void v_e6b3ef();
      }),
    [v_e6b3ef],
  );

  const v_ac8c13 = v_db5a6b("front");
  const { detectFaces: v_de4d76 } = v_ac8611(v_10f62f);
  const v_adbd66 = v_fc0657(0);
  const v_44c2eb = v_df9f57(() => require("rcmrninabrnb").Platform.OS === "android", []);
  const v_f001a7 = v_b08ef3(
    (v_143cb5) => {
      "worklet";
      const v_67e77e = v_a40fe8(v_143cb5.timestamp, v_44c2eb);
      if (v_67e77e - v_adbd66.value < 200) return;
      v_adbd66.value = v_67e77e;
      const v_a51d09 = v_de4d76(v_143cb5);
      const v_127e92 = v_e74bab(v_a51d09);
      if (v_127e92 == null) {
        v_88ac29(0, 0, 0);
        return;
      }
      const v_c81315 = (v_127e92 as unknown as { yawAngle?: number }).yawAngle ?? 0;
      const v_e4ff5e = (v_127e92 as unknown as { pitchAngle?: number }).pitchAngle ?? 0;
      v_88ac29(v_a51d09.length, v_c81315, v_e4ff5e);
    },
    [v_de4d76, v_adbd66, v_44c2eb, v_88ac29],
  );

  const v_c83285 = v_62f5a9?.shots.length ?? 0;
  const v_1e2ad6 = v_c83285 > 0 && v_db2e13.length >= v_c83285;
  v_c4deb2(() => {
    if (!v_1e2ad6 || v_cb66b4 || !v_62f5a9 || !v_2ca7e0) return;
    v_ee9ec1(true);
    void (async () => {
      try {
        await v_62d015(v_2ca7e0, v_62f5a9.id, v_db2e13, "login");
        setTimeout(() => v_1eef66(v_343670), 300);
        v_7b5712();
      } catch (v_9e86fd) {
        const v_c99bd2 = v_9e86fd instanceof v_84a859 ? v_9e86fd.code : "";
        console.warn("[AccountFaceEnroll] enroll failed:", v_c99bd2);
        v_3a7d09(v_5a6d81(v_8d41d7, v_c99bd2));
        v_7c0eee(null);
      } finally {
        v_ee9ec1(false);
      }
    })();

  }, [v_1e2ad6]);

  if (v_f9f059 === false) {
    return (
      <View style={[v_fd5f43.container, v_fd5f43.center, { paddingTop: v_033e14.top, paddingBottom: v_033e14.bottom }]}>
        <Text style={v_fd5f43.hint}>
          {v_8d41d7("accountFace.permission", { defaultValue: "얼굴 등록에 카메라 권한이 필요해요. 설정에서 카메라를 허용해 주세요." })}
        </Text>
      </View>
    );
  }
  if (v_f9f059 === null || !v_ac8c13) {
    return (
      <View style={[v_fd5f43.container, v_fd5f43.center]}>
        <ActivityIndicator color={v_1bfbd0.white} />
        <Text style={v_fd5f43.hint}>{v_8d41d7("faceEnroll.cameraLoading", { defaultValue: "카메라 준비 중..." })}</Text>
      </View>
    );
  }

  const v_b24339 = v_62f5a9?.shots[Math.min(v_85f251, Math.max(0, v_c83285 - 1))] ?? "front";
  const v_abf033 = v_7c0430[v_b24339];
  const v_5e2db7 = !v_cb66b4 && !v_5e9bfe;

  return (
    <View style={[v_fd5f43.container, { paddingTop: v_033e14.top + 24, paddingBottom: v_033e14.bottom }]}>
      <View style={v_fd5f43.header}>
        <Text style={v_fd5f43.title}>{v_8d41d7("accountFace.title", { defaultValue: "얼굴 등록" })}</Text>
        <Text style={v_fd5f43.subtitle}>
          {v_8d41d7("accountFace.subtitle", {
            defaultValue: "계정 보호를 위해 한 번만 얼굴을 등록해 주세요. 안내에 따라 고개를 돌리면 자동으로 찍혀요.",
          })}
        </Text>
      </View>

      {v_cb66b4 ? (
        <View style={v_fd5f43.centerBlock}>
          <ActivityIndicator size="large" color={v_1bfbd0.white} />
          <Text style={v_fd5f43.hint}>{v_8d41d7("faceEnroll.processing", { defaultValue: "얼굴 등록 중..." })}</Text>
        </View>
      ) : v_5e9bfe ? (
        <View style={v_fd5f43.centerBlock}>
          <Text style={v_fd5f43.errorText}>{v_5e9bfe}</Text>
          <TouchableOpacity style={v_fd5f43.primaryBtn} onPress={() => void v_fd0d55()}>
            <Text style={v_fd5f43.primaryBtnText}>{v_8d41d7("accountFace.retry", { defaultValue: "다시 찍기" })}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={v_fd5f43.centerBlock}>
          <View style={v_fd5f43.cameraBox}>
            <VisionCamera
              ref={v_1a165b}
              style={v_472849.absoluteFill}
              device={v_ac8c13}
              isActive={v_5e2db7}
              photo
              frameProcessor={v_62f5a9 ? v_f001a7 : undefined}
              pixelFormat="yuv"
            />
            <Svg width={v_fdd448} height={v_fdd448} style={v_472849.absoluteFill} pointerEvents="none">
              <Circle
                cx={v_fdd448 / 2} cy={v_fdd448 / 2} r={v_20d9ab}
                stroke="rgba(255,255,255,0.25)" strokeWidth={v_9edd6c} fill="none"
              />
              <Circle
                cx={v_fdd448 / 2} cy={v_fdd448 / 2} r={v_20d9ab}
                stroke="#22c55e" strokeWidth={v_9edd6c} fill="none" strokeLinecap="round"
                strokeDasharray={v_981f64}
                strokeDashoffset={v_981f64 * (1 - (v_c83285 ? Math.min(1, v_85f251 / v_c83285) : 0))}
                transform={`rotate(-90 ${v_fdd448 / 2} ${v_fdd448 / 2})`}
              />
            </Svg>
          </View>
          {v_62f5a9 ? (
            <View style={v_fd5f43.stepBox}>
              <Text style={v_fd5f43.stepLabel}>{v_8d41d7(v_abf033.labelKey, { defaultValue: v_abf033.label })}</Text>
              <Text style={v_fd5f43.stepHint}>{v_8d41d7(v_abf033.hintKey, { defaultValue: v_abf033.hint })}</Text>
              <Text style={[v_fd5f43.stepHint, { marginTop: 4, opacity: 0.7 }]}>
                {v_26803c
                  ? v_abf033.check(v_26803c.yaw, v_26803c.pitch)
                    ? v_8d41d7("faceEnroll.step.perfect", { defaultValue: "완벽!" })
                    : v_8d41d7(v_abf033.hintKey, { defaultValue: v_abf033.hint })
                  : v_8d41d7("faceEnroll.hintStart", { defaultValue: "얼굴이 카메라에 잘 보이도록 해주세요" })}
              </Text>
            </View>
          ) : (
            <ActivityIndicator color={v_1bfbd0.white} />
          )}
        </View>
      )}

      <Text style={v_fd5f43.privacyNote}>
        {v_8d41d7("accountFace.privacyNote", {
          defaultValue: "정면 사진 1장은 암호화해 보관하고, 같은 사람의 중복 가입 확인에만 써요.",
        })}
      </Text>

      <Animated.View pointerEvents="none" style={[v_fd5f43.flash, { opacity: v_ac8592 }]} />
    </View>
  );
}

const v_fdd448 = 260;
const v_9edd6c = 6;
const v_20d9ab = (v_fdd448 - v_9edd6c) / 2;
const v_981f64 = 2 * Math.PI * v_20d9ab;

const v_fd5f43 = v_472849.create({
  container: { flex: 1, backgroundColor: v_1bfbd0.zinc950, paddingHorizontal: 20 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  header: { alignItems: "center", gap: 6, marginBottom: 8 },
  title: { color: v_1bfbd0.white, fontSize: 22, fontWeight: "700" },
  subtitle: { color: v_1bfbd0.zinc300, fontSize: 13, textAlign: "center", lineHeight: 19 },
  centerBlock: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  cameraBox: {
    width: v_fdd448,
    height: v_fdd448,
    borderRadius: v_fdd448 / 2,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: v_1bfbd0.zinc900,
  },
  stepBox: { alignItems: "center", gap: 4 },
  stepLabel: { color: v_1bfbd0.white, fontSize: 18, fontWeight: "700" },
  stepHint: { color: v_1bfbd0.zinc300, fontSize: 13 },
  hint: { color: v_1bfbd0.zinc300, fontSize: 14, textAlign: "center" },
  errorText: { color: v_1bfbd0.zinc200, fontSize: 15, textAlign: "center", lineHeight: 22, paddingHorizontal: 12 },
  primaryBtn: {
    alignSelf: "stretch",
    backgroundColor: v_1bfbd0.white,
    paddingVertical: 14,
    borderRadius: v_8b0c90.full,
    alignItems: "center",
  },
  primaryBtnText: { color: v_1bfbd0.zinc900, fontSize: 16, fontWeight: "700" },
  privacyNote: {
    color: v_1bfbd0.zinc400,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  flash: { ...v_472849.absoluteFillObject, backgroundColor: v_1bfbd0.white },
});

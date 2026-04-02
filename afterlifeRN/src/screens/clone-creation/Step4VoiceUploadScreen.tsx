import v_a3453e, { v_5ab095, v_c4deb2, v_e662ae } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_a2349e,
  v_03e392,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import * as v_c95b2c from "gketqwckyalygtuqsawm";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step4">;
};

const v_e79da6 = [
  { id: "v1", name: "Nova", desc: "따뜻하고 부드러운" },
  { id: "v2", name: "Ursa", desc: "차분하고 깊은" },
  { id: "v3", name: "Vega", desc: "밝고 활기찬" },
  { id: "v4", name: "Orion", desc: "신뢰감 있는" },
  { id: "v5", name: "Luna", desc: "감성적인" },
  { id: "v6", name: "Stella", desc: "편안한" },
];

export default function v_710783({ navigation: v_c65f5d }: Props) {
  const [v_492e86, v_6abc74] = v_5ab095<string | null>(null);
  const [v_97c26f, v_6c526d] = v_5ab095(false);
  const [v_dcf6a6, v_039630] = v_5ab095(0);
  const [v_de530d, v_e48702] = v_5ab095<string | null>(null);
  const [v_e9dd22, v_f94cec] = v_5ab095(false);
  const v_d6a6a6 = v_e662ae(new v_a2349e.Value(1)).current;

  v_c4deb2(() => {
    let v_ad1d65;
    if (v_97c26f) {
      v_ad1d65 = setInterval(() => {
        v_039630((v_8d41d7) => {
          if (v_8d41d7 >= 15) {
            v_6c526d(false);
            return v_8d41d7;
          }
          return v_8d41d7 + 1;
        });
      }, 1000);
      v_a2349e.loop(
        v_a2349e.sequence([
          v_a2349e.timing(v_d6a6a6, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          v_a2349e.timing(v_d6a6a6, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      v_d6a6a6.setValue(1);
    }
    return () => clearInterval(v_ad1d65);
  }, [v_97c26f]);

  const v_94e00b = async () => {
    try {
      const v_43c42e = await v_c95b2c.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!v_43c42e.canceled && v_43c42e.assets?.[0]) {
        v_e48702(v_43c42e.assets[0].name);
        v_039630(0);
        v_6c526d(false);
      }
    } catch {
      v_03e392.alert("오류", "파일을 선택할 수 없습니다.");
    }
  };

  const v_947620 = v_dcf6a6 >= 10 || v_de530d;

  const v_420661 = () => {
    v_c65f5d.navigate("Step5");
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="음성 설정"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        stepInfo={{ current: 4, total: 7 }}
      />
      <StepIndicator currentStep={4} totalSteps={7} />

      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        showsVerticalScrollIndicator={false}
        showBottomBackground={false}
        autoAdjustKeyboardPadding={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={v_d81136.container}>
          {!v_e9dd22 ? (
            <>
              <Text style={v_d81136.sectionTitle}>음성 샘플 선택</Text>
              {v_e79da6.map((v_b74951) => (
                <TouchableOpacity
                  key={v_b74951.id}
                  style={[v_d81136.voiceCard, v_492e86 === v_b74951.id && v_d81136.voiceCardActive]}
                  onPress={() => { v_6abc74(v_b74951.id); v_e48702(null); v_039630(0); }}
                  activeOpacity={0.7}
                >
                  <View style={v_d81136.voiceIcon}>
                    <Feather
                      name={v_492e86 === v_b74951.id ? "pause-circle" : "play-circle"}
                      size={28}
                      color={v_492e86 === v_b74951.id ? v_1bfbd0.violet500 : v_1bfbd0.zinc400}
                    />
                  </View>
                  <View style={v_d81136.voiceInfo}>
                    <Text style={v_d81136.voiceName}>{v_b74951.name}</Text>
                    <Text style={v_d81136.voiceDesc}>{v_b74951.desc}</Text>
                  </View>
                  {v_492e86 === v_b74951.id && (
                    <Feather name="check-circle" size={22} color={v_1bfbd0.violet500} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => { v_f94cec(true); v_6abc74(null); }}
                style={v_d81136.customToggle}
                activeOpacity={0.7}
              >
                <Feather name="upload" size={20} color={v_1bfbd0.violet500} />
                <Text style={v_d81136.customToggleText}>직접 오디오 업로드</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={v_d81136.sectionTitle}>음성 녹음 / 업로드</Text>
              <Text style={v_d81136.hint}>녹음하거나 오디오 파일을 업로드해주세요</Text>

              {}
              <View style={v_d81136.recordBox}>
                <Text style={v_d81136.recordBoxTitle}>녹음하기</Text>
                <Text style={v_d81136.recordScript}>
                  "안녕하세요, 저는 당신의 소중한 사람입니다. 오늘도 좋은 하루 보내세요."
                </Text>
                <Text style={v_d81136.recordHint}>10~15초 분량으로 녹음해주세요</Text>
              </View>

              <View style={v_d81136.recordCenter}>
                <Animated.View style={[v_d81136.pulseRing, { transform: [{ scale: v_d6a6a6 }] }]}>
                  <TouchableOpacity
                    onPress={() => {
                      if (v_97c26f) {
                        v_6c526d(false);
                      } else {
                        v_039630(0);
                        v_e48702(null);
                        v_6c526d(true);
                      }
                    }}
                    style={[v_d81136.recordButton, v_97c26f && v_d81136.recordButtonActive]}
                    activeOpacity={0.8}
                  >
                    <Feather name={v_97c26f ? "square" : "mic"} size={32} color={v_1bfbd0.white} />
                  </TouchableOpacity>
                </Animated.View>
                <Text style={v_d81136.timerText}>
                  {v_97c26f
                    ? `녹음 중 ${v_dcf6a6}s / 15s`
                    : v_dcf6a6 > 0
                    ? `${v_dcf6a6}초 녹음 완료`
                    : "탭하여 녹음 시작"}
                </Text>
              </View>

              {}
              <View style={v_d81136.orDivider}>
                <View style={v_d81136.orLine} />
                <Text style={v_d81136.orText}>또는</Text>
                <View style={v_d81136.orLine} />
              </View>

              {}
              <TouchableOpacity onPress={v_94e00b} style={v_d81136.uploadBox} activeOpacity={0.7}>
                <Feather name="upload-cloud" size={32} color={v_de530d ? v_1bfbd0.violet500 : v_1bfbd0.zinc400} />
                {v_de530d ? (
                  <View style={v_d81136.uploadedInfo}>
                    <Text style={v_d81136.uploadedName} numberOfLines={1}>{v_de530d}</Text>
                    <Text style={v_d81136.uploadedStatus}>업로드 완료</Text>
                  </View>
                ) : (
                  <Text style={v_d81136.uploadText}>오디오 파일 선택</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { v_f94cec(false); v_039630(0); v_6c526d(false); v_e48702(null); }}
                style={v_d81136.backToSamples}
              >
                <Text style={v_d81136.backToSamplesText}>샘플 목록으로 돌아가기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeScrollView>

      <View style={v_d81136.bottomBar}>
        <Button
          title="다음 단계로 이동"
          onPress={v_420661}
          disabled={!v_492e86 && !v_947620}
        />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { flexGrow: 1, paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.xlarge },
  container: { width: "100%", maxWidth: 780, gap: v_9b1a04.medium },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  hint: { fontSize: 13, color: v_1bfbd0.zinc500 },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    gap: 12,
  },
  voiceCardActive: { borderColor: v_1bfbd0.violet500, backgroundColor: v_1bfbd0.violet100 },
  voiceIcon: { width: 36, alignItems: "center" },
  voiceInfo: { flex: 1 },
  voiceName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  voiceDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  customToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.violet500,
    borderStyle: "dashed",
  },
  customToggleText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.violet500 },
  recordBox: {
    padding: 16,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    gap: 6,
  },
  recordBoxTitle: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  recordScript: { fontSize: 14, color: v_1bfbd0.zinc700, lineHeight: 22, fontStyle: "italic" },
  recordHint: { fontSize: 12, color: v_1bfbd0.zinc400 },
  recordCenter: { alignItems: "center", gap: 16, paddingVertical: v_9b1a04.medium },
  pulseRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(139,92,246,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: v_1bfbd0.violet500,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonActive: { backgroundColor: v_1bfbd0.error },
  timerText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc600 },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  orLine: { flex: 1, height: 1, backgroundColor: v_1bfbd0.zinc200 },
  orText: { marginHorizontal: v_9b1a04.medium, color: v_1bfbd0.zinc400, fontSize: 13 },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderStyle: "dashed",
    backgroundColor: v_1bfbd0.zinc50,
  },
  uploadText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc500 },
  uploadedInfo: { flex: 1, gap: 2 },
  uploadedName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  uploadedStatus: { fontSize: 12, color: v_1bfbd0.violet500, fontWeight: "500" },
  backToSamples: { alignItems: "center", paddingVertical: 12 },
  backToSamplesText: { fontSize: 14, color: v_1bfbd0.zinc500, textDecorationLine: "underline" },
  bottomBar: { paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.medium, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc200 },
});

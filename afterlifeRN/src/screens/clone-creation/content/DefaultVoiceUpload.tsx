

import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_03e392, v_472849 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import * as v_c95b2c from "gketqwckyalygtuqsawm";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_c2a674 } from "../../../types/clone";
import { v_1bfbd0, v_8b0c90 } from "../../../components/constants";

export const v_e79da6 = [
  { id: "v1", name: "Nova" },
  { id: "v2", name: "Ursa" },
  { id: "v3", name: "Vega" },
  { id: "v4", name: "Orion" },
  { id: "v5", name: "Luna" },
  { id: "v6", name: "Stella" },
] as const;

const v_58b6a9 = [
  {
    id: "s1",
    title: "일상 인사",
    text:
      "안녕하세요. 오늘은 정말 좋은 하루였어요. 햇살이 따뜻하고 바람도 부드러워서 " +
      "산책하기에 딱 좋았답니다. 이렇게 평화로운 시간이 정말 소중하게 느껴져요. " +
      "오늘 하루도 즐겁게 잘 보내세요.",
  },
  {
    id: "s2",
    title: "음식 이야기",
    text:
      "요즘 가장 좋아하는 음식이 뭐예요? 저는 김치찌개를 정말 좋아해요. 매운 맛이 " +
      "진하고 따끈한 국물을 한 숟갈 떠먹으면 하루의 피로가 싹 풀리는 기분이거든요. " +
      "특히 비 오는 날에 먹으면 더 맛있어요.",
  },
  {
    id: "s3",
    title: "추억 회상",
    text:
      "어릴 적 추억 중에 가장 기억에 남는 건 가족과 함께 갔던 바다 여행이에요. 파도 " +
      "소리와 짭조름한 바람, 그리고 모래사장에서 뛰놀던 그 순간들이 아직도 생생해요. " +
      "그때 행복했던 기분이 다시 떠올라요.",
  },
] as const;

type Mode = "preset" | "record" | "upload";

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

async function v_467998(
  v_b187d9,
  v_b5cd35,
  v_976e82,
) {
  try {
    const v_cb35cb = await v_c95b2c.getDocumentAsync({ type: "audio/*" });
    if (!v_cb35cb.canceled && v_cb35cb.assets[0]) {
      v_b187d9({ voiceFile: v_cb35cb.assets[0].uri, voiceSampleId: undefined });
    }
  } catch {
    v_03e392.alert(v_b5cd35, v_976e82);
  }
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();

  const v_2ba26d = v_f04727.voiceFile ? "upload" : "preset";
  const [v_34e5bb, v_038d7f] = v_5ab095<Mode>(v_2ba26d);
  const [v_0c0b03, v_c98f46] = v_5ab095<string | null>(null);

  const v_69341a = (v_a448ad) => {
    if (v_a448ad === v_34e5bb) return;
    v_038d7f(v_a448ad);
    v_b187d9({ voiceSampleId: undefined, voiceFile: undefined, recordDuration: undefined });
    v_c98f46(null);
  };

  const v_c93629 = () => {

    v_03e392.alert(
      "준비 중",
      "녹음 기능은 곧 제공돼요. 지금은 [음성 선택] 또는 [파일 업로드] 를 이용해주세요.",
    );
  };

  return (
    <View style={v_d81136.wrap}>
      {}
      <View style={v_d81136.modeRow}>
        {(["preset", "record", "upload"] as const).map((v_35f85c) => {
          const v_e0187d = {
            preset: "음성 선택",
            record: "직접 녹음",
            upload: "파일 업로드",
          };
          const v_f8b770 = v_34e5bb === v_35f85c;
          return (
            <TouchableOpacity
              key={v_35f85c}
              style={[v_d81136.modeBtn, v_f8b770 && v_d81136.modeBtnActive]}
              onPress={() => v_69341a(v_35f85c)}
            >
              <Text style={[v_d81136.modeText, v_f8b770 && v_d81136.modeTextActive]}>
                {v_e0187d[v_35f85c]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      {v_34e5bb === "preset" && (
        <View style={v_d81136.grid}>
          {v_e79da6.map((v_81e2ef) => {
            const v_f8b770 = v_f04727.voiceSampleId === v_81e2ef.id;
            return (
              <TouchableOpacity
                key={v_81e2ef.id}
                style={[v_d81136.card, v_f8b770 && v_d81136.cardActive]}
                onPress={() =>
                  v_b187d9({ voiceSampleId: v_81e2ef.id, voiceFile: undefined, recordDuration: undefined })
                }
              >
                <Text style={v_d81136.cardName}>{v_81e2ef.name}</Text>
                <Text style={v_d81136.cardDesc}>{v_8d41d7(`create.voice.sample.${v_81e2ef.name}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {}
      {v_34e5bb === "record" && (
        <View style={{ gap: 12 }}>
          <Text style={v_d81136.scriptHint}>
            아래 3개 중 하나를 골라 자연스럽게 읽어주세요. (약 30초)
          </Text>
          {v_58b6a9.map((v_fd5f43) => {
            const v_f8b770 = v_0c0b03 === v_fd5f43.id;
            return (
              <TouchableOpacity
                key={v_fd5f43.id}
                style={[v_d81136.scriptCard, v_f8b770 && v_d81136.scriptCardActive]}
                onPress={() => v_c98f46(v_fd5f43.id)}
              >
                <Text style={v_d81136.scriptTitle}>{v_fd5f43.title}</Text>
                <Text style={v_d81136.scriptText}>{v_fd5f43.text}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[v_d81136.recordBtn, !v_0c0b03 && v_d81136.recordBtnDisabled]}
            onPress={v_c93629}
            disabled={!v_0c0b03}
            activeOpacity={0.85}
          >
            <View style={v_d81136.recordDot} />
            <Text style={v_d81136.recordBtnText}>녹음 시작</Text>
          </TouchableOpacity>
          <Text style={v_d81136.disabledNote}>
            * 녹음 기능은 준비 중이에요 — 임시로 [음성 선택] 또는 [파일 업로드] 를 사용해주세요.
          </Text>
        </View>
      )}

      {}
      {v_34e5bb === "upload" && (
        <TouchableOpacity
          style={v_d81136.upload}
          onPress={() => v_467998(v_b187d9, v_8d41d7("common.error"), v_8d41d7("create.voice.fileError"))}
        >
          <Feather name="upload" size={20} color={v_1bfbd0.violet600} />
          <Text style={v_d81136.uploadText}>
            {v_f04727.voiceFile
              ? v_8d41d7("create.voice.uploadedFile")
              : v_8d41d7("create.voice.uploadFile")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean =>
  Boolean(v_d5dda0.voiceSampleId || v_d5dda0.voiceFile);

const v_872645 = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_872645;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },

  modeRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: v_1bfbd0.zinc100,
    padding: 4,
    borderRadius: v_8b0c90.lg,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: v_1bfbd0.white },
  modeText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc500 },
  modeTextActive: { color: v_1bfbd0.zinc900, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    width: "48%",
    padding: 12,
    borderRadius: v_8b0c90.sm,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  cardActive: { borderColor: v_1bfbd0.violet600, backgroundColor: v_1bfbd0.violet100 },
  cardName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc800 },
  cardDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  scriptHint: { fontSize: 13, color: v_1bfbd0.zinc600, marginBottom: 4 },
  scriptCard: {
    padding: 14,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  scriptCardActive: { borderColor: v_1bfbd0.violet600, backgroundColor: v_1bfbd0.violet100 },
  scriptTitle: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 6 },
  scriptText: { fontSize: 14, lineHeight: 22, color: v_1bfbd0.zinc700 },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.error,
    marginTop: 4,
  },
  recordBtnDisabled: { opacity: 0.4 },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: v_1bfbd0.white },
  recordBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
  disabledNote: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    marginTop: 4,
  },

  upload: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.violet200,
  },
  uploadText: { color: v_1bfbd0.violet700 },
});

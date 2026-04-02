import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import v_e775af from "../../components/ui/TextField";
import { v_194498 } from "../../stores/cloneStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step2">;
};

const v_d3f452 = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
const v_e4c4d3 = ["남성", "여성", "기타"];
const v_107792 = ["따뜻한", "유머러스", "차분한", "열정적", "지적인", "감성적", "낙천적", "신중한"];
const v_7e15fa = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];

export default function v_afe4c8({ navigation: v_c65f5d }: Props) {
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);

  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_f83808, v_64a312] = v_5ab095("");
  const [v_c3eac4, v_bdc43c] = v_5ab095("");
  const [v_6f7bef, v_7034b6] = v_5ab095<string[]>([]);
  const [v_42f66e, v_40239f] = v_5ab095("");
  const [v_6856a9, v_b7e174] = v_5ab095("");

  const v_ef6769 = (v_e2a85c) => {
    v_7034b6((v_ba2215) =>
      v_ba2215.includes(v_e2a85c) ? v_ba2215.filter((v_62c214) => v_62c214 !== v_e2a85c) : [...v_ba2215, v_e2a85c]
    );
  };

  const v_a71df8 = v_1833e7.trim() && v_f83808 && v_c3eac4;

  const v_420661 = () => {
    v_5795de({ name: v_1833e7, description: v_6856a9 });
    v_c65f5d.navigate("Step3");
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="기본 정보"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        stepInfo={{ current: 2, total: 7 }}
      />
      <StepIndicator currentStep={2} totalSteps={7} />

      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        showsVerticalScrollIndicator={false}
        showBottomBackground={false}
        autoAdjustKeyboardPadding={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={v_d81136.container}>
          {}
          <TextField placeholder="페르소나 이름" value={v_1833e7} onChangeText={v_318f24} />

          {}
          <Text style={v_d81136.label}>나이대</Text>
          <View style={v_d81136.chipRow}>
            {v_d3f452.map((v_779914) => (
              <TouchableOpacity
                key={v_779914}
                style={[v_d81136.chip, v_f83808 === v_779914 && v_d81136.chipActive]}
                onPress={() => v_64a312(v_779914)}
              >
                <Text style={[v_d81136.chipText, v_f83808 === v_779914 && v_d81136.chipTextActive]}>{v_779914}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={v_d81136.label}>성별</Text>
          <View style={v_d81136.chipRow}>
            {v_e4c4d3.map((v_206b88) => (
              <TouchableOpacity
                key={v_206b88}
                style={[v_d81136.chip, v_c3eac4 === v_206b88 && v_d81136.chipActive]}
                onPress={() => v_bdc43c(v_206b88)}
              >
                <Text style={[v_d81136.chipText, v_c3eac4 === v_206b88 && v_d81136.chipTextActive]}>{v_206b88}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={v_d81136.label}>성격 유형 (복수 선택)</Text>
          <View style={v_d81136.chipRow}>
            {v_107792.map((v_e2a85c) => (
              <TouchableOpacity
                key={v_e2a85c}
                style={[v_d81136.chip, v_6f7bef.includes(v_e2a85c) && v_d81136.chipActive]}
                onPress={() => v_ef6769(v_e2a85c)}
              >
                <Text style={[v_d81136.chipText, v_6f7bef.includes(v_e2a85c) && v_d81136.chipTextActive]}>{v_e2a85c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={v_d81136.label}>MBTI (선택)</Text>
          <View style={v_d81136.mbtiGrid}>
            {v_7e15fa.map((v_35f85c) => (
              <TouchableOpacity
                key={v_35f85c}
                style={[v_d81136.mbtiItem, v_42f66e === v_35f85c && v_d81136.mbtiItemActive]}
                onPress={() => v_40239f(v_42f66e === v_35f85c ? "" : v_35f85c)}
              >
                <Text style={[v_d81136.mbtiText, v_42f66e === v_35f85c && v_d81136.mbtiTextActive]}>{v_35f85c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={v_d81136.label}>페르소나 소개</Text>
          <TextField
            value={v_6856a9}
            onChangeText={v_b7e174}
            placeholder="이 페르소나는 어떤 사람인가요?"
            placeholderTextColor={v_1bfbd0.zinc400}
            rounded={v_8b0c90.lg}
            multiline
            scrollEnabled
            numberOfLines={4}
            inputWrapperStyle={v_d81136.textareaWrapper}
            style={v_d81136.textareaInput}
          />
        </View>
      </SafeScrollView>

      <View style={v_d81136.bottomBar}>
        <Button title="다음 단계로 이동" onPress={v_420661} disabled={!v_a71df8} />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { flexGrow: 1, paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.xlarge },
  container: { width: "100%", maxWidth: 780, gap: v_9b1a04.large },
  label: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  chipActive: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  chipText: { fontSize: 13, color: v_1bfbd0.zinc700 },
  chipTextActive: { color: v_1bfbd0.white, fontWeight: "600" },
  mbtiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mbtiItem: {
    width: "22%",
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
  },
  mbtiItemActive: { backgroundColor: v_1bfbd0.violet500, borderColor: v_1bfbd0.violet500 },
  mbtiText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc600 },
  mbtiTextActive: { color: v_1bfbd0.white },
  textareaWrapper: {
    minHeight: 140,
    borderColor: v_1bfbd0.zinc200,
    marginBottom: v_9b1a04.xlarge,
  },
  textareaInput: {
    minHeight: 96,
    fontSize: 15,
    color: v_1bfbd0.zinc900,
  },
  bottomBar: { paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.medium, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc200 },
});

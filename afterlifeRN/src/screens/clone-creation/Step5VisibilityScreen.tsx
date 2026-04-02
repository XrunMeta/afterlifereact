import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849 } from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import { v_194498 } from "../../stores/cloneStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step5">;
};

const v_95825a = [
  { value: "public", icon: "globe", title: "전체 공개", desc: "모든 사용자가 이 페르소나를 볼 수 있습니다" },
  { value: "followers", icon: "users", title: "팔로워 공개", desc: "나를 팔로우한 사용자만 볼 수 있습니다" },
  { value: "private", icon: "lock", title: "비공개", desc: "나만 볼 수 있습니다" },
];

export default function v_f275b6({ navigation: v_c65f5d }: Props) {
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);
  const [v_818579, v_2cf16e] = v_5ab095<"public" | "followers" | "private">("public");

  const v_420661 = () => {
    v_5795de({ visibility: v_818579 });
    v_c65f5d.navigate("Step6");
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="공개 범위"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        stepInfo={{ current: 5, total: 7 }}
      />
      <StepIndicator currentStep={5} totalSteps={7} />

      <SafeScrollView contentContainerStyle={v_d81136.content} showsVerticalScrollIndicator={false} showBottomBackground={false}>
        <View style={v_d81136.container}>
          <Text style={v_d81136.sectionTitle}>누구에게 공개할까요?</Text>
          <Text style={v_d81136.subtitle}>나중에 언제든 변경할 수 있습니다</Text>

          {v_95825a.map((v_68b2be) => (
            <TouchableOpacity
              key={v_68b2be.value}
              style={[v_d81136.optionCard, v_818579 === v_68b2be.value && v_d81136.optionCardActive]}
              onPress={() => v_2cf16e(v_68b2be.value)}
              activeOpacity={0.7}
            >
              <View style={[v_d81136.iconBox, v_818579 === v_68b2be.value && v_d81136.iconBoxActive]}>
                <Feather
                  name={v_68b2be.icon as any}
                  size={24}
                  color={v_818579 === v_68b2be.value ? v_1bfbd0.white : v_1bfbd0.zinc500}
                />
              </View>
              <View style={v_d81136.optionInfo}>
                <Text style={[v_d81136.optionTitle, v_818579 === v_68b2be.value && v_d81136.optionTitleActive]}>
                  {v_68b2be.title}
                </Text>
                <Text style={v_d81136.optionDesc}>{v_68b2be.desc}</Text>
              </View>
              <View style={[v_d81136.radio, v_818579 === v_68b2be.value && v_d81136.radioActive]}>
                {v_818579 === v_68b2be.value && <View style={v_d81136.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeScrollView>

      <View style={v_d81136.bottomBar}>
        <Button title="다음 단계로 이동" onPress={v_420661} />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { flexGrow: 1, paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.xlarge },
  container: { width: "100%", maxWidth: 780, gap: v_9b1a04.medium },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  subtitle: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: -4 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    gap: 14,
  },
  optionCardActive: { borderColor: v_1bfbd0.violet500, backgroundColor: v_1bfbd0.violet100 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: { backgroundColor: v_1bfbd0.violet500 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  optionTitleActive: { color: v_1bfbd0.violet600 },
  optionDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc300,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: v_1bfbd0.violet500 },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: v_1bfbd0.violet500 },
  bottomBar: { paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.medium, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc200 },
});

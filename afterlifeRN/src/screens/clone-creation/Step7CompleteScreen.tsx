import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_650cfa, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5, v_8ad91b } from "../../navigation/types";
import type { v_affcc0, v_c2a674 } from "../../types/clone";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import { v_194498 } from "../../stores/cloneStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_6e79a1 } from "../../mocks/interestHelpers";

const v_a81cbf =
  "https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400&h=400&fit=crop";

function v_1c447f(draft: v_c2a674, v_389afb): v_affcc0 {
  const v_1833e7 = v_f04727.name?.trim() || "새 페르소나";
  const v_3baa99 =
    v_6e79a1.find((v_3f4e2e) => v_3f4e2e.id === v_f04727.category)?.label ?? "일상 및 감정 케어";
  const v_48a672 = v_f04727.imageUri?.trim() || v_a81cbf;
  return {
    id: v_389afb,
    name: v_1833e7,
    username: `@${v_1833e7.replace(/\s+/g, "_").slice(0, 16)}_${v_389afb.slice(-4)}`,
    avatarUrl: v_48a672,
    coverImageUrl: v_48a672,
    type: "멤로우",
    category: v_3baa99,
    interests: v_f04727.interests?.length ? v_f04727.interests : ["일상 대화"],
    description: v_f04727.description?.trim() ?? "",
    visibility: v_f04727.visibility ?? "private",
    learningProgress: 0,
    createdBy: "user-1",
    createdAt: new Date().toISOString(),
  };
}

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step7">;
};

const v_1fc273 = [
  {
    icon: "refresh-cw",
    title: "자동 학습",
    desc: "대화를 나눌수록 페르소나가 더 똑똑해져요",
  },
  {
    icon: "shield",
    title: "데이터 보안",
    desc: "모든 데이터는 안전하게 암호화되어 보호됩니다",
  },
];

export default function v_448ad1({ navigation: v_c65f5d }: Props) {
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();

  const v_ee340e = (): string => {
    const v_389afb = `clone-${Date.now()}`;
    const { creationDraft: v_9d4877, addClone: v_956393, resetCreationDraft: v_7a77e1 } = v_194498.getState();
    v_956393(v_1c447f(v_9d4877, v_389afb));
    v_7a77e1();
    return v_389afb;
  };

  const v_791884 = () => {
    const v_389afb = v_ee340e();
    v_f4c991.navigate("Chat", { cloneId: v_389afb });
  };

  const v_704242 = () => {
    v_ee340e();
    v_c65f5d.getParent()?.dispatch(
      v_650cfa.navigate({ name: "ClonesTab" })
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="생성 완료" stepInfo={{ current: 7, total: 7 }} />
      <StepIndicator currentStep={7} totalSteps={7} />

      <SafeScrollView contentContainerStyle={v_d81136.content} showsVerticalScrollIndicator={false} showBottomBackground={false}>
        <View style={v_d81136.container}>
          {}
          <View style={v_d81136.successCircle}>
            <Feather name="check" size={48} color={v_1bfbd0.white} />
          </View>

          <Text style={v_d81136.title}>페르소나가 생성되었어요!</Text>
          <Text style={v_d81136.subtitle}>
            이제 대화를 시작하여 페르소나를 더 성장시켜보세요
          </Text>

          {}
          {v_1fc273.map((v_95a1b5, v_ebec57) => (
            <View key={v_ebec57} style={v_d81136.featureCard}>
              <View style={v_d81136.featureIconBox}>
                <Feather name={v_95a1b5.icon as any} size={22} color={v_1bfbd0.violet500} />
              </View>
              <View style={v_d81136.featureInfo}>
                <Text style={v_d81136.featureTitle}>{v_95a1b5.title}</Text>
                <Text style={v_d81136.featureDesc}>{v_95a1b5.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </SafeScrollView>

      {}
      <View style={v_d81136.bottomBar}>
        <Button title="첫 대화 시작하기" onPress={v_791884} variant="accent" leftIcon={<Feather name="message-circle" size={20} color={v_1bfbd0.white} />} />
        <Button title="나의 페르소나로 돌아가기" onPress={v_704242} variant="ghost" />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.xxxlarge,
  },
  container: { width: "100%", maxWidth: 780, alignItems: "center", gap: v_9b1a04.large },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: v_1bfbd0.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "bold", color: v_1bfbd0.zinc900 },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
  featureCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  featureDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  bottomBar: {
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.medium,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
  },
});

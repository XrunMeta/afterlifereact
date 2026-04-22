import v_a3453e, { v_c4deb2 } from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_affcc0 } from "../../types/clone";
import { v_c4c43f } from "../../mocks/cloneTypeCatalog";

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

const v_549a47 = {
  memlow: { title: '추억을 이어가요',     sub: '편지가 도착했을 때 함께 읽어봐요.' },
  friend: { title: '친구가 준비됐어요',   sub: '첫 대화를 시작해 볼까요?' },
  mentor: { title: '멘토가 준비됐어요',   sub: '분야별 질문을 남겨 보세요.' },
  celeb:  { title: '팬클럽이 시작됐어요', sub: '첫 메시지를 남겨 보세요.' },
};

export default function v_448ad1({ navigation: v_c65f5d }: Props) {
  const v_7a77e1 = v_194498((v_fd5f43) => v_fd5f43.resetCreationDraft);
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_956393 = v_194498((v_fd5f43) => v_fd5f43.addClone);
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? "user-001";

  v_c4deb2(() => {
    if (!v_f04727.cloneType) return;
    const v_01a739 = Boolean(v_f04727.imageFile);
    const v_f9c770 = Boolean(v_f04727.voiceFile || v_f04727.voiceSampleId
      || (v_f04727.recordDuration ?? 0) >= 30);
    const clone: v_affcc0 = {
      id: `clone-${Date.now()}`,
      cloneType: v_f04727.cloneType,
      ownerUserId: v_493eec,
      displayName: v_f04727.name ?? '',
      description: v_f04727.description ?? '',
      interests: v_f04727.interests ?? [],
      imageUrl: v_f04727.imageFile ?? undefined,
      visibility: v_f04727.visibility ?? v_c4c43f(v_f04727.cloneType).defaultVisibility,
      status: v_01a739 && v_f9c770 ? 'active' : 'pending_assets',
      createdAt: new Date().toISOString(),
    };
    v_956393(v_eb25ce);
  }, []); 

  const v_b38746 = v_549a47[v_f04727.cloneType ?? 'friend'];

  const v_791884 = () => {
    v_7a77e1();

    v_c65f5d.getParent()?.dispatch(
      v_650cfa.navigate({ name: "ClonesTab" })
    );
  };

  const v_704242 = () => {
    v_7a77e1();
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

          <Text style={v_d81136.title}>{v_b38746.title}</Text>
          <Text style={v_d81136.subtitle}>{v_b38746.sub}</Text>

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

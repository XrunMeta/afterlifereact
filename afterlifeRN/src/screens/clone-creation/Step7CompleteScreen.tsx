import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_39a996, v_03e392 } from "rcmrninabrnb";
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
import { v_39eaf5, v_b55477 } from "../../api/clones";
import { v_84a859 } from "../../api/auth";

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
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? 1;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_af4871, v_67122d] = v_5ab095<number | null>(null);
  const [v_805753, v_c7169b] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (!v_f04727.cloneType) return;
    let v_2008a4 = false;
    (async () => {
      v_c7169b(true);
      v_3a7d09(null);

      const v_01a739 = Boolean(v_f04727.imageFile);
      const v_f9c770 = Boolean(v_f04727.voiceFile || v_f04727.voiceSampleId
        || (v_f04727.recordDuration ?? 0) >= 30);
      const v_818579 = v_f04727.visibility ?? v_c4c43f(v_f04727.cloneType!).defaultVisibility;

      if (!v_2ca7e0) {
        const v_17d8be = Date.now();
        const clone: v_affcc0 = {
          id: v_17d8be,
          cloneType: v_f04727.cloneType!,
          ownerId: v_493eec,
          displayName: v_f04727.name ?? '',
          description: v_f04727.description ?? '',
          interests: v_f04727.interests ?? [],
          imageUrl: v_f04727.imageFile ?? undefined,
          visibility: v_818579,
          status: v_01a739 && v_f9c770 ? 'active' : 'pending_assets',
          createdAt: new Date().toISOString(),
        };
        v_956393(v_eb25ce);
        if (!v_2008a4) {
          v_67122d(v_17d8be);
          v_c7169b(false);
        }
        return;
      }

      try {
        const v_556427 = v_f04727.username?.trim() || v_b55477(v_f04727.name ?? '');
        const v_28eeb6 = await v_39eaf5(v_2ca7e0, {
          clone_type: v_f04727.cloneType!,
          name: v_f04727.name ?? 'Untitled',
          username: v_556427,
          description: v_f04727.description || undefined,
          visibility: v_818579,
          interests: v_f04727.interests && v_f04727.interests.length > 0 ? v_f04727.interests : undefined,

          l1_profile: {
            attrs: {
              ...(v_f04727.personaAge ? { age: v_f04727.personaAge } : {}),
              ...(v_f04727.personaGender ? { gender: v_f04727.personaGender } : {}),
              ...(v_f04727.personaTypes && v_f04727.personaTypes.length > 0
                ? { types: v_f04727.personaTypes.join(',') }
                : {}),
              ...(v_f04727.personaMbti ? { mbti: v_f04727.personaMbti } : {}),
            },
            notes: v_f04727.personaNotes ?? '',
          },
        });
        console.log('[CLONE-CREATE] success:', v_28eeb6);

        const clone: v_affcc0 = {
          id: v_28eeb6.id,
          cloneType: v_f04727.cloneType!,
          ownerId: v_493eec,
          displayName: v_28eeb6.name,
          description: v_f04727.description ?? '',
          interests: v_f04727.interests ?? [],
          imageUrl: v_f04727.imageFile ?? undefined,
          visibility: v_28eeb6.visibility,
          status: v_01a739 && v_f9c770 ? 'active' : 'pending_assets',
          createdAt: v_28eeb6.created_at,
        };
        v_956393(v_eb25ce);
        if (!v_2008a4) {
          v_67122d(v_28eeb6.id);
          v_c7169b(false);
        }
      } catch (v_49263d) {
        console.warn('[CLONE-CREATE] failed:', v_49263d);
        if (v_2008a4) return;
        let v_badeaf = '페르소나 생성 중 오류가 발생했습니다.';
        if (v_49263d instanceof v_84a859) {
          if (v_49263d.code === 'QUOTA_EXCEEDED') {
            v_badeaf = '같은 타입의 페르소나는 1개까지만 생성할 수 있어요.';
          } else if (v_49263d.code === 'CONFLICT') {
            v_badeaf = '이미 사용 중인 username 이에요. 다시 시도해주세요.';
          } else {
            v_badeaf = v_49263d.message;
          }
        }
        v_3a7d09(v_badeaf);
        v_c7169b(false);
        v_03e392.alert('생성 실패', v_badeaf);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, []); 

  const v_b38746 = v_549a47[v_f04727.cloneType ?? 'friend'];

  const v_791884 = () => {
    if (v_af4871 == null) return;
    v_7a77e1();
    v_c65f5d.replace('Step8', { cloneId: v_af4871 });
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
          <View style={[v_d81136.successCircle, v_5e9bfe && { backgroundColor: v_1bfbd0.error }]}>
            {v_805753 ? (
              <ActivityIndicator size="large" color={v_1bfbd0.white} />
            ) : v_5e9bfe ? (
              <Feather name="alert-triangle" size={48} color={v_1bfbd0.white} />
            ) : (
              <Feather name="check" size={48} color={v_1bfbd0.white} />
            )}
          </View>

          <Text style={v_d81136.title}>
            {v_805753 ? '페르소나를 만들고 있어요...' : v_5e9bfe ? '생성 실패' : v_b38746.title}
          </Text>
          <Text style={v_d81136.subtitle}>{v_5e9bfe ?? v_b38746.sub}</Text>

          {}
          {!v_805753 && !v_5e9bfe && v_1fc273.map((v_95a1b5, v_ebec57) => (
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
        <Button
          title="소개 영상 만들기"
          onPress={v_791884}
          variant="accent"
          disabled={v_805753 || !!v_5e9bfe || v_af4871 == null}
          leftIcon={<Feather name="message-circle" size={20} color={v_1bfbd0.white} />}
        />
        <Button
          title="나의 페르소나로 돌아가기"
          onPress={v_704242}
          variant="ghost"
        />
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

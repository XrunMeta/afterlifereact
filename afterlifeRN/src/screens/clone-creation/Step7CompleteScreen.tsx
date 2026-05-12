import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095, v_de06a3 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_39a996,
  v_03e392,
  v_aa7413,
  v_09d0e5,
  v_79c4f2,
  v_4623af,
  v_e767d1,
  v_326be8,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
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
import { v_7d2692 } from "../../api/files";

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
  const { t: v_8d41d7 } = v_772971();
  const v_7a77e1 = v_194498((v_fd5f43) => v_fd5f43.resetCreationDraft);
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_956393 = v_194498((v_fd5f43) => v_fd5f43.addClone);
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? 1;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_af4871, v_67122d] = v_5ab095<number | null>(null);
  const [v_805753, v_c7169b] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const [v_db004a, v_148b42] = v_5ab095(false);
  const [v_2b566e, v_26e048] = v_5ab095<number>(100);
  const [v_c924cc, v_d0452a] = v_5ab095("");
  const [v_904d6c, v_a8bf66] = v_5ab095(false);
  const [v_8a43e1, v_04103a] = v_5ab095<string | null>(null);
  const v_b12f33 = v_e662ae(false);

  const v_6de415 = v_e662ae<string | undefined>(undefined);

  const v_140aea = v_de06a3(
    async (v_6bee94) => {
      if (!v_f04727.cloneType || !v_2ca7e0) return;
      const v_01a739 = Boolean(v_f04727.imageFile);
      const v_f9c770 = Boolean(
        v_f04727.voiceFile || v_f04727.voiceSampleId || (v_f04727.recordDuration ?? 0) >= 30,
      );
      const v_818579 = v_f04727.visibility ?? v_c4c43f(v_f04727.cloneType).defaultVisibility;

      const v_6be727 = /^[a-z0-9_]+$/;
      const v_ae88f2 = v_f04727.username?.trim() ?? "";
      const v_a71df8 = v_ae88f2.length >= 3 && v_ae88f2.length <= 30 && v_6be727.test(v_ae88f2);
      const v_556427 = v_a71df8 ? v_ae88f2 : v_b55477(v_ae88f2 || v_f04727.name || "user");

      const v_55a58f = {
        ...(v_f04727.personaAge ? { age: v_f04727.personaAge } : {}),
        ...(v_f04727.personaGender ? { gender: v_f04727.personaGender } : {}),
        ...(v_f04727.personaTypes && v_f04727.personaTypes.length > 0
          ? { personalities: v_f04727.personaTypes.join(",") }
          : {}),
        ...(v_f04727.personaMbti ? { mbti: v_f04727.personaMbti } : {}),
      };
      const v_564b6a = { attrs: v_55a58f, notes: v_f04727.personaNotes ?? "" };

      let v_bf6b43 = v_6de415.current;
      if (!v_bf6b43 && v_f04727.imageFile) {
        try {
          const v_40a923 = v_f04727.imageFile.split(".").pop()?.toLowerCase() ?? "";
          const v_b66751 =
            v_40a923 === "png" ? "image/png"
            : v_40a923 === "webp" ? "image/webp"
            : v_40a923 === "gif" ? "image/gif"
            : "image/jpeg";
          const v_57ac81 = await v_7d2692(v_2ca7e0, v_f04727.imageFile, {
            purpose: "clone_avatar",
            mimeType: v_b66751,
            fileName: `avatar.${v_40a923 || "jpg"}`,
          });
          v_bf6b43 = v_57ac81.url;
          v_6de415.current = v_bf6b43;
          console.log("[CLONE-CREATE] avatar uploaded:", v_bf6b43);
        } catch (v_9b4b36) {
          console.warn("[CLONE-CREATE] avatar upload failed:", v_9b4b36);
        }
      }

      const v_8f00b9 = await v_39eaf5(v_2ca7e0, {
        clone_type: v_f04727.cloneType,
        name: v_f04727.name ?? "Untitled",
        username: v_556427,
        description: v_f04727.description || undefined,
        category: v_f04727.category || undefined,
        visibility: v_818579,
        interests: v_f04727.interests && v_f04727.interests.length > 0 ? v_f04727.interests : undefined,
        l1_profile: v_564b6a,
        ...(v_bf6b43 ? { avatar_url: v_bf6b43 } : {}),
        ...(v_6bee94 ? { pin: v_6bee94 } : {}),
      });
      console.log("[CLONE-CREATE] success:", v_8f00b9);
      const v_94519a = v_8f00b9.clone;

      const clone: v_affcc0 = {
        id: v_94519a.id,
        cloneType: v_94519a.cloneType,
        ownerId: v_493eec,
        displayName: v_94519a.name,
        description: v_f04727.description ?? "",
        interests: v_f04727.interests ?? [],
        imageUrl: v_bf6b43 ?? v_f04727.imageFile ?? undefined,
        visibility: v_94519a.visibility,
        status: v_01a739 && v_f9c770 ? "active" : "pending_assets",
        createdAt: v_94519a.createdAt,
        l1Profile: v_564b6a,
      };
      v_956393(v_eb25ce);
      if (!v_b12f33.current) {
        v_67122d(v_94519a.id);
        v_c7169b(false);
      }
    },
    [v_f04727, v_2ca7e0, v_493eec, v_956393],
  );

  v_c4deb2(() => {
    if (!v_f04727.cloneType) return;
    v_b12f33.current = false;
    (async () => {
      v_c7169b(true);
      v_3a7d09(null);

      const v_01a739 = Boolean(v_f04727.imageFile);
      const v_f9c770 = Boolean(v_f04727.voiceFile || v_f04727.voiceSampleId
        || (v_f04727.recordDuration ?? 0) >= 30);
      const v_818579 = v_f04727.visibility ?? v_c4c43f(v_f04727.cloneType!).defaultVisibility;

      if (!v_2ca7e0) {
        const v_17d8be = Date.now();
        const v_5ccd43 = {
          ...(v_f04727.personaAge ? { age: v_f04727.personaAge } : {}),
          ...(v_f04727.personaGender ? { gender: v_f04727.personaGender } : {}),
          ...(v_f04727.personaTypes && v_f04727.personaTypes.length > 0
            ? { personalities: v_f04727.personaTypes.join(',') }
            : {}),
          ...(v_f04727.personaMbti ? { mbti: v_f04727.personaMbti } : {}),
        };
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
          l1Profile: { attrs: v_5ccd43, notes: v_f04727.personaNotes ?? '' },
        };
        v_956393(v_eb25ce);
        if (!v_b12f33.current) {
          v_67122d(v_17d8be);
          v_c7169b(false);
        }
        return;
      }

      try {
        await v_140aea();
      } catch (v_49263d) {
        if (v_b12f33.current) return;
        if (v_49263d instanceof v_84a859) {
          console.warn(
            '[CLONE-CREATE] failed:',
            v_49263d.code,
            v_49263d.message,
            'details=',
            JSON.stringify(v_49263d.details),
          );
          if (v_49263d.code === 'PAYMENT_REQUIRED') {

            const v_5ab5bd = (v_49263d.details ?? {}) as { priceXrun?: number };
            if (typeof v_5ab5bd.priceXrun === 'number') v_26e048(v_5ab5bd.priceXrun);
            v_148b42(true);
            v_c7169b(false);
            return;
          }
          let v_badeaf = v_8d41d7('create.errors.createFailed');
          if (v_49263d.code === 'QUOTA_EXCEEDED') {
            v_badeaf = v_8d41d7('create.errors.quotaExceeded');
          } else if (v_49263d.code === 'CONFLICT') {
            v_badeaf = v_49263d.message || v_8d41d7('create.errors.usernameConflict');
          } else {
            v_badeaf = v_49263d.message;
          }
          v_3a7d09(v_badeaf);
          v_c7169b(false);
          v_03e392.alert(v_8d41d7('create.complete.createFailed'), v_badeaf);
        } else {
          console.warn('[CLONE-CREATE] failed:', v_49263d);
          v_3a7d09(v_8d41d7('create.errors.createFailed'));
          v_c7169b(false);
        }
      }
    })();
    return () => {
      v_b12f33.current = true;
    };
  }, [v_140aea, v_f04727.cloneType]); 

  const v_3a8949 = v_f04727.cloneType ?? 'friend';
  const v_b38746 = {
    title: v_8d41d7(`create.complete.${v_3a8949}Title` as
      | 'create.complete.memlowTitle'
      | 'create.complete.friendTitle'
      | 'create.complete.mentorTitle'
      | 'create.complete.celebTitle'),
    sub: v_8d41d7(`create.complete.${v_3a8949}Sub` as
      | 'create.complete.memlowSub'
      | 'create.complete.friendSub'
      | 'create.complete.mentorSub'
      | 'create.complete.celebSub'),
  };
  const v_ba68bf = [
    { icon: 'refresh-cw' as const, title: v_8d41d7('create.complete.featAutoLearn'), desc: v_8d41d7('create.complete.featAutoLearnDesc') },
    { icon: 'shield' as const, title: v_8d41d7('create.complete.featSecurity'), desc: v_8d41d7('create.complete.featSecurityDesc') },
  ];

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

  const v_24584b = async () => {
    if (!/^\d{6}$/.test(v_c924cc)) {
      v_04103a("PIN 6자리를 입력해 주세요");
      return;
    }
    v_a8bf66(true);
    v_04103a(null);
    try {
      v_c7169b(true);
      await v_140aea(v_c924cc);
      v_148b42(false);
    } catch (v_49263d) {
      let v_badeaf = "결제에 실패했어요.";
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "UNAUTHENTICATED") v_badeaf = "결제 비밀번호가 일치하지 않아요";
        else if (v_49263d.code === "INSUFFICIENT_FUNDS") v_badeaf = "XRUN 잔액이 부족해요";
        else if (v_49263d.code === "CONFLICT") v_badeaf = v_49263d.message;
        else if (v_49263d.code === "UPSTREAM_NOT_IMPLEMENTED")
          v_badeaf = "xrun 송금 기능이 아직 준비 중입니다";
        else v_badeaf = v_49263d.message;
      }
      v_04103a(v_badeaf);
      v_c7169b(false);
    } finally {
      v_a8bf66(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader title={v_8d41d7('create.stepTitles.7')} />
      <StepIndicator currentStep={6} totalSteps={6} />

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
            {v_805753 ? v_8d41d7('create.complete.creating') : v_5e9bfe ? v_8d41d7('create.complete.createFailed') : v_b38746.title}
          </Text>
          <Text style={v_d81136.subtitle}>{v_5e9bfe ?? v_b38746.sub}</Text>

          {}
          {!v_805753 && !v_5e9bfe && v_ba68bf.map((v_95a1b5, v_ebec57) => (
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
          title={v_8d41d7('create.complete.startVideo')}
          onPress={v_791884}
          variant="accent"
          disabled={v_805753 || !!v_5e9bfe || v_af4871 == null}
          leftIcon={<Feather name="message-circle" size={20} color={v_1bfbd0.white} />}
        />
        <Button
          title={v_8d41d7('create.complete.goDashboard')}
          onPress={v_704242}
          variant="ghost"
        />
      </View>

      {}
      <Modal visible={v_db004a} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={v_326be8.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            style={v_9b1720.overlay}
            onPress={() => !v_904d6c && v_148b42(false)}
          >
            <Pressable style={v_9b1720.box} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
              <View style={v_9b1720.iconWrap}>
                <Feather name="credit-card" size={26} color={v_1bfbd0.violet600} />
              </View>
              <Text style={v_9b1720.title}>페르소나 생성 결제</Text>
              <Text style={v_9b1720.desc}>
                두 번째 페르소나부터 {v_2b566e} XRUN 이 부과돼요{"\n"}
                결제 비밀번호 6자리를 입력해 주세요
              </Text>
              <TextInput
                style={v_9b1720.input}
                value={v_c924cc}
                onChangeText={(v_81e2ef) => v_d0452a(v_81e2ef.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN 6자리"
                placeholderTextColor={v_1bfbd0.zinc400}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                autoFocus
                editable={!v_904d6c}
              />
              {v_8a43e1 && <Text style={v_9b1720.error}>{v_8a43e1}</Text>}
              <View style={v_9b1720.btns}>
                <TouchableOpacity
                  style={v_9b1720.cancel}
                  onPress={() => v_148b42(false)}
                  disabled={v_904d6c}
                >
                  <Text style={v_9b1720.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[v_9b1720.confirm, (v_c924cc.length !== 6 || v_904d6c) && v_9b1720.disabled]}
                  onPress={v_24584b}
                  disabled={v_c924cc.length !== 6 || v_904d6c}
                >
                  <Text style={v_9b1720.confirmText}>
                    {v_904d6c ? "결제 중..." : `${v_2b566e} XRUN 결제`}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeView>
  );
}

const v_9b1720 = v_472849.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 10 },
  desc: { fontSize: 13, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 4,
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.zinc50,
    marginBottom: 12,
  },
  error: { fontSize: 12, color: "#ef4444", marginBottom: 12, textAlign: "center" },
  btns: { flexDirection: "row", gap: 8, width: "100%" },
  cancel: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: v_1bfbd0.zinc200, alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc600 },
  confirm: {
    flex: 1.5, paddingVertical: 12, borderRadius: 10,
    backgroundColor: v_1bfbd0.violet600, alignItems: "center",
  },
  confirmText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },
  disabled: { backgroundColor: v_1bfbd0.zinc300 },
});

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

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import { useCloneStore } from "../../stores/cloneStore";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { Clone } from "../../types/clone";
import { getCloneTypeMeta } from "../../mocks/cloneTypeCatalog";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step7">;
};

const FEATURES = [
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

const COPY: Record<'memlow' | 'friend' | 'mentor' | 'celeb', { title: string; sub: string }> = {
  memlow: { title: '추억을 이어가요',     sub: '편지가 도착했을 때 함께 읽어봐요.' },
  friend: { title: '친구가 준비됐어요',   sub: '첫 대화를 시작해 볼까요?' },
  mentor: { title: '멘토가 준비됐어요',   sub: '분야별 질문을 남겨 보세요.' },
  celeb:  { title: '팬클럽이 시작됐어요', sub: '첫 메시지를 남겨 보세요.' },
};

export default function Step7CompleteScreen({ navigation }: Props) {
  const resetCreationDraft = useCloneStore((s) => s.resetCreationDraft);
  const draft = useCloneStore((s) => s.creationDraft);
  const addClone = useCloneStore((s) => s.addClone);

  useEffect(() => {
    if (!draft.cloneType) return;
    const hasImage = Boolean(draft.imageFile);
    const hasVoice = Boolean(draft.voiceFile || draft.voiceSampleId
      || (draft.recordDuration ?? 0) >= 30);
    const typeLabelMap = {
      memlow: '멤로우', friend: '친구', mentor: '멘토', celeb: '셀럽',
    } as const;
    const clone: Clone = {
      id: `clone-${Date.now()}`,
      name: draft.name ?? '',
      username: draft.username ?? '',
      avatarUrl: draft.imageFile ?? '',
      coverImageUrl: draft.imageFile ?? '',
      type: typeLabelMap[draft.cloneType],
      category: draft.category ?? '',
      interests: draft.interests ?? [],
      description: draft.description ?? '',
      visibility: draft.visibility ?? getCloneTypeMeta(draft.cloneType).defaultVisibility,
      learningProgress: 0,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      status: hasImage && hasVoice ? 'active' : 'pending_assets',
    };
    addClone(clone);
  }, []); 

  const copy = COPY[draft.cloneType ?? 'friend'];

  const handleStartChat = () => {
    resetCreationDraft();

    navigation.getParent()?.dispatch(
      CommonActions.navigate({ name: "ClonesTab" })
    );
  };

  const handleGoToDashboard = () => {
    resetCreationDraft();
    navigation.getParent()?.dispatch(
      CommonActions.navigate({ name: "ClonesTab" })
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader title="생성 완료" stepInfo={{ current: 7, total: 7 }} />
      <StepIndicator currentStep={7} totalSteps={7} />

      <SafeScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showBottomBackground={false}>
        <View style={styles.container}>
          {}
          <View style={styles.successCircle}>
            <Feather name="check" size={48} color={COLORS.white} />
          </View>

          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.sub}</Text>

          {}
          {FEATURES.map((feat, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIconBox}>
                <Feather name={feat.icon as any} size={22} color={COLORS.violet500} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </SafeScrollView>

      {}
      <View style={styles.bottomBar}>
        <Button title="첫 대화 시작하기" onPress={handleStartChat} variant="accent" leftIcon={<Feather name="message-circle" size={20} color={COLORS.white} />} />
        <Button title="나의 페르소나로 돌아가기" onPress={handleGoToDashboard} variant="ghost" />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.xxxlarge,
  },
  container: { width: "100%", maxWidth: 780, alignItems: "center", gap: SIZES.large },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.zinc900 },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
  featureCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc50,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  featureDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  bottomBar: {
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.medium,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
  },
});

import React from "react";
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

export default function Step7CompleteScreen({ navigation }: Props) {
  const resetCreationDraft = useCloneStore((s) => s.resetCreationDraft);

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

          <Text style={styles.title}>페르소나가 생성되었어요!</Text>
          <Text style={styles.subtitle}>
            이제 대화를 시작하여 페르소나를 더 성장시켜보세요
          </Text>

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

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import { useCloneStore } from "../../stores/cloneStore";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step5">;
};

const OPTIONS: { value: "public" | "followers" | "private"; icon: string; title: string; desc: string }[] = [
  { value: "public", icon: "globe", title: "전체 공개", desc: "모든 사용자가 이 페르소나를 볼 수 있습니다" },
  { value: "followers", icon: "users", title: "팔로워 공개", desc: "나를 팔로우한 사용자만 볼 수 있습니다" },
  { value: "private", icon: "lock", title: "비공개", desc: "나만 볼 수 있습니다" },
];

export default function Step5VisibilityScreen({ navigation }: Props) {
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");

  const handleNext = () => {
    setCreationDraft({ visibility });
    navigation.navigate("Step6");
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="공개 범위"
        showBackButton
        onBackPress={() => navigation.goBack()}
        stepInfo={{ current: 5, total: 7 }}
      />
      <StepIndicator currentStep={5} totalSteps={7} />

      <SafeScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showBottomBackground={false}>
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>누구에게 공개할까요?</Text>
          <Text style={styles.subtitle}>나중에 언제든 변경할 수 있습니다</Text>

          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionCard, visibility === opt.value && styles.optionCardActive]}
              onPress={() => setVisibility(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, visibility === opt.value && styles.iconBoxActive]}>
                <Feather
                  name={opt.icon as any}
                  size={24}
                  color={visibility === opt.value ? COLORS.white : COLORS.zinc500}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, visibility === opt.value && styles.optionTitleActive]}>
                  {opt.title}
                </Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, visibility === opt.value && styles.radioActive]}>
                {visibility === opt.value && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeScrollView>

      <View style={styles.bottomBar}>
        <Button title="다음 단계로 이동" onPress={handleNext} />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.xlarge },
  container: { width: "100%", maxWidth: 780, gap: SIZES.medium },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  subtitle: { fontSize: 13, color: COLORS.zinc500, marginTop: -4 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    gap: 14,
  },
  optionCardActive: { borderColor: COLORS.violet500, backgroundColor: COLORS.violet100 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: { backgroundColor: COLORS.violet500 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  optionTitleActive: { color: COLORS.violet600 },
  optionDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.zinc300,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: COLORS.violet500 },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.violet500 },
  bottomBar: { paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.medium, borderTopWidth: 1, borderTopColor: COLORS.zinc200 },
});

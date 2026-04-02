import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import InterestChip from "../../components/ui/InterestChip";
import { useCloneStore } from "../../stores/cloneStore";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import TextField from "../../components/ui/TextField";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step1">;
};

import { CATEGORIES, INTEREST_MAP } from "../../mocks/interestHelpers";

export default function Step1CloneTypeScreen({ navigation }: Props) {
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");

  const interests = selectedCategory ? INTEREST_MAP[selectedCategory] ?? [] : [];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests((prev) => [...prev, trimmed]);
      setCustomInterest("");
    }
  };

  const handleNext = () => {
    setCreationDraft({
      category: selectedCategory,
      interests: selectedInterests,
    });
    navigation.navigate("Step2");
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="클론 생성"
        showBackButton
        onBackPress={() => {
          const parent = navigation.getParent();

          parent?.navigate("HomeTab" as never);
        }}
        stepInfo={{ current: 1, total: 7 }}
      />
      <StepIndicator currentStep={1} totalSteps={7} />

      <SafeScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        autoAdjustKeyboardPadding={true}
        showBottomBackground={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {}
          <Text style={styles.sectionTitle}>카테고리 선택</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.id && styles.categoryCardActive,
                ]}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setSelectedInterests([]);
                }}
                activeOpacity={0.7}
              >

                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          {interests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>관심사 선택</Text>
              <View style={styles.chipGrid}>
                {interests.map((interest) => (
                  <InterestChip
                    key={interest}
                    label={interest}
                    selected={selectedInterests.includes(interest)}
                    onPress={() => toggleInterest(interest)}
                  />
                ))}
                {}
                {selectedInterests
                  .filter((i) => !interests.includes(i))
                  .map((interest) => (
                    <InterestChip
                      key={interest}
                      label={interest}
                      selected
                      onPress={() => toggleInterest(interest)}
                    />
                  ))}
              </View>

              {}
              <View style={styles.customRow}>
                <TextField
                  value={customInterest}
                  onChangeText={setCustomInterest}
                  placeholderTextColor={COLORS.zinc400}
                  onSubmitEditing={addCustomInterest}
                  placeholder="커스텀 관심사 추가"
                  containerStyle={styles.customInput}
                />
                <TouchableOpacity
                  onPress={addCustomInterest}
                  style={styles.addButton}
                >
                  <Feather name="plus" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeScrollView>

      {}
      <View style={styles.bottomBar}>
        <Button title="다음 단계로 이동" onPress={handleNext} disabled={selectedInterests.length === 0} />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.xlarge,
  },
  container: { width: "100%", maxWidth: 780, gap: SIZES.xlarge },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
    alignItems: "center",
    gap: 8,
  },
  categoryCardActive: {
    borderColor: COLORS.violet500,
    backgroundColor: COLORS.violet100,
  },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.zinc700,
    textAlign: "center",
  },
  categoryLabelActive: { color: COLORS.violet600 },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  customInput: {
    flex: 1,
    minWidth: 0,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Button from "../../components/ui/Button";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import TextField from "../../components/ui/TextField";
import { useCloneStore } from "../../stores/cloneStore";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step2">;
};

const AGE_RANGES = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
const GENDERS = ["남성", "여성", "기타"];
const PERSONALITIES = ["따뜻한", "유머러스", "차분한", "열정적", "지적인", "감성적", "낙천적", "신중한"];
const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];

export default function Step2BasicInfoScreen({ navigation }: Props) {
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);

  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [mbti, setMbti] = useState("");
  const [description, setDescription] = useState("");

  const togglePersonality = (p: string) => {
    setPersonalities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const isValid = name.trim() && ageRange && gender;

  const handleNext = () => {
    setCreationDraft({ name, description });
    navigation.navigate("Step3");
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="기본 정보"
        showBackButton
        onBackPress={() => navigation.goBack()}
        stepInfo={{ current: 2, total: 7 }}
      />
      <StepIndicator currentStep={2} totalSteps={7} />

      <SafeScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        showBottomBackground={false}
        autoAdjustKeyboardPadding={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {}
          <TextField placeholder="페르소나 이름" value={name} onChangeText={setName} />

          {}
          <Text style={styles.label}>나이대</Text>
          <View style={styles.chipRow}>
            {AGE_RANGES.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, ageRange === a && styles.chipActive]}
                onPress={() => setAgeRange(a)}
              >
                <Text style={[styles.chipText, ageRange === a && styles.chipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={styles.label}>성별</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={styles.label}>성격 유형 (복수 선택)</Text>
          <View style={styles.chipRow}>
            {PERSONALITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, personalities.includes(p) && styles.chipActive]}
                onPress={() => togglePersonality(p)}
              >
                <Text style={[styles.chipText, personalities.includes(p) && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={styles.label}>MBTI (선택)</Text>
          <View style={styles.mbtiGrid}>
            {MBTI_TYPES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.mbtiItem, mbti === m && styles.mbtiItemActive]}
                onPress={() => setMbti(mbti === m ? "" : m)}
              >
                <Text style={[styles.mbtiText, mbti === m && styles.mbtiTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={styles.label}>페르소나 소개</Text>
          <TextField
            value={description}
            onChangeText={setDescription}
            placeholder="이 페르소나는 어떤 사람인가요?"
            placeholderTextColor={COLORS.zinc400}
            rounded={RADIUS.lg}
            multiline
            scrollEnabled
            numberOfLines={4}
            inputWrapperStyle={styles.textareaWrapper}
            style={styles.textareaInput}
          />
        </View>
      </SafeScrollView>

      <View style={styles.bottomBar}>
        <Button title="다음 단계로 이동" onPress={handleNext} disabled={!isValid} />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.xlarge },
  container: { width: "100%", maxWidth: 780, gap: SIZES.large },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.zinc900, borderColor: COLORS.zinc900 },
  chipText: { fontSize: 13, color: COLORS.zinc700 },
  chipTextActive: { color: COLORS.white, fontWeight: "600" },
  mbtiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mbtiItem: {
    width: "22%",
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
  },
  mbtiItemActive: { backgroundColor: COLORS.violet500, borderColor: COLORS.violet500 },
  mbtiText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc600 },
  mbtiTextActive: { color: COLORS.white },
  textareaWrapper: {
    minHeight: 140,
    borderColor: COLORS.zinc200,
    marginBottom: SIZES.xlarge,
  },
  textareaInput: {
    minHeight: 96,
    fontSize: 15,
    color: COLORS.zinc900,
  },
  bottomBar: { paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.medium, borderTopWidth: 1, borderTopColor: COLORS.zinc200 },
});

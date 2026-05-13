

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { useCloneStore } from "../../stores/cloneStore";
import { deriveUsernameFromName } from "../../api/clones";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step6">;
};

type Phase = "name" | "username" | "personality";

export default function Step6CreatingScreen({ navigation }: Props) {
  useTranslation();
  const draft = useCloneStore((s) => s.creationDraft);
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);

  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState<string>(draft.name ?? "");
  const [username, setUsername] = useState<string>(draft.username ?? "");
  const [personality, setPersonality] = useState<string>(draft.personaNotes ?? "");

  const goNext = () => {
    if (phase === "name") {
      const trimmed = name.trim();
      if (!trimmed) return;
      setCreationDraft({ name: trimmed });
      setPhase("username");
    } else if (phase === "username") {

      const raw = username.trim();
      const resolved = raw.length >= 3
        ? raw.toLowerCase().replace(/[^a-z0-9_]/g, "_")
        : deriveUsernameFromName(name.trim());
      setUsername(resolved);
      setCreationDraft({ username: resolved });
      setPhase("personality");
    } else if (phase === "personality") {
      setCreationDraft({ personaNotes: personality.trim() });

      navigation.navigate("Step7");
    }
  };

  const goBack = () => {
    if (phase === "username") setPhase("name");
    else if (phase === "personality") setPhase("username");
    else navigation.goBack();
  };

  const canProceed = phase === "name" ? name.trim().length > 0
    : phase === "username" ? true 
    : phase === "personality" ? true 
    : false;

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="페르소나 만들기"
        showBackButton
        onBackPress={goBack}
      />
      <StepIndicator currentStep={3} totalSteps={4} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {

}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.formWrap}>
            {phase === "name" && (
              <>
                <Text style={styles.qLabel}>1 / 3</Text>
                <Text style={styles.qTitle}>페르소나의 이름은 무엇인가요?</Text>
                <Text style={styles.qDesc}>다른 사용자에게 표시될 이름입니다.</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="예: 김프로"
                  placeholderTextColor={COLORS.zinc400}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={goNext}
                  maxLength={40}
                />
              </>
            )}

            {phase === "username" && (
              <>
                <Text style={styles.qLabel}>2 / 3</Text>
                <Text style={styles.qTitle}>클론 아이디를 정해주세요</Text>
                <Text style={styles.qDesc}>
                  영문 소문자/숫자/언더스코어. 비워두면 이름에서 자동 생성됩니다.
                </Text>
                <View style={styles.handleRow}>
                  <Text style={styles.handlePrefix}>@</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={username}
                    onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                    placeholder="kimpro123"
                    placeholderTextColor={COLORS.zinc400}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={goNext}
                    maxLength={30}
                  />
                </View>
              </>
            )}

            {phase === "personality" && (
              <>
                <Text style={styles.qLabel}>3 / 3</Text>
                <Text style={styles.qTitle}>어떤 성격인가요?</Text>
                <Text style={styles.qDesc}>
                  말투, 좋아하는 것, 평소 분위기 등을 자유롭게 적어주세요.
                </Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={personality}
                  onChangeText={setPersonality}
                  placeholder="예: 차분하고 따뜻한 말투로 대화해요. 책 읽기와 산책을 좋아합니다."
                  placeholderTextColor={COLORS.zinc400}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.btn, !canProceed && styles.btnDisabled]}
            onPress={goNext}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {phase === "personality" ? "생성 시작" : "다음"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({

  formWrap: { flex: 1, paddingHorizontal: SIZES.xlarge, paddingTop: 32 },
  qLabel: { fontSize: 12, fontWeight: "700", color: COLORS.violet600, marginBottom: 8 },
  qTitle: { fontSize: 22, fontWeight: "700", color: COLORS.zinc900, marginBottom: 8 },
  qDesc: { fontSize: 13, color: COLORS.zinc500, marginBottom: 20, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.zinc900,
    backgroundColor: COLORS.zinc50,
  },
  textarea: { minHeight: 140, paddingTop: 12 },
  handleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  handlePrefix: { fontSize: 18, color: COLORS.zinc500, fontWeight: "600" },

  bottomBar: { padding: SIZES.large, borderTopWidth: 1, borderTopColor: COLORS.zinc100 },
  btn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});

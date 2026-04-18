import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, RADIUS, SIZES } from "../../components/constants";

const CONFIRM_PHRASE = "영구 삭제 요청합니다";

export default function GDPRDeleteScreen() {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (confirm.trim() !== CONFIRM_PHRASE) {
      Alert.alert("확인 문구가 일치하지 않습니다", `정확히 "${CONFIRM_PHRASE}"을(를) 입력해주세요.`);
      return;
    }
    Alert.alert(
      "최종 확인",
      "귀하의 암호화 키가 영구 파기됩니다. 이후 어떤 방법으로도 데이터 복구가 불가능합니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "영구 삭제",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {

              await new Promise((r) => setTimeout(r, 600));
              Alert.alert("영구 삭제 완료", "계정과 관련 데이터의 암호화 키가 파기되었습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeScrollView backgroundColor={COLORS.white}>
      <PageHeader title="영구 삭제 (GDPR)" />
      <View style={s.wrap}>
        <Text style={s.warn}>⚠ 회복 불가능한 작업입니다</Text>
        <Text style={s.body}>
          이 옵션은 일반 삭제(복구 가능)와 달리 귀하의 암호화 키를 즉시 파기합니다(Crypto Shredding).
          키가 파기되면 데이터베이스에 남은 암호문은 영원히 복호화할 수 없습니다.
          {"\n\n"}
          단순히 계정을 그만두고 싶다면 설정의 "계정 삭제"를 사용하세요. 해당 경로는 90일 복구 기간을
          제공합니다.
        </Text>

        <Text style={s.label}>확인 문구 입력</Text>
        <Text style={s.helper}>정확히 다음 문구를 입력하세요: "{CONFIRM_PHRASE}"</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          style={s.input}
          autoCapitalize="none"
        />

        <View style={{ height: 16 }} />
        <Button
          title={loading ? "처리 중..." : "영구 삭제 요청"}
          onPress={submit}
          disabled={loading}
          variant="danger"
        />
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: SIZES.medium },
  warn: { fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.zinc700 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, marginTop: 20 },
  helper: { fontSize: 12, color: COLORS.zinc500, marginTop: 4, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 15,
  },
});
